import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "sensex_stock_prices_diff" })
export class SensexStockPriceDiff {
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
  price_diff!: number;

  @Column({ type: "float", nullable: true })
  volume_diff!: number;

  @Column({ type: "float", nullable: true })
  open_diff_pct!: number;

  @Column({ type: "float", nullable: true })
  high_diff_pct!: number;

  @Column({ type: "float", nullable: true })
  low_diff_pct!: number;

  @Column({ type: "float", nullable: true })
  price_diff_pct!: number;

  @Column({ type: "float", nullable: true })
  volume_diff_pct!: number;
}
