import "reflect-metadata";
import { AppDataSource } from "@root/data-source";
import { NiftyStockPrice } from "@entities/NiftyStockPrice";
import { NiftyStockPriceDiff } from "@entities/NiftyStockPriceDiff";
import { SensexStockPrice } from "@entities/SensexStockPrice";
import { SensexStockPriceDiff } from "@entities/SensexStockPriceDiff";
import { elasticsearchClient, elasticsearchIndices } from "@config/elasticsearch";
import { NiftyStockRow, SensexStockRow } from "@config/stock.type";

const BATCH_SIZE = 1000;

function normalizeDate(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

async function ensureIndex(index: string): Promise<void> {
  const existsResponse = await elasticsearchClient.indices.exists({ index });
  const exists = typeof existsResponse === "boolean"
    ? existsResponse
    : Boolean((existsResponse as { body?: boolean }).body);

  if (exists) {
    return;
  }

  await elasticsearchClient.indices.create({
    index,
    mappings: {
      properties: {
        tradeDate: { type: "date" },
        price: {
          properties: {
            open: { type: "double" },
            high: { type: "double" },
            low: { type: "double" },
            close: { type: "double" },
            sharesTraded: { type: "long" },
            turnoverCr: { type: "double" },
            price: { type: "double" },
            volume: { type: "long" },
          },
        },
        diff: {
          properties: {
            openDiff: { type: "double" },
            highDiff: { type: "double" },
            lowDiff: { type: "double" },
            closeDiff: { type: "double" },
            sharesTradedDiff: { type: "double" },
            turnoverCrDiff: { type: "double" },
            priceDiff: { type: "double" },
            volumeDiff: { type: "double" },
            openDiffPct: { type: "double" },
            highDiffPct: { type: "double" },
            lowDiffPct: { type: "double" },
            closeDiffPct: { type: "double" },
            sharesTradedDiffPct: { type: "double" },
            turnoverCrDiffPct: { type: "double" },
            priceDiffPct: { type: "double" },
            volumeDiffPct: { type: "double" },
          },
        },
      },
    },
  });
}

async function syncNiftyIndex(): Promise<void> {
  const niftyRepo = AppDataSource.getRepository(NiftyStockPrice);
  let offset = 0;

  while (true) {
    const rows = await niftyRepo
      .createQueryBuilder("price")
      .leftJoin(
        NiftyStockPriceDiff,
        "diff",
        "diff.trade_date = price.trade_date",
      )
      .select([
        'price.trade_date AS "tradeDate"',
        'price.open AS "open"',
        'price.high AS "high"',
        'price.low AS "low"',
        'price.close AS "close"',
        'price.shares_traded AS "sharesTraded"',
        'price.turnover_cr AS "turnoverCr"',
        'diff.open_diff AS "openDiff"',
        'diff.high_diff AS "highDiff"',
        'diff.low_diff AS "lowDiff"',
        'diff.close_diff AS "closeDiff"',
        'diff.shares_traded_diff AS "sharesTradedDiff"',
        'diff.turnover_cr_diff AS "turnoverCrDiff"',
        'diff.open_diff_pct AS "openDiffPct"',
        'diff.high_diff_pct AS "highDiffPct"',
        'diff.low_diff_pct AS "lowDiffPct"',
        'diff.close_diff_pct AS "closeDiffPct"',
        'diff.shares_traded_diff_pct AS "sharesTradedDiffPct"',
        'diff.turnover_cr_diff_pct AS "turnoverCrDiffPct"',
      ])
      .orderBy("price.trade_date", "ASC")
      .offset(offset)
      .limit(BATCH_SIZE)
      .getRawMany<NiftyStockRow>();

    if (rows.length === 0) {
      break;
    }

    const operations = rows.flatMap((row) => {
      const tradeDate = normalizeDate(row.tradeDate);

      return [
        {
          index: {
            _index: elasticsearchIndices.nifty,
            _id: tradeDate,
          },
        },
        {
          tradeDate,
          price: {
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            sharesTraded: row.sharesTraded,
            turnoverCr: row.turnoverCr,
          },
          diff: {
            openDiff: row.openDiff,
            highDiff: row.highDiff,
            lowDiff: row.lowDiff,
            closeDiff: row.closeDiff,
            sharesTradedDiff: row.sharesTradedDiff,
            turnoverCrDiff: row.turnoverCrDiff,
            openDiffPct: row.openDiffPct,
            highDiffPct: row.highDiffPct,
            lowDiffPct: row.lowDiffPct,
            closeDiffPct: row.closeDiffPct,
            sharesTradedDiffPct: row.sharesTradedDiffPct,
            turnoverCrDiffPct: row.turnoverCrDiffPct,
          },
        },
      ];
    });

    await elasticsearchClient.bulk({
      refresh: false,
      operations,
    });

    offset += BATCH_SIZE;
    console.log(`Nifty sync progress: ${offset} rows processed`);
  }

  await elasticsearchClient.indices.refresh({ index: elasticsearchIndices.nifty });
}

async function syncSensexIndex(): Promise<void> {
  const sensexRepo = AppDataSource.getRepository(SensexStockPrice);
  let offset = 0;

  while (true) {
    const rows = await sensexRepo
      .createQueryBuilder("price")
      .leftJoin(
        SensexStockPriceDiff,
        "diff",
        "diff.trade_date = price.trade_date",
      )
      .select([
        'price.trade_date AS "tradeDate"',
        'price.open AS "open"',
        'price.high AS "high"',
        'price.low AS "low"',
        'price.price AS "price"',
        'price.volume AS "volume"',
        'diff.open_diff AS "openDiff"',
        'diff.high_diff AS "highDiff"',
        'diff.low_diff AS "lowDiff"',
        'diff.price_diff AS "priceDiff"',
        'diff.volume_diff AS "volumeDiff"',
        'diff.open_diff_pct AS "openDiffPct"',
        'diff.high_diff_pct AS "highDiffPct"',
        'diff.low_diff_pct AS "lowDiffPct"',
        'diff.price_diff_pct AS "priceDiffPct"',
        'diff.volume_diff_pct AS "volumeDiffPct"',
      ])
      .orderBy("price.trade_date", "ASC")
      .offset(offset)
      .limit(BATCH_SIZE)
      .getRawMany<SensexStockRow>();

    if (rows.length === 0) {
      break;
    }

    const operations = rows.flatMap((row) => {
      const tradeDate = normalizeDate(row.tradeDate);

      return [
        {
          index: {
            _index: elasticsearchIndices.sensex,
            _id: tradeDate,
          },
        },
        {
          tradeDate,
          price: {
            open: row.open,
            high: row.high,
            low: row.low,
            price: row.price,
            volume: row.volume,
          },
          diff: {
            openDiff: row.openDiff,
            highDiff: row.highDiff,
            lowDiff: row.lowDiff,
            priceDiff: row.priceDiff,
            volumeDiff: row.volumeDiff,
            openDiffPct: row.openDiffPct,
            highDiffPct: row.highDiffPct,
            lowDiffPct: row.lowDiffPct,
            priceDiffPct: row.priceDiffPct,
            volumeDiffPct: row.volumeDiffPct,
          },
        },
      ];
    });

    await elasticsearchClient.bulk({
      refresh: false,
      operations,
    });

    offset += BATCH_SIZE;
    console.log(`Sensex sync progress: ${offset} rows processed`);
  }

  await elasticsearchClient.indices.refresh({ index: elasticsearchIndices.sensex });
}

async function run() {
  await AppDataSource.initialize();
  console.log("Database connected");

  await ensureIndex(elasticsearchIndices.nifty);
  await ensureIndex(elasticsearchIndices.sensex);

  await syncNiftyIndex();
  await syncSensexIndex();

  console.log("Elasticsearch sync completed");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Elasticsearch sync failed:", err);
    process.exit(1);
  });
