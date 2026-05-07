import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "sensex_stock_prices" })
export class SensexStockPrice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: "date" })
  trade_date!: Date;

  @Column("numeric", { precision: 12, scale: 2, nullable: true })
  price!: number;

  @Column("numeric", { precision: 12, scale: 2, nullable: true })
  open!: number;

  @Column("numeric", { precision: 12, scale: 2, nullable: true })
  high!: number;

  @Column("numeric", { precision: 12, scale: 2, nullable: true })
  low!: number;

  @Column("bigint", { nullable: true })
  volume!: number;
}
