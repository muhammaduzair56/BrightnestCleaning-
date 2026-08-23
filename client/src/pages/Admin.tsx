/**
 * BrightNest design reminder — the private admin uses the same calm ink/mint system as the
 * public site, with operational density, direct status clarity and no customer-facing clutter.
 */
import { AdminAnalytics, AdminAnalyticsMonth, AdminChangeRequest, Booking, BookingStatus, PaymentStatus, bookingApi, configuredApiUrl, Dashboard } from "@/lib/api";
import { Check, ChevronRight, ClipboardList, LockKeyhole, LogOut, Mail, RefreshCcw, ShieldCheck, CalendarClock, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";

const statusLabels: Record<BookingStatus | "all", string> = {
  all: "All requests",
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const analyticsServices = ["Regular home cleaning", "Deep cleaning", "End of tenancy", "Move-in / move-out", "Post-renovation", "Airbnb / short-term rental", "Office & commercial", "Window cleaning", "Oven cleaning", "Carpet cleaning", "Rug cleaning", "Sofa / upholstery", "Rubbish / waste removal", "Bin cleaning", "Small one-off jobs"];

const statusTone: Record<BookingStatus, string> = {
  new: "bg-[#d9f0e8] text-[#173137]",
  contacted: "bg-[#f1c9ad] text-[#173137]",
  confirmed: "bg-[#173137] text-white",
  completed: "bg-[#dce8d5] text-[#173137]",
  cancelled: "bg-[#eee9dd] text-[#173137]/65",
};

function readStoredToken() {
  return sessionStorage.getItem("brightnest_admin_access") ?? "";
}

function TrendCharts({ months }: { months: AdminAnalyticsMonth[] }) {
  const revenueMax = Math.max(...months.map((month) => month.revenue_pence), 1);
  const hasRecords = months.some((month) => month.bookings > 0);
  return <section className="mt-6 grid gap-6 xl:grid-cols-2" aria-label="Booking trends">
    <div className="rounded-[24px] border border-[#173137]/10 bg-white p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[#2f9f91]">Revenue trend</p><h2 className="font-display mt-2 text-3xl tracking-[-0.05em]">Recorded revenue</h2></div><span className="rounded-full bg-[#d9f0e8] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#173137]">6 months</span></div>
      {!hasRecords ? <p className="mt-8 rounded-2xl bg-[#edf3ed] p-5 text-sm font-bold leading-6 text-[#173137]/55">Revenue trend will appear after bookings have been recorded.</p> : <div className="mt-8" role="img" aria-label="Monthly recorded revenue bar chart"><div className="flex h-48 items-end gap-2 border-b border-[#173137]/10 sm:gap-4">{months.map((month) => <div key={month.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-extrabold text-[#173137]/65">£{(month.revenue_pence / 100).toFixed(0)}</span><div className="w-full max-w-12 rounded-t-[10px] bg-[#2f9f91] transition-[height] duration-300" style={{ height: `${Math.max(month.revenue_pence > 0 ? 8 : 2, (month.revenue_pence / revenueMax) * 125)}px` }} title={`${month.label}: £${(month.revenue_pence / 100).toFixed(2)}`} /><span className="truncate text-[10px] font-bold text-[#173137]/45">{month.label.split(" ")[0]}</span></div>)}</div><p className="mt-4 text-xs font-bold text-[#173137]/45">Only completed bookings with recorded totals are included.</p></div>}
    </div>
    <div className="rounded-[24px] border border-[#173137]/10 bg-white p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[#2f9f91]">Cancellation rate</p><h2 className="font-display mt-2 text-3xl tracking-[-0.05em]">Booking health</h2></div><span className="rounded-full bg-[#f1c9ad] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#173137]">Per month</span></div>
      {!hasRecords ? <p className="mt-8 rounded-2xl bg-[#edf3ed] p-5 text-sm font-bold leading-6 text-[#173137]/55">Cancellation rate will appear after booking activity is recorded.</p> : <div className="mt-8" role="img" aria-label="Monthly cancellation rate bar chart"><div className="flex h-48 items-end gap-2 border-b border-[#173137]/10 sm:gap-4">{months.map((month) => <div key={month.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-extrabold text-[#173137]/65">{month.cancellation_rate}%</span><div className="w-full max-w-12 rounded-t-[10px] bg-[#f1c9ad] transition-[height] duration-300" style={{ height: `${Math.max(month.cancellation_rate > 0 ? 8 : 2, (month.cancellation_rate / 100) * 125)}px` }} title={`${month.label}: ${month.cancellation_rate}%`} /><span className="truncate text-[10px] font-bold text-[#173137]/45">{month.label.split(" ")[0]}</span></div>)}</div><p className="mt-4 text-xs font-bold text-[#173137]/45">Cancelled bookings divided by all bookings in each month.</p></div>}
    </div>
  </section>;
}

export default function Admin() {
  const [token, setToken] = useState(readStoredToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [appliedServiceType, setAppliedServiceType] = useState("");
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [changeRequests, setChangeRequests] = useState<AdminChangeRequest[]>([]);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<AdminChangeRequest | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSaving, setRequestSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [subtotalPence, setSubtotalPence] = useState("");
  const [taxRatePercent, setTaxRatePercent] = useState("");
  const [taxPence, setTaxPence] = useState("");
  const [totalPence, setTotalPence] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
  const [paymentProvider, setPaymentProvider] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadChangeRequests = async (activeToken = token) => {
    if (!activeToken) return;
    try {
      setChangeRequests(await bookingApi.changeRequests(activeToken, "requested"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load customer change requests.");
    }
  };

  const loadData = async (activeToken = token, activeFilter = filter) => {
    if (!activeToken) return;
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, analyticsResponse, bookingsResponse, requestsResponse] = await Promise.all([
        bookingApi.dashboard(activeToken),
        bookingApi.analytics(activeToken, appliedStartDate, appliedEndDate, appliedServiceType),
        bookingApi.list(activeToken, activeFilter),
        bookingApi.changeRequests(activeToken, "requested"),
      ]);
      setDashboard(dashboardResponse);
      setAnalytics(analyticsResponse);
      setBookings(bookingsResponse.items);
      setChangeRequests(requestsResponse);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Could not load booking requests.";
      setError(message);
      if ((requestError as { status?: number }).status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [filter, token, appliedStartDate, appliedEndDate]);

  const applyDateRange = () => {
    if ((startDate && !endDate) || (!startDate && endDate)) { setError("Choose both a start date and an end date, or clear both fields."); return; }
    if (startDate && endDate && startDate > endDate) { setError("Start date must be on or before end date."); return; }
    setError("");
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedServiceType(serviceType);
  };

  const clearDateRange = () => { setStartDate(""); setEndDate(""); setAppliedStartDate(""); setAppliedEndDate(""); setServiceType(""); setAppliedServiceType(""); setError(""); };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await bookingApi.login(email, password);
      sessionStorage.setItem("brightnest_admin_access", tokens.access_token);
      setToken(tokens.access_token);
      setPassword("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Secure sign-in was not completed.");
    } finally {
      setLoading(false);
    }
  };

  const resolveChangeRequest = async (resolution: "approved" | "declined") => {
    if (!selectedChangeRequest) return;
    setRequestSaving(true);
    setError("");
    try {
      await bookingApi.updateChangeRequest(token, selectedChangeRequest.id, { status: "resolved", resolution, resolution_note: resolutionNote || undefined });
      setSelectedChangeRequest(null);
      setResolutionNote("");
      await loadData(token, filter);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The change request could not be resolved.");
    } finally {
      setRequestSaving(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("brightnest_admin_access");
    setToken("");
    setBookings([]);
    setDashboard(null);
    setAnalytics(null);
    setSelected(null);
    setChangeRequests([]);
    setSelectedChangeRequest(null);
  };

  const updateBooking = async (status: BookingStatus) => {
    if (!selected) return;
    const moneyInputs = [subtotalPence, taxPence, totalPence];
    if (moneyInputs.some(Boolean) && moneyInputs.some((value) => !value)) {
      setError("Enter subtotal, tax and total together, or leave all three blank.");
      return;
    }
    if (moneyInputs.every(Boolean) && Number(totalPence) !== Number(subtotalPence) + Number(taxPence)) {
      setError("Total must equal subtotal plus tax.");
      return;
    }
    setSaving(true);
    setError("");
    const payload: Parameters<typeof bookingApi.update>[2] = { status, admin_notes: adminNotes, currency, payment_status: paymentStatus, payment_provider: paymentProvider || undefined, payment_reference: paymentReference || undefined, paid_at: paidAt || undefined };
    if (moneyInputs.every(Boolean)) {
      payload.subtotal_pence = Number(subtotalPence);
      payload.tax_pence = Number(taxPence);
      payload.total_pence = Number(totalPence);
      payload.tax_rate_basis_points = taxRatePercent ? Math.round(Number(taxRatePercent) * 100) : undefined;
    }
    try {
      const updated = await bookingApi.update(token, selected.id, payload);
      setSelected(updated);
      setAdminNotes(updated.admin_notes ?? "");
      await loadData(token, filter);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Booking could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  if (!configuredApiUrl) {
    return (
      <div className="admin-shell">
        <section className="admin-setup-card">
          <span className="admin-icon"><LockKeyhole className="h-6 w-6" /></span>
          <p className="eyebrow">Private operations</p>
          <h1 className="font-display mt-4 text-5xl tracking-[-0.06em]">Admin access is waiting for the secure API.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#173137]/70">Set the public `VITE_API_BASE_URL` deployment variable to the BrightNest FastAPI endpoint. Admin credentials, the database URL and email credentials remain server-side only.</p>
          <Link href="/" className="btn-primary mt-8">Back to BrightNest <ChevronRight className="h-4 w-4" /></Link>
        </section>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="admin-shell">
        <section className="admin-login-grid">
          <div className="admin-login-intro">
            <div className="flex items-center gap-3"><span className="brand-mark grid h-12 w-12 place-items-center rounded-[18px] bg-[#d9f0e8]"><ShieldCheck className="h-6 w-6 text-[#2f9f91]" /></span><span className="font-display text-3xl tracking-[-0.055em]">BrightNest</span></div>
            <p className="eyebrow mt-16 text-[#9ee0d2]">Private operations</p>
            <h1 className="font-display mt-5 max-w-md text-6xl leading-[0.94] tracking-[-0.065em]">Care for every request, in one place.</h1>
            <p className="mt-7 max-w-md text-base leading-7 text-white/65">This workspace is only for authorised BrightNest staff. Customer booking data is not exposed on the public website.</p>
            <Link href="/" className="mt-12 inline-flex items-center gap-2 text-sm font-extrabold text-[#9ee0d2] underline underline-offset-4">Return to public website <ChevronRight className="h-4 w-4" /></Link>
          </div>
          <form className="admin-login-form" onSubmit={login}>
            <p className="eyebrow">Admin sign-in</p>
            <h2 className="font-display mt-4 text-[40px] leading-[0.98] tracking-[-0.055em]">Welcome back.</h2>
            <label className="admin-label" htmlFor="admin-email">Email address</label>
            <input id="admin-email" className="admin-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label className="admin-label" htmlFor="admin-password">Password</label>
            <input id="admin-password" className="admin-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {error && <p className="admin-error">{error}</p>}
            <button className="btn-primary mt-7 w-full justify-center" type="submit" disabled={loading}>{loading ? "Signing in…" : "Open bookings"}<ChevronRight className="h-4 w-4" /></button>
            <p className="mt-5 text-xs leading-5 text-[#173137]/55">For security, access stays in this browser session only.</p>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="flex items-center gap-3"><span className="brand-mark grid h-11 w-11 place-items-center rounded-[16px] bg-[#d9f0e8]"><ShieldCheck className="h-5 w-5 text-[#2f9f91]" /></span><span className="font-display text-[28px] tracking-[-0.055em]">BrightNest</span></Link>
        <div className="mt-14 space-y-2"><span className="admin-nav-item admin-nav-current"><ClipboardList className="h-4 w-4" /> Booking requests</span><span className="admin-nav-item text-white/45"><Mail className="h-4 w-4" /> Notification centre</span></div>
        <button className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white" onClick={logout}><LogOut className="h-4 w-4" /> Sign out</button>
      </aside>
      <main className="min-w-0 bg-[#f8f6ef] p-5 sm:p-8 lg:p-12">
        <div className="flex flex-col justify-between gap-6 border-b border-[#173137]/10 pb-8 sm:flex-row sm:items-end">
          <div><p className="eyebrow">Birmingham operations</p><h1 className="font-display mt-3 text-[42px] tracking-[-0.06em] sm:text-[56px]">Booking requests</h1><p className="mt-3 text-sm text-[#173137]/65">Keep each home’s next step clear, timely and considered.</p></div>
          <button className="btn-primary" onClick={() => void loadData()} disabled={loading}><RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
        </div>
        {error && <p className="admin-error mt-6" role="alert">{error}</p>}
        <section className="mt-8 rounded-[24px] border border-[#173137]/10 bg-[#edf3ed] p-5 sm:p-6" aria-label="Analytics date range filter"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="eyebrow text-[#2f9f91]">Analytics window</p><h2 className="font-display mt-2 text-2xl tracking-[-0.04em]">Choose a date range</h2><p className="mt-2 text-sm leading-6 text-[#173137]/60">Filter bookings, recorded revenue and cancellation trends by preferred visit date.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="grid gap-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#173137]/55">Service<select value={serviceType} onChange={(event) => setServiceType(event.target.value)} className="admin-input min-w-[190px] bg-white normal-case tracking-normal"><option value="">All services</option>{analyticsServices.map((service) => <option key={service} value={service}>{service}</option>)}</select></label><label className="grid gap-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#173137]/55">From<input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className="admin-input min-w-[150px] bg-white normal-case tracking-normal" /></label><label className="grid gap-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#173137]/55">To<input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="admin-input min-w-[150px] bg-white normal-case tracking-normal" /></label><div className="flex gap-2"><button type="button" onClick={applyDateRange} disabled={loading} className="admin-action-button justify-center bg-[#173137] text-white">Apply</button><button type="button" onClick={clearDateRange} disabled={loading || (!startDate && !endDate && !appliedStartDate && !appliedEndDate)} className="admin-action-button justify-center">Clear</button></div></div></div><p className="mt-4 text-xs font-bold text-[#173137]/45">{appliedServiceType ? `${appliedServiceType} · ` : ""}{appliedStartDate && appliedEndDate ? `Showing ${appliedStartDate} to ${appliedEndDate}` : "All services · latest six-month overview."}</p></section>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {(["total", "new", "contacted", "confirmed", "completed", "cancelled"] as const).map((key) => <div key={key} className="admin-stat"><span>{key === "total" ? "All requests" : statusLabels[key]}</span><strong>{dashboard?.[key] ?? "—"}</strong></div>)}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="admin-stat"><span>This month</span><strong>{analytics?.bookings_this_month ?? "—"}</strong><small className="mt-1 block text-xs text-[#173137]/50">bookings</small></div>
          <div className="admin-stat"><span>Completed</span><strong>{analytics ? `£${(analytics.revenue_pence_this_month / 100).toFixed(2)}` : "—"}</strong><small className="mt-1 block text-xs text-[#173137]/50">recorded revenue</small></div>
          <div className="admin-stat"><span>Completed visits</span><strong>{analytics?.completed_this_month ?? "—"}</strong><small className="mt-1 block text-xs text-[#173137]/50">this month</small></div>
          <div className="admin-stat"><span>Cancellations</span><strong>{analytics?.cancelled_this_month ?? "—"}</strong><small className="mt-1 block text-xs text-[#173137]/50">this month</small></div>
        </div>
        {analytics && <TrendCharts months={analytics.months} />}
        <div className="mt-10 flex flex-wrap gap-2 border-b border-[#173137]/10 pb-5">
          {(Object.keys(statusLabels) as (BookingStatus | "all")[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={`admin-filter ${filter === item ? "admin-filter-active" : ""}`}>{statusLabels[item]}</button>)}
        </div>
        <section className="mt-8 rounded-[24px] border border-[#173137]/10 bg-[#173137] p-5 text-white sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow text-[#9ee0d2]">Needs review</p><h2 className="font-display mt-2 text-3xl tracking-[-0.05em]">Customer change requests</h2><p className="mt-2 text-sm leading-6 text-white/65">Review reschedule and cancellation requests before changing the booking.</p></div><span className="rounded-full bg-[#9ee0d2] px-3 py-1 text-xs font-extrabold text-[#173137]">{changeRequests.length} pending</span></div>
          {changeRequests.length === 0 ? <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">No pending customer change requests.</p> : <div className="mt-6 grid gap-3 lg:grid-cols-2">{changeRequests.map((request) => <button key={request.id} onClick={() => { setSelectedChangeRequest(request); setResolutionNote(""); }} className={`rounded-2xl border p-4 text-left transition-colors ${selectedChangeRequest?.id === request.id ? "border-[#9ee0d2] bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold">{request.customer_name}</p><p className="mt-1 text-xs text-white/55">{request.service_type} · {request.current_date} at {request.current_time.slice(0, 5)}</p></div><span className="rounded-full bg-[#f1c9ad] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#173137]">{request.request_type}</span></div><p className="mt-3 text-sm text-[#9ee0d2]">{request.request_type === "reschedule" && request.requested_date && request.requested_time ? `Requested: ${request.requested_date} at ${request.requested_time.slice(0, 5)}` : "Customer requested cancellation"}</p></button>)}</div>}
          {selectedChangeRequest && <div className="mt-5 rounded-2xl bg-[#f8f6ef] p-5 text-[#173137]"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Review request</p><h3 className="font-display mt-2 text-2xl tracking-[-0.04em]">{selectedChangeRequest.customer_name}</h3></div><button aria-label="Close request review" onClick={() => setSelectedChangeRequest(null)} className="rounded-full p-2 text-[#173137]/50 hover:bg-[#173137]/10"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Request</strong>{selectedChangeRequest.request_type}</p><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Customer email</strong>{selectedChangeRequest.customer_email}</p><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Current visit</strong>{selectedChangeRequest.current_date} at {selectedChangeRequest.current_time.slice(0, 5)}</p><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Requested visit</strong>{selectedChangeRequest.requested_date && selectedChangeRequest.requested_time ? `${selectedChangeRequest.requested_date} at ${selectedChangeRequest.requested_time.slice(0, 5)}` : "Cancellation"}</p></div><p className="mt-4 rounded-xl bg-[#edf3ed] p-3 text-sm leading-6">{selectedChangeRequest.message || "No additional customer message."}</p><label className="admin-label mt-4">Resolution note<textarea className="admin-input min-h-20 resize-y" value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} placeholder="Optional note included in the customer email" /></label><div className="mt-4 grid gap-2 sm:grid-cols-2"><button disabled={requestSaving} onClick={() => void resolveChangeRequest("approved")} className="admin-action-button justify-center bg-[#2f9f91] text-white"><Check className="h-4 w-4" />{requestSaving ? "Saving…" : "Approve & resolve"}</button><button disabled={requestSaving} onClick={() => void resolveChangeRequest("declined")} className="admin-action-button justify-center"><X className="h-4 w-4" />Decline & resolve</button></div></div>}
        </section>
        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="overflow-hidden rounded-[24px] border border-[#173137]/10 bg-white">
            {loading ? <p className="p-7 text-sm font-bold text-[#173137]/55">Loading booking requests…</p> : bookings.length === 0 ? <p className="p-7 text-sm font-bold text-[#173137]/55">No requests in this view yet.</p> : <div className="divide-y divide-[#173137]/10">{bookings.map((booking) => <button key={booking.id} onClick={() => { setSelected(booking); setAdminNotes(booking.admin_notes ?? ""); setCurrency(booking.currency); setSubtotalPence(booking.subtotal_pence == null ? "" : String(booking.subtotal_pence)); setTaxRatePercent(booking.tax_rate_basis_points == null ? "" : String(booking.tax_rate_basis_points / 100)); setTaxPence(booking.tax_pence == null ? "" : String(booking.tax_pence)); setTotalPence(booking.total_pence == null ? "" : String(booking.total_pence)); setPaymentStatus(booking.payment_status); setPaymentProvider(booking.payment_provider ?? ""); setPaymentReference(booking.payment_reference ?? ""); setPaidAt(booking.paid_at ? booking.paid_at.slice(0, 16) : ""); }} className={`admin-booking-row ${selected?.id === booking.id ? "admin-booking-selected" : ""}`}>
<div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-extrabold">{booking.customer_name}</p><span className={`admin-status ${statusTone[booking.status]}`}>{statusLabels[booking.status]}</span></div><p className="mt-1 truncate text-sm text-[#173137]/60">{booking.service_type} · {booking.postcode}</p><p className="mt-1 text-xs font-bold text-[#2f9f91]">{booking.preferred_date} at {booking.preferred_time.slice(0, 5)}</p><p className="mt-1 text-xs font-bold text-[#173137]/50">{booking.bin_cleaning ? "Bin cleaning" : `${booking.bedrooms} bed · ${booking.bathrooms} bath`}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-[#173137]/35" /></button>)}</div>}
          </section>
          <aside className="rounded-[24px] border border-[#173137]/10 bg-[#edf3ed] p-6">
            {selected ? <><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Request details</p><h2 className="font-display mt-3 text-3xl tracking-[-0.05em]">{selected.customer_name}</h2></div><span className={`admin-status ${statusTone[selected.status]}`}>{statusLabels[selected.status]}</span></div><div className="mt-7 space-y-4 text-sm"><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Service</strong>{selected.service_type} · {selected.frequency}</p><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Property details</strong>{selected.bin_cleaning ? "Bin cleaning — room counts not applicable" : `${selected.bedrooms} bedroom${selected.bedrooms === 1 ? "" : "s"} · ${selected.bathrooms} bathroom${selected.bathrooms === 1 ? "" : "s"}`}</p><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Preferred visit</strong>{selected.preferred_date} at {selected.preferred_time.slice(0, 5)}</p><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Contact</strong>{selected.customer_email}<br />{selected.postcode}</p><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Customer note</strong>{selected.notes || "No additional note"}</p></div><div className="mt-7 border-t border-[#173137]/10 pt-6"><p className="eyebrow">Pricing & payment</p><div className="mt-4 grid grid-cols-2 gap-3"><label className="admin-label">Currency<input className="admin-input" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={3} /></label><label className="admin-label">Payment status<select className="admin-input" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="partially_refunded">Partially refunded</option><option value="refunded">Refunded</option><option value="failed">Failed</option></select></label><label className="admin-label">Subtotal (pence)<input className="admin-input" type="number" min="0" step="1" value={subtotalPence} onChange={(event) => setSubtotalPence(event.target.value)} placeholder="e.g. 12000" /></label><label className="admin-label">Tax rate (%)<input className="admin-input" type="number" min="0" max="100" step="0.01" value={taxRatePercent} onChange={(event) => setTaxRatePercent(event.target.value)} placeholder="e.g. 20" /></label><label className="admin-label">Tax (pence)<input className="admin-input" type="number" min="0" step="1" value={taxPence} onChange={(event) => setTaxPence(event.target.value)} placeholder="e.g. 2400" /></label><label className="admin-label">Total (pence)<input className="admin-input" type="number" min="0" step="1" value={totalPence} onChange={(event) => setTotalPence(event.target.value)} placeholder="e.g. 14400" /></label></div><label className="admin-label mt-3">Payment provider<input className="admin-input" value={paymentProvider} onChange={(event) => setPaymentProvider(event.target.value)} placeholder="e.g. Stripe" /></label><label className="admin-label mt-3">Payment reference<input className="admin-input" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Provider reference only — no card details" /></label><label className="admin-label mt-3">Paid at<input className="admin-input" type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} /></label><p className="mt-3 text-xs leading-5 text-[#173137]/50">Amounts are stored as whole pence. Never enter card numbers, bank details or security codes.</p></div><label className="admin-label mt-7" htmlFor="admin-notes">Internal note</label><textarea id="admin-notes" className="admin-input min-h-28 resize-y" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} placeholder="Next action, quote or contact note" /><button disabled={saving} onClick={() => void updateBooking(selected.status)} className="admin-action-button mt-4 w-full justify-center">{saving ? "Saving…" : "Save pricing & payment"}</button><div className="mt-5 grid grid-cols-2 gap-2">{(["contacted", "confirmed", "completed", "cancelled"] as BookingStatus[]).map((nextStatus) => <button key={nextStatus} disabled={saving} onClick={() => void updateBooking(nextStatus)} className="admin-action-button">{nextStatus === selected.status ? <Check className="h-3.5 w-3.5" /> : null}{statusLabels[nextStatus]}</button>)}</div></> : <div className="grid min-h-[340px] place-items-center text-center"><div><span className="admin-icon mx-auto"><ClipboardList className="h-6 w-6" /></span><p className="mt-5 text-sm font-bold text-[#173137]/60">Select a request to see the full details and next action.</p></div></div>}
          </aside>
        </div>
      </main>
    </div>
  );
}
