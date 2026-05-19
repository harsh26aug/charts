import "reflect-metadata";
import fs from "fs";
import csv from "csv-parser";
import { AppDataSource } from "@root/data-source";
import { SensexStockPrice } from "@entities/SensexStockPrice";
import stripBom from "strip-bom-stream";

const FILE_PATH = "./data/sensex/sensex.csv";

const BATCH_SIZE = 500;

// Parse "DD-MM-YYYY" date format used in sensex CSV files
function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("-");
  return new Date(`${year}-${month}-${day}`);
}

// Remove thousands commas and convert to number e.g. "48,782.36" → 48782.36
function parseNumeric(value: string): number {
  return Number(value.replace(/,/g, ""));
}

// Convert volume string to integer e.g. "19.41M" → 19410000
function parseVolume(value: string): number {
  const trimmed = value.trim();
  if (trimmed.endsWith("M")) {
    return Math.round(parseFloat(trimmed) * 1_000_000);
  }
  if (trimmed.endsWith("B")) {
    return Math.round(parseFloat(trimmed) * 1_000_000_000);
  }
  return Math.round(parseFloat(trimmed));
}

async function run() {
  await AppDataSource.initialize();
  console.log("Database connected, starting Sensex CSV import...");

  const repo = AppDataSource.getRepository(SensexStockPrice);

  console.log(`Importing: ${FILE_PATH}`);

  let batch: SensexStockPrice[] = [];
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

  const stream = fs
    .createReadStream(FILE_PATH)
    .pipe(stripBom())
    .pipe(
      csv({
        mapHeaders: ({ header }) => header.trim(),
      }),
    );

  stream.on("data", (row: any) => {
    const entity = repo.create({
      trade_date: parseDate(row["Date"]),
      price: parseNumeric(row["Price"]),
      open: parseNumeric(row["Open"]),
      high: parseNumeric(row["High"]),
      low: parseNumeric(row["Low"]),
      volume: parseVolume(row["Vol."]),
    });

    batch.push(entity);

    if (batch.length >= BATCH_SIZE) {
      stream.pause();
      processBatch().then(() => stream.resume());
    }
  });

  stream.on("end", async () => {
    await processBatch();
    console.log("Sensex CSV import completed");
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
