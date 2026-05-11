import "reflect-metadata";
import { AppDataSource } from "@root/data-source";

const BATCH_SIZE = 1000;

async function run() {
  await AppDataSource.initialize();

  console.log("🚀 Incremental SQL diff pipeline starting...");

  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();

  // 🔥 Step 1: get last processed trade_date
  const lastRow = await queryRunner.query(`
    SELECT MAX(trade_date) AS last_date
    FROM nifty_stock_prices_diff
  `);

  const lastDate = lastRow?.[0]?.last_date;

  console.log("📅 Last processed date:", lastDate);

  // 🔥 Step 2: compute diffs only for NEW data + previous row included
  const diffRows = await queryRunner.query(
    `
    WITH base AS (
      SELECT *
      FROM nifty_stock_prices
      WHERE $1::date IS NULL OR trade_date >= $1::date
    ),

    ordered AS (
      SELECT
        *,

        -- previous day's CLOSE price
        LAG(close) OVER (ORDER BY trade_date) AS prev_close,

        -- previous day's traded shares
        LAG(shares_traded) OVER (ORDER BY trade_date) AS prev_shares_traded,

        -- previous day's turnover
        LAG(turnover_cr) OVER (ORDER BY trade_date) AS prev_turnover_cr

      FROM base
    )

    SELECT
      trade_date,

      -- 🔥 compare open/high/low against previous day's CLOSE
      (open - prev_close) AS open_diff,
      (high - prev_close) AS high_diff,
      (low - prev_close) AS low_diff,

      -- 🔥 close-to-close diff
      (close - prev_close) AS close_diff,

      -- 🔥 other diffs
      (shares_traded - prev_shares_traded) AS shares_traded_diff,
      (turnover_cr - prev_turnover_cr) AS turnover_cr_diff,

      -- 🔥 percentage diff using previous day's CLOSE
      CASE
        WHEN prev_close IS NULL OR prev_close = 0
        THEN NULL
        ELSE (open - prev_close) / prev_close * 100
      END AS open_diff_pct,

      CASE
        WHEN prev_close IS NULL OR prev_close = 0
        THEN NULL
        ELSE (high - prev_close) / prev_close * 100
      END AS high_diff_pct,

      CASE
        WHEN prev_close IS NULL OR prev_close = 0
        THEN NULL
        ELSE (low - prev_close) / prev_close * 100
      END AS low_diff_pct,

      -- 🔥 close percentage diff
      CASE
        WHEN prev_close IS NULL OR prev_close = 0
        THEN NULL
        ELSE (close - prev_close) / prev_close * 100
      END AS close_diff_pct,

      -- 🔥 shares traded percentage diff
      CASE
        WHEN prev_shares_traded IS NULL OR prev_shares_traded = 0
        THEN NULL
        ELSE (shares_traded - prev_shares_traded) / prev_shares_traded * 100
      END AS shares_traded_diff_pct,

      -- 🔥 turnover percentage diff
      CASE
        WHEN prev_turnover_cr IS NULL OR prev_turnover_cr = 0
        THEN NULL
        ELSE (turnover_cr - prev_turnover_cr) / prev_turnover_cr * 100
      END AS turnover_cr_diff_pct

    FROM ordered

    WHERE prev_close IS NOT NULL
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
      close_diff: row.close_diff,
      shares_traded_diff: row.shares_traded_diff,
      turnover_cr_diff: row.turnover_cr_diff,

      open_diff_pct: row.open_diff_pct,
      high_diff_pct: row.high_diff_pct,
      low_diff_pct: row.low_diff_pct,
      close_diff_pct: row.close_diff_pct,
      shares_traded_diff_pct: row.shares_traded_diff_pct,
      turnover_cr_diff_pct: row.turnover_cr_diff_pct,
    });

    if (batch.length >= BATCH_SIZE) {
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into("nifty_stock_prices_diff")
        .values(batch)
        .orUpdate(
          [
            "open_diff",
            "high_diff",
            "low_diff",
            "close_diff",
            "shares_traded_diff",
            "turnover_cr_diff",
            "open_diff_pct",
            "high_diff_pct",
            "low_diff_pct",
            "close_diff_pct",
            "shares_traded_diff_pct",
            "turnover_cr_diff_pct",
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
      .into("nifty_stock_prices_diff")
      .values(batch)
      .orUpdate(
        [
          "open_diff",
          "high_diff",
          "low_diff",
          "close_diff",
          "shares_traded_diff",
          "turnover_cr_diff",
          "open_diff_pct",
          "high_diff_pct",
          "low_diff_pct",
          "close_diff_pct",
          "shares_traded_diff_pct",
          "turnover_cr_diff_pct",
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
