import "reflect-metadata";
import fs from "fs";
import csv from "csv-parser";
import { AppDataSource } from "@root/data-source";
import { NiftyStockPrice } from "@entities/NiftyStockPrice";

const FILE_PATH = "./data/nifty/nifty.csv";

const BATCH_SIZE = 500;

function parseDate(dateStr: string): Date {
  return new Date(dateStr.replace(/-/g, " "));
}

async function run() {
  await AppDataSource.initialize();
  console.log("Database connected, starting CSV import...");

  const repo = AppDataSource.getRepository(NiftyStockPrice);

  let batch: NiftyStockPrice[] = [];
  let processing = false;

  const processBatch = async () => {
    if (processing || batch.length === 0) return;

    processing = true;

    const chunk = batch;
    batch = [];

    try {
      await repo.upsert(chunk, ["trade_date"]);
      console.log(`Upserted ${chunk.length} rows`);
    } catch (err) {
      console.error("Batch upsert error:", err);
    }

    processing = false;
  };

  const stream = fs.createReadStream(FILE_PATH).pipe(
    csv({
      mapHeaders: ({ header }) => header.trim(),
    }),
  );

  stream.on("data", (row: any) => {
    const entity = repo.create({
      trade_date: parseDate(row["Date"]),
      open: Number(row["Open"]),
      high: Number(row["High"]),
      low: Number(row["Low"]),
      close: Number(row["Close"]),
      shares_traded: Number(row["Shares Traded"]),
      turnover_cr: Number(row["Turnover (₹ Cr)"]),
    });

    batch.push(entity);

    if (batch.length >= BATCH_SIZE) {
      stream.pause();
      processBatch().then(() => stream.resume());
    }
  });

  stream.on("end", async () => {
    await processBatch();
    console.log("CSV import completed");
    process.exit(0);
  });

  stream.on("error", (err) => {
    console.error("Stream error:", err);
    process.exit(1);
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
