import "reflect-metadata";
import { AppDataSource } from "@root/data-source";
import { SensexStockPriceDiff } from "@entities/SensexStockPriceDiff";

const BATCH_SIZE = 1000;

async function run() {
  await AppDataSource.initialize();

  console.log("🚀 Incremental SQL diff pipeline starting...");

  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();

  // 🔥 Step 1: get last processed trade_date
  const lastRow = await queryRunner.query(`
    SELECT MAX(trade_date) AS last_date
    FROM sensex_stock_prices_diff
  `);

  const lastDate = lastRow?.[0]?.last_date;

  console.log("📅 Last processed date:", lastDate);

  // 🔥 Step 2: compute diffs only for NEW data + previous row included
  const diffRows = await queryRunner.query(
    `
    WITH base AS (
      SELECT *
      FROM sensex_stock_prices
      WHERE $1::date IS NULL OR trade_date >= $1::date
    ),

    ordered AS (
      SELECT
        *,

        -- previous day's CLOSE price
        LAG(price) OVER (ORDER BY trade_date) AS prev_price,

        -- previous day's volume
        LAG(volume) OVER (ORDER BY trade_date) AS prev_volume

      FROM base
    )

    SELECT
      trade_date,

      -- 🔥 compare open/high/low against previous day's PRICE
      (open - prev_price) AS open_diff,
      (high - prev_price) AS high_diff,
      (low - prev_price) AS low_diff,

      -- 🔥 normal close-to-close diff
      (price - prev_price) AS price_diff,

      -- 🔥 volume diff
      (volume - prev_volume) AS volume_diff,

      -- 🔥 percentage diff using previous day's PRICE
      CASE
        WHEN prev_price IS NULL OR prev_price = 0
        THEN NULL
        ELSE (open - prev_price) / prev_price * 100
      END AS open_diff_pct,

      CASE
        WHEN prev_price IS NULL OR prev_price = 0
        THEN NULL
        ELSE (high - prev_price) / prev_price * 100
      END AS high_diff_pct,

      CASE
        WHEN prev_price IS NULL OR prev_price = 0
        THEN NULL
        ELSE (low - prev_price) / prev_price * 100
      END AS low_diff_pct,

      -- 🔥 close price percentage diff
      CASE
        WHEN prev_price IS NULL OR prev_price = 0
        THEN NULL
        ELSE (price - prev_price) / prev_price * 100
      END AS price_diff_pct,

      -- 🔥 volume percentage diff
      CASE
        WHEN prev_volume IS NULL OR prev_volume = 0
        THEN NULL
        ELSE (volume - prev_volume) / prev_volume * 100
      END AS volume_diff_pct

    FROM ordered

    WHERE prev_price IS NOT NULL
    `,
    [lastDate],
  );

  console.log(`📊 New diff rows: ${diffRows.length}`);

  // 🔥 Step 3: UPSERT only new computed rows
  let batch = [];

  for (const row of diffRows) {
    batch.push({
      trade_date: row.trade_date,

      open_diff: row.open_diff,
      high_diff: row.high_diff,
      low_diff: row.low_diff,
      price_diff: row.price_diff,
      volume_diff: row.volume_diff,

      open_diff_pct: row.open_diff_pct,
      high_diff_pct: row.high_diff_pct,
      low_diff_pct: row.low_diff_pct,
      price_diff_pct: row.price_diff_pct,
      volume_diff_pct: row.volume_diff_pct,
    });

    if (batch.length >= BATCH_SIZE) {
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(SensexStockPriceDiff)
        .values(batch)
        .orUpdate(
          [
            "open_diff",
            "high_diff",
            "low_diff",
            "price_diff",
            "volume_diff",
            "open_diff_pct",
            "high_diff_pct",
            "low_diff_pct",
            "price_diff_pct",
            "volume_diff_pct",
          ],
          ["trade_date"],
        )
        .execute();

      console.log(`✅ Upserted ${batch.length}`);

      batch = [];
    }
  }

  // 🔥 Insert remaining rows
  if (batch.length > 0) {
    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(SensexStockPriceDiff)
      .values(batch)
      .orUpdate(
        [
          "open_diff",
          "high_diff",
          "low_diff",
          "price_diff",
          "volume_diff",
          "open_diff_pct",
          "high_diff_pct",
          "low_diff_pct",
          "price_diff_pct",
          "volume_diff_pct",
        ],
        ["trade_date"],
      )
      .execute();

    console.log(`✅ Upserted ${batch.length}`);
  }

  await queryRunner.release();

  console.log("✅ Done. Incremental pipeline complete.");

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);

  process.exit(1);
});
