/**
 * BrightNest API client — the only public runtime setting is the backend URL;
 * credentials, database access and email keys remain exclusively server-side.
 */
export type BookingStatus = "new" | "contacted" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "unpaid" | "paid" | "partially_refunded" | "refunded" | "failed";

export type BookingPayload = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  postcode: string;
  service_type: string;
  frequency: string;
  preferred_date: string;
  preferred_time: string;
  privacy_consent: true;
  notes?: string;
};

export type Booking = BookingPayload & {
  id: string;
  status: BookingStatus;
  admin_notes: string | null;
  email_status: string;
  created_at: string;
  updated_at: string;
  customer_phone: string | null;
  currency: string;
  subtotal_pence: number | null;
  tax_rate_basis_points: number | null;
  tax_pence: number | null;
  total_pence: number | null;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  payment_reference: string | null;
  paid_at: string | null;
};

export type BookingList = { items: Booking[]; page: number; page_size: number; total: number };
export type Dashboard = Record<"total" | BookingStatus, number>;
export type AdminAnalytics = { bookings_this_month: number; completed_this_month: number; cancelled_this_month: number; revenue_pence_this_month: number; average_booking_total_pence: number | null };
export type Tokens = { access_token: string; refresh_token: string; token_type: "bearer"; expires_in: number };
export type CustomerChangeRequest = {
  id: string;
  request_type: "reschedule" | "cancel";
  requested_date: string | null;
  requested_time: string | null;
  message: string | null;
  status: "requested" | "reviewed" | "resolved";
  created_at: string;
};
export type CustomerBooking = Pick<Booking, "id" | "service_type" | "frequency" | "preferred_date" | "preferred_time" | "status" | "created_at" | "currency" | "subtotal_pence" | "tax_rate_basis_points" | "tax_pence" | "total_pence" | "payment_status" | "paid_at"> & { change_request: CustomerChangeRequest | null };
export type CustomerDashboard = { customer_email: string; upcoming: CustomerBooking[]; past: CustomerBooking[] };
export type CustomerAccessToken = { access_token: string; token_type: "bearer"; expires_in: number };
export type CustomerChangePayload = { request_type: "reschedule" | "cancel"; requested_date?: string; requested_time?: string; message?: string };
export type CustomerDataRequestResponse = { id: string; request_type: "export" | "delete"; status: string; message: string };
export type AdminChangeRequest = CustomerChangeRequest & {
  booking_id: string;
  customer_email: string;
  customer_name: string;
  service_type: string;
  current_date: string;
  current_time: string;
  booking_status: BookingStatus;
  reviewed_at: string | null;
  resolved_at: string | null;
  resolution: "approved" | "declined" | null;
  resolution_note: string | null;
};

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "");

class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function apiUrl(path: string) {
  if (!configuredApiUrl) {
    throw new ApiError("The booking service is not configured yet. Please try again soon.");
  }
  return `${configuredApiUrl}/api/v1${path}`;
}

async function request<T>(path: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  let response: Response;
  try {
    response = await fetch(apiUrl(path), { ...options, headers });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("We could not reach the booking service. Please check your connection and try again.");
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.detail;
    const message = typeof detail === "string" ? detail : "The request could not be completed.";
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export const bookingApi = {
  create: (payload: BookingPayload) => request<{ booking_id: string; message: string }>("/bookings", { method: "POST", body: JSON.stringify(payload) }),
  login: (email: string, password: string) => request<Tokens>("/admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  dashboard: (token: string) => request<Dashboard>("/admin/dashboard", {}, token),
  analytics: (token: string) => request<AdminAnalytics>("/admin/analytics", {}, token),
  list: (token: string, filter: BookingStatus | "all" = "all") => request<BookingList>(`/admin/bookings${filter === "all" ? "" : `?status=${filter}`}`, {}, token),
  update: (token: string, bookingId: string, payload: { status?: BookingStatus; admin_notes?: string; currency?: string; subtotal_pence?: number; tax_rate_basis_points?: number; tax_pence?: number; total_pence?: number; payment_status?: PaymentStatus; payment_provider?: string; payment_reference?: string; paid_at?: string }) =>
    request<Booking>(`/admin/bookings/${bookingId}`, { method: "PATCH", body: JSON.stringify(payload) }, token),
  changeRequests: (token: string, status: "requested" | "reviewed" | "resolved" = "requested") => request<AdminChangeRequest[]>(`/admin/change-requests?status=${status}`, {}, token),
  updateChangeRequest: (token: string, requestId: string, payload: { status: "reviewed" | "resolved"; resolution?: "approved" | "declined"; resolution_note?: string }) =>
    request<AdminChangeRequest>(`/admin/change-requests/${requestId}`, { method: "PATCH", body: JSON.stringify(payload) }, token),
};

async function requestBlob(path: string, accessToken: string): Promise<Blob> {
  const headers = new Headers({ Authorization: `Bearer ${accessToken}` });
  let response: Response;
  try {
    response = await fetch(apiUrl(path), { headers });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("We could not reach the booking service. Please check your connection and try again.");
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail;
    throw new ApiError(typeof detail === "string" ? detail : "The receipt could not be downloaded.", response.status);
  }
  return response.blob();
}

export const customerApi = {
  requestAccess: (email: string) => request<{ message: string }>("/customer/access/request", { method: "POST", body: JSON.stringify({ email }) }),
  exchange: (token: string) => request<CustomerAccessToken>("/customer/access/exchange", { method: "POST", body: JSON.stringify({ token }) }),
  bookings: (token: string) => request<CustomerDashboard>("/customer/bookings", {}, token),
  requestChange: (token: string, bookingId: string, payload: CustomerChangePayload) =>
    request<{ id: string; message: string; status: CustomerChangeRequest["status"] }>(`/customer/bookings/${bookingId}/change-requests`, { method: "POST", body: JSON.stringify(payload) }, token),
  downloadReceipt: (token: string, bookingId: string) => requestBlob(`/customer/bookings/${bookingId}/receipt`, token),
  requestData: (token: string, requestType: "export" | "delete") => request<CustomerDataRequestResponse>("/customer/data-requests", { method: "POST", body: JSON.stringify({ request_type: requestType }) }, token),
  exportData: (token: string) => request<{ customer_email: string; bookings: CustomerBooking[] }>("/customer/data-export", {}, token),
};

export { ApiError, configuredApiUrl };
