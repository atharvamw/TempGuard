import { NextResponse } from "next/server";
import { ApiErrorResponse } from "@/types/api";

export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  retryable: boolean = false
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        retryable,
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
