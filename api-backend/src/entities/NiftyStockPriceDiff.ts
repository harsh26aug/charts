import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "nifty_stock_prices_diff" })
export class NiftyStockPriceDiff {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: "date" })
  trade_date!: Date;

  @Column({ type: "float", nullable: true })
  open_diff!: number;

  @Column({ type: "float", nullable: true })
  high_diff!: number;

  @Column({ type: "float", nullable: true })
  low_diff!: number;

  @Column({ type: "float", nullable: true })
  close_diff!: number;

  @Column({ type: "float", nullable: true })
  shares_traded_diff!: number;

  @Column({ type: "float", nullable: true })
  turnover_cr_diff!: number;

  // 🔹 Percentage columns
  @Column({ type: "float", nullable: true })
  open_diff_pct!: number;

  @Column({ type: "float", nullable: true })
  high_diff_pct!: number;

  @Column({ type: "float", nullable: true })
  low_diff_pct!: number;

  @Column({ type: "float", nullable: true })
  close_diff_pct!: number;

  @Column({ type: "float", nullable: true })
  shares_traded_diff_pct!: number;

  @Column({ type: "float", nullable: true })
  turnover_cr_diff_pct!: number;
}
