import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "nifty_stock_prices" })
export class NiftyStockPrice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: "date" })
  trade_date!: Date;

  @Column("numeric", { precision: 12, scale: 2 })
  open!: number;

  @Column("numeric", { precision: 12, scale: 2 })
  high!: number;

  @Column("numeric", { precision: 12, scale: 2 })
  low!: number;

  @Column("numeric", { precision: 12, scale: 2 })
  close!: number;

  @Column("bigint")
  shares_traded!: number;

  @Column("numeric", { precision: 15, scale: 2 })
  turnover_cr!: number;
}
