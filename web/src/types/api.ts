/**
 * Standardized API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

/**
 * Standardized API error payload
 */
export interface ApiErrorDetail {
  code: string;
  message: string;
  retryable?: boolean;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
