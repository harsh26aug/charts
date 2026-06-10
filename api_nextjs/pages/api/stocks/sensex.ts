import { NextApiRequest, NextApiResponse } from "next";
import { initDataSource } from "@data-source";
import { StockService } from "@services/stock.service";
import { StockPaginationQueryDto } from "@dto/stock.dto";
import { validateQuery } from "@lib/validate";
import { normalizeError } from "@lib/errors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    await initDataSource();
    const query = await validateQuery(StockPaginationQueryDto, req.query);
    const service = new StockService();
    const result = await service.getSensexStockHistory(query);
    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    const normalized = normalizeError(error);
    return res.status(normalized.status).json({
      success: false,
      message: normalized.message,
    });
  }
}
