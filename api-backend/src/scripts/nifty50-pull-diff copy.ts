import "reflect-metadata";
import { AppDataSource } from "@root/data-source";
import { NiftyStockPrice } from "@entities/NiftyStockPrice";
import { NiftyStockPriceDiff } from "@entities/NiftyStockPriceDiff";

const BATCH_SIZE = 500;

// ✅ Single source of truth for date normalization
function normalizeDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

// ✅ percentage helper
function calcPct(curr: number, prev: number | null): number | undefined {
  if (prev === null || prev === 0) return undefined;
  return ((curr - prev) / prev) * 100;
}

async function run() {
  await AppDataSource.initialize();
  console.log("🚀 Processing missing diffs (fixed + deterministic)...");

  const priceRepo = AppDataSource.getRepository(NiftyStockPrice);
  const diffRepo = AppDataSource.getRepository(NiftyStockPriceDiff);

  // 🔹 Step 1: Load all prices
  const allPrices = await priceRepo.find({
    order: { trade_date: "ASC" },
  });

  console.log(`Total price rows: ${allPrices.length}`);

  // 🔹 Step 2: Build previous-day map using date keys (NOT array index assumption)
  const prevMap = new Map<string, NiftyStockPrice>();

  for (let i = 0; i < allPrices.length; i++) {
    const curr = allPrices[i];
    const prev = allPrices[i - 1];

    const key = normalizeDate(curr.trade_date);
    if (prev) {
      prevMap.set(key, prev);
    }
  }

  // 🔹 Step 3: Load already processed dates
  const existingRows = await diffRepo
    .createQueryBuilder("d")
    .select(["d.trade_date"])
    .getRawMany();

  const existingSet = new Set<string>(
    existingRows.map((r) => {
      const val = r.d_trade_date ?? r.trade_date;
      return normalizeDate(val);
    }),
  );

  console.log(`Already processed: ${existingSet.size}`);

  let batch: Partial<NiftyStockPriceDiff>[] = [];
  let processed = 0;

  // 🔹 Step 4: Process missing rows only
  for (const current of allPrices) {
    const key = normalizeDate(current.trade_date);

    if (!key || existingSet.has(key)) continue;

    const prev = prevMap.get(key);

    batch.push({
      trade_date: current.trade_date,

      open_diff: prev ? current.open - prev.open : undefined,
      high_diff: prev ? current.high - prev.high : undefined,
      low_diff: prev ? current.low - prev.low : undefined,
      close_diff: prev ? current.close - prev.close : undefined,
      shares_traded_diff: prev
        ? current.shares_traded - prev.shares_traded
        : undefined,
      turnover_cr_diff: prev
        ? current.turnover_cr - prev.turnover_cr
        : undefined,

      open_diff_pct: prev ? calcPct(current.open, prev.open) : undefined,
      high_diff_pct: prev ? calcPct(current.high, prev.high) : undefined,
      low_diff_pct: prev ? calcPct(current.low, prev.low) : undefined,
      close_diff_pct: prev ? calcPct(current.close, prev.close) : undefined,
      shares_traded_diff_pct: prev
        ? calcPct(current.shares_traded, prev.shares_traded)
        : undefined,
      turnover_cr_diff_pct: prev
        ? calcPct(current.turnover_cr, prev.turnover_cr)
        : undefined,
    });

    processed++;

    // 🔹 Batch insert
    if (batch.length >= BATCH_SIZE) {
      await diffRepo.upsert(batch, ["trade_date"]);

      for (const row of batch) {
        existingSet.add(normalizeDate(row.trade_date));
      }

      console.log(`Upserted ${batch.length}`);
      batch = [];
    }
  }

  // 🔹 Final flush
  if (batch.length > 0) {
    await diffRepo.upsert(batch, ["trade_date"]);

    for (const row of batch) {
      existingSet.add(normalizeDate(row.trade_date));
    }

    console.log(`Upserted ${batch.length}`);
  }

  console.log(`✅ Done. New rows processed: ${processed}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
