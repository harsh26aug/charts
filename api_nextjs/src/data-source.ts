import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "@entities/User";
import { RefreshToken } from "@entities/RefreshToken";
import { NiftyStockPrice } from "@entities/NiftyStockPrice";
import { NiftyStockPriceDiff } from "@entities/NiftyStockPriceDiff";
import { SensexStockPrice } from "@entities/SensexStockPrice";
import { SensexStockPriceDiff } from "@entities/SensexStockPriceDiff";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "auth_db",
  synchronize: true,
  logging: process.env.NODE_ENV === "development",
  entities: [
    User,
    RefreshToken,
    NiftyStockPrice,
    NiftyStockPriceDiff,
    SensexStockPrice,
    SensexStockPriceDiff,
  ],
  migrations: [],
  subscribers: [],
});

export async function initDataSource() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}
