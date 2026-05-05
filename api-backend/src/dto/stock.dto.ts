import { IsDateString, IsInt, IsOptional, Max, Min } from "class-validator";

export class StockPaginationQueryDto {
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsInt()
  @Min(1)
  @Max(1000)
  limit: number = 10;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
