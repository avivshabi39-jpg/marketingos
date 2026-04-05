import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Extract pagination params from request URL.
 * Defaults to page 1, 20 items, max 100.
 */
export function getPaginationParams(
  req: NextRequest,
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit)))
  );
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Build pagination metadata for the response.
 */
export function paginationMeta(total: number, params: PaginationParams) {
  const totalPages = Math.ceil(total / params.limit);
  return {
    total,
    page: params.page,
    limit: params.limit,
    totalPages,
    hasMore: params.page < totalPages,
  };
}
