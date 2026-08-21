/*
 * BrightNest design reminder — a quiet customer home journal: warm ivory canvas,
 * ink navy type, mint accents, generous but compact mobile rhythm, and no seeded data.
 */
import { CustomerBooking, CustomerDashboard, CustomerChangePayload, configuredApiUrl, customerApi } from "@/lib/api";
import { ArrowLeft, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, Download, KeyRound, LoaderCircle, LogOut, Mail, ReceiptText, RefreshCw, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";

const statusLabels: Record<CustomerBooking["status"], string> = {
  new: "Request received",
  contacted: "We’re in touch",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusTones: Record<CustomerBooking["status"], string> = {
  new: "bg-[#d9f0e8] text-[#173137]",
  contacted: "bg-[#f1c9ad] text-[#173137]",
  confirmed: "bg-[#173137] text-white",
  completed: "bg-[#dce8d5] text-[#173137]",
  cancelled: "bg-[#eee9dd] text-[#173137]/65",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const requestStatusLabels = { requested: "Change request sent", reviewed: "Being reviewed", resolved: "Change request resolved" } as const;
const today = new Date().toISOString().slice(0, 10);

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

function readStoredToken() {
  return sessionStorage.getItem("brightnest_customer_access") ?? "";
}

function ChangeRequestPanel({ booking, token, onSubmitted, onClose }: { booking: CustomerBooking; token: string; onSubmitted: () => void; onClose: () => void }) {
  const [requestType, setRequestType] = useState<CustomerChangePayload["request_type"]>("reschedule");
  const [requestedDate, setRequestedDate] = useState(booking.preferred_date);
  const [requestedTime, setRequestedTime] = useState(booking.preferred_time.slice(0, 5));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const payload: CustomerChangePayload = { request_type: requestType, message: message.trim() || undefined };
    if (requestType === "reschedule") {
      payload.requested_date = requestedDate;
      payload.requested_time = requestedTime;
    }
    try {
      await customerApi.requestChange(token, booking.id, payload);
      onSubmitted();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not send that request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="mt-5 border-t border-[#173137]/10 pt-5" aria-live="polite">
    <div className="flex items-start justify-between gap-3"><div><p className="eyebrow text-[#2f9f91]">Booking change</p><h4 className="font-display mt-2 text-2xl tracking-[-0.04em]">Tell us what would suit you.</h4></div><button type="button" onClick={onClose} aria-label="Close booking change form" className="grid h-9 w-9 place-items-center rounded-full border border-[#173137]/15 text-[#173137]/60 hover:text-[#173137]"><X className="h-4 w-4" /></button></div>
    <form onSubmit={submitRequest} className="mt-5 grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-[#173137]/75">What would you like to do?<select value={requestType} onChange={(event) => setRequestType(event.target.value as CustomerChangePayload["request_type"])} className="rounded-[14px] border border-[#173137]/15 bg-[#f8f6ef] px-4 py-3 text-[#173137] outline-none focus:ring-2 focus:ring-[#2f9f91]"><option value="reschedule">Request a different date or time</option><option value="cancel">Request cancellation</option></select></label>
      {requestType === "reschedule" && <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-[#173137]/75">Preferred new date<input type="date" min={today} value={requestedDate} onChange={(event) => setRequestedDate(event.target.value)} className="rounded-[14px] border border-[#173137]/15 bg-[#f8f6ef] px-4 py-3 text-[#173137] outline-none focus:ring-2 focus:ring-[#2f9f91]" required /></label><label className="grid gap-2 text-sm font-bold text-[#173137]/75">Preferred new time<input type="time" value={requestedTime} onChange={(event) => setRequestedTime(event.target.value)} className="rounded-[14px] border border-[#173137]/15 bg-[#f8f6ef] px-4 py-3 text-[#173137] outline-none focus:ring-2 focus:ring-[#2f9f91]" required /></label></div>}
      <label className="grid gap-2 text-sm font-bold text-[#173137]/75">A note for the team <span className="font-normal text-[#173137]/45">Optional</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} placeholder="Add any helpful context" className="resize-y rounded-[14px] border border-[#173137]/15 bg-[#f8f6ef] px-4 py-3 text-[#173137] outline-none placeholder:text-[#173137]/35 focus:ring-2 focus:ring-[#2f9f91]" /></label>
      {error && <p className="rounded-[12px] bg-[#f1c9ad] px-4 py-3 text-sm font-bold text-[#173137]">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-full px-4 py-3 text-sm font-extrabold text-[#173137]/60 hover:text-[#173137]">Not now</button><button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#173137] px-5 py-3 text-sm font-extrabold text-white transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-60">{submitting ? "Sending request…" : "Send request"}<ArrowUpRight className="h-4 w-4" /></button></div>
    </form>
  </div>;
}

function formatMoney(currency: string, pence: number | null) {
  return pence === null ? "Not recorded" : `${currency} ${(pence / 100).toFixed(2)}`;
}

function PricingBreakdown({ booking }: { booking: CustomerBooking }) {
  const hasBreakdown = booking.subtotal_pence !== null || booking.tax_pence !== null || booking.total_pence !== null;
  if (!hasBreakdown) return <div className="mt-5 flex items-start gap-3 rounded-[16px] bg-[#f8f6ef] px-4 py-3 text-sm leading-6 text-[#173137]/60"><ReceiptText className="mt-1 h-4 w-4 shrink-0 text-[#2f9f91]" /><span>Pricing details have not been recorded for this visit yet.</span></div>;
  const total = booking.total_pence ?? 0;
  const subtotalWidth = total > 0 && booking.subtotal_pence !== null ? Math.min(100, Math.max(0, (booking.subtotal_pence / total) * 100)) : 0;
  const taxWidth = total > 0 && booking.tax_pence !== null ? Math.min(100, Math.max(0, (booking.tax_pence / total) * 100)) : 0;
  const paymentLabel = booking.payment_status.replaceAll("_", " ");
  return <div className="mt-5 rounded-[20px] border border-[#173137]/10 bg-[#f8f6ef] p-4 sm:p-5" aria-label="Pricing breakdown"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[#2f9f91]">Visit total</p><h4 className="font-display mt-1 text-3xl tracking-[-0.05em]">{formatMoney(booking.currency, booking.total_pence)}</h4></div><span className="rounded-full bg-[#dce8d5] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#173137]">{paymentLabel}</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#d9e3df]" role="img" aria-label={`Subtotal ${formatMoney(booking.currency, booking.subtotal_pence)} and tax ${formatMoney(booking.currency, booking.tax_pence)}`}><div className="flex h-full"><span className="bg-[#2f9f91]" style={{ width: `${subtotalWidth}%` }} /><span className="bg-[#f1c9ad]" style={{ width: `${taxWidth}%` }} /></div></div><div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div className="flex items-center justify-between gap-4"><span className="flex items-center gap-2 text-[#173137]/60"><span className="h-2.5 w-2.5 rounded-full bg-[#2f9f91]" /> Subtotal</span><strong>{formatMoney(booking.currency, booking.subtotal_pence)}</strong></div><div className="flex items-center justify-between gap-4"><span className="flex items-center gap-2 text-[#173137]/60"><span className="h-2.5 w-2.5 rounded-full bg-[#f1c9ad]" /> Tax{booking.tax_rate_basis_points !== null ? ` (${(booking.tax_rate_basis_points / 100).toFixed(2)}%)` : ""}</span><strong>{formatMoney(booking.currency, booking.tax_pence)}</strong></div></div><div className="mt-4 flex items-center justify-between border-t border-[#173137]/10 pt-3 text-sm"><span className="font-bold text-[#173137]/60">Payment status</span><strong className="capitalize">{paymentLabel}</strong></div></div>;
}

function BookingCard({ booking, token, onChanged, showReceipt = false }: { booking: CustomerBooking; token?: string; onChanged?: () => void; showReceipt?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const canChange = Boolean(token) && !booking.change_request;
  const downloadReceipt = async () => {
    if (!token) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const pdf = await customerApi.downloadReceipt(token, booking.id);
      const url = URL.createObjectURL(pdf);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `brightnest-receipt-${booking.id.slice(0, 8).toLowerCase()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setDownloadError(requestError instanceof Error ? requestError.message : "We could not prepare your receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  };
  return <article className="rounded-[24px] border border-[#173137]/10 bg-white p-5 shadow-[0_18px_50px_rgba(23,49,55,0.06)] sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#2f9f91]">{formatDate(booking.preferred_date)}</p><h3 className="font-display mt-2 text-[28px] leading-none tracking-[-0.055em] text-[#173137]">{booking.service_type}</h3></div><span className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] ${statusTones[booking.status]}`}>{statusLabels[booking.status]}</span></div>
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#173137]/10 pt-4 text-sm font-bold text-[#173137]/65"><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#2f9f91]" /> {booking.preferred_time.slice(0, 5)}</span><span>{booking.frequency}</span>{booking.total_pence !== null && <span>{booking.currency} {(booking.total_pence / 100).toFixed(2)} · {booking.payment_status.replace("_", " ")}</span>}</div>
    <p className="mt-4 text-xs font-bold text-[#173137]/45">Reference {booking.id.slice(0, 8).toUpperCase()}</p>
    {showReceipt && <PricingBreakdown booking={booking} />}
    {booking.change_request ? <div className="mt-5 flex items-start gap-3 rounded-[16px] bg-[#edf3ed] px-4 py-3 text-sm font-bold leading-6 text-[#173137]/70"><RefreshCw className="mt-1 h-4 w-4 shrink-0 text-[#2f9f91]" /><span>{requestStatusLabels[booking.change_request.status]}. The BrightNest team will contact you by email.</span></div> : canChange && <button type="button" onClick={() => setEditing((open) => !open)} className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#173137]/15 px-4 py-2.5 text-sm font-extrabold text-[#173137] transition-colors hover:border-[#2f9f91] hover:text-[#2f9f91]">Change this booking <ArrowUpRight className="h-4 w-4" /></button>}
    {showReceipt && token && <div className="mt-5 border-t border-[#173137]/10 pt-4"><button type="button" onClick={() => void downloadReceipt()} disabled={downloading} className="inline-flex items-center gap-2 rounded-full border border-[#173137]/15 px-4 py-2.5 text-sm font-extrabold text-[#173137] transition-colors hover:border-[#2f9f91] hover:text-[#2f9f91] disabled:cursor-wait disabled:opacity-60">{downloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{downloading ? "Preparing receipt…" : "Download receipt"}</button>{downloadError && <p className="mt-3 text-sm font-bold text-[#b35b3d]" role="alert">{downloadError}</p>}</div>}
    {editing && token && <ChangeRequestPanel booking={booking} token={token} onSubmitted={() => { setEditing(false); onChanged?.(); }} onClose={() => setEditing(false)} />}
  </article>;
}

function BookingGroup({ title, intro, bookings, empty, token, onChanged, showReceipt = false }: { title: string; intro: string; bookings: CustomerBooking[]; empty: string; token?: string; onChanged?: () => void; showReceipt?: boolean }) {
  return <section><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="eyebrow">{title}</p><p className="mt-2 text-sm text-[#173137]/60">{intro}</p></div><span className="text-sm font-extrabold text-[#2f9f91]">{bookings.length} {bookings.length === 1 ? "booking" : "bookings"}</span></div><div className="mt-4 grid gap-4">{bookings.length ? bookings.map((booking) => <BookingCard key={booking.id} booking={booking} token={token} onChanged={onChanged} showReceipt={showReceipt && booking.status === "completed"} />) : <div className="rounded-[24px] border border-dashed border-[#173137]/20 bg-[#edf3ed] p-6 text-sm font-bold leading-6 text-[#173137]/60">{empty}</div>}</div></section>;
}

export default function Dashboard() {
  const [token, setToken] = useState(readStoredToken);
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [loading, setLoading] = useState(Boolean(new URLSearchParams(window.location.search).get("token")));
  const [error, setError] = useState("");

  const loadDashboard = async (activeToken: string) => { setLoading(true); setError(""); try { setDashboard(await customerApi.bookings(activeToken)); } catch (requestError) { sessionStorage.removeItem("brightnest_customer_access"); setToken(""); setDashboard(null); setError(requestError instanceof Error ? requestError.message : "Your dashboard could not be loaded."); } finally { setLoading(false); } };

  useEffect(() => { const oneTimeToken = new URLSearchParams(window.location.search).get("token"); if (oneTimeToken) { void customerApi.exchange(oneTimeToken).then((response) => { sessionStorage.setItem("brightnest_customer_access", response.access_token); window.history.replaceState({}, document.title, "/dashboard"); setToken(response.access_token); return loadDashboard(response.access_token); }).catch((requestError) => { setLoading(false); setError(requestError instanceof Error ? requestError.message : "This dashboard link is invalid or expired."); window.history.replaceState({}, document.title, "/dashboard"); }); } else if (token) { void loadDashboard(token); } }, []);

  const requestLink = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); setError(""); setLinkSent(false); try { await customerApi.requestAccess(email.trim()); setLinkSent(true); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "We could not request a dashboard link."); } finally { setLoading(false); } };
  const logout = () => { sessionStorage.removeItem("brightnest_customer_access"); setToken(""); setDashboard(null); setLinkSent(false); };

  if (!configuredApiUrl) return <div className="min-h-screen bg-[#f8f6ef] px-5 py-8 text-[#173137] sm:px-8"><Link href="/" className="inline-flex items-center gap-2 text-sm font-extrabold"><ArrowLeft className="h-4 w-4" /> Back to BrightNest</Link><section className="mx-auto mt-20 max-w-2xl rounded-[32px] bg-[#173137] p-7 text-white sm:p-12"><KeyRound className="h-8 w-8 text-[#9ee0d2]" /><p className="eyebrow mt-8 text-[#9ee0d2]">Client dashboard</p><h1 className="font-display mt-4 text-5xl leading-[0.95] tracking-[-0.06em]">Your dashboard is almost ready.</h1><p className="mt-6 max-w-xl text-base leading-7 text-white/65">We’re preparing your secure view of every BrightNest visit. Please try again shortly, or return to the main site to make a new booking request.</p><Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#9ee0d2] px-5 py-3 text-sm font-extrabold text-[#173137]">Return to BrightNest <ArrowUpRight className="h-4 w-4" /></Link></section></div>;
  if (loading && (token || new URLSearchParams(window.location.search).get("token"))) return <main className="min-h-screen bg-[#f8f6ef] px-5 py-6 text-[#173137] sm:px-8 sm:py-10"><div className="mx-auto max-w-5xl"><Link href="/" className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-[16px] bg-[#d9f0e8]"><img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/nGxiaCTVOHaPBQzw.png" alt="BrightNest Cleaning UK" className="h-9 w-9 object-contain" /></span><span className="font-display text-[28px] tracking-[-0.055em]">BrightNest</span></Link><section className="mt-20 max-w-xl"><p className="eyebrow text-[#2f9f91]">One quiet moment</p><h1 className="font-display mt-4 text-5xl leading-[0.95] tracking-[-0.06em]">Gathering your visits.</h1><p className="mt-5 text-base leading-7 text-[#173137]/60">We’re bringing your BrightNest booking history into view.</p><div className="mt-8 h-1.5 w-32 overflow-hidden rounded-full bg-[#d9f0e8]"><div className="h-full w-1/2 animate-pulse rounded-full bg-[#2f9f91]" /></div></section></div></main>;
  if (token && dashboard) return <main className="min-h-screen bg-[#f8f6ef] px-5 py-6 text-[#173137] sm:px-8 sm:py-10"><div className="mx-auto max-w-5xl"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#173137]/10 pb-6"><Link href="/" className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-[16px] bg-[#d9f0e8]"><img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/nGxiaCTVOHaPBQzw.png" alt="BrightNest Cleaning UK" className="h-9 w-9 object-contain" /></span><span className="font-display text-[28px] tracking-[-0.055em]">BrightNest</span></Link><button type="button" onClick={logout} className="inline-flex items-center gap-2 text-sm font-extrabold text-[#173137]/60 hover:text-[#173137]"><LogOut className="h-4 w-4" /> Sign out</button></header><section className="py-10 sm:py-14"><p className="eyebrow">Your BrightNest account</p><h1 className="font-display mt-4 max-w-3xl text-5xl leading-[0.95] tracking-[-0.065em] sm:text-7xl">A calmer view of every visit.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[#173137]/65">Signed in securely for <strong className="text-[#173137]">{dashboard.customer_email}</strong>. Your upcoming plans and completed care stay together here.</p></section><div className="grid gap-10 pb-16 lg:grid-cols-2"><BookingGroup title="Coming up" intro="Your next scheduled cleaning requests." bookings={dashboard.upcoming} empty="No upcoming visits are on the calendar yet. When you send a new request, it will appear here." token={token} onChanged={() => void loadDashboard(token)} /><BookingGroup title="Past visits" intro="A quiet record of previous requests." bookings={dashboard.past} empty="Your past visits will appear here after a booking has been completed or passed." token={token} showReceipt /></div><footer className="border-t border-[#173137]/10 py-7 text-sm text-[#173137]/55"><Link href="/" className="font-extrabold text-[#2f9f91]">Back to BrightNest home</Link></footer></div></main>;
  return <main className="min-h-screen bg-[#f8f6ef] px-5 py-6 text-[#173137] sm:px-8 sm:py-10"><div className="mx-auto max-w-5xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-extrabold"><ArrowLeft className="h-4 w-4" /> Back to BrightNest</Link><div className="grid gap-8 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-24"><section><span className="grid h-14 w-14 place-items-center rounded-[20px] bg-[#d9f0e8]"><CalendarDays className="h-7 w-7 text-[#2f9f91]" /></span><p className="eyebrow mt-10">Client dashboard</p><h1 className="font-display mt-4 max-w-xl text-6xl leading-[0.92] tracking-[-0.07em] sm:text-7xl">Your cleaning, in one calm place.</h1><p className="mt-6 max-w-lg text-base leading-7 text-[#173137]/65">Request a secure email link to see upcoming plans, then ask BrightNest to move or cancel an upcoming visit when your week changes.</p></section><section className="rounded-[30px] bg-[#173137] p-6 text-white shadow-[0_20px_60px_rgba(23,49,55,0.14)] sm:p-9"><Mail className="h-7 w-7 text-[#9ee0d2]" /><p className="eyebrow mt-8 text-[#9ee0d2]">Secure access</p><h2 className="font-display mt-3 text-4xl leading-[0.98] tracking-[-0.055em]">Send me my link.</h2><form onSubmit={requestLink} className="mt-8"><label className="block text-sm font-bold text-white/80" htmlFor="customer-dashboard-email">Email address</label><input id="customer-dashboard-email" className="mt-2 w-full rounded-[14px] border border-white/15 bg-white px-4 py-3.5 text-[#173137] outline-none ring-[#9ee0d2] placeholder:text-[#173137]/40 focus:ring-2" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />{error && <p className="mt-4 rounded-[12px] bg-[#f1c9ad] px-4 py-3 text-sm font-bold text-[#173137]">{error}</p>}{linkSent && <p className="mt-4 rounded-[12px] bg-[#d9f0e8] px-4 py-3 text-sm font-bold text-[#173137]"><CheckCircle2 className="mr-2 inline h-4 w-4" />If that email has a BrightNest booking, the secure link is on its way.</p>}<button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#9ee0d2] px-5 py-4 text-sm font-extrabold text-[#173137] transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-60" type="submit" disabled={loading}>{loading ? "Sending secure link…" : "Email me the dashboard link"}<ArrowUpRight className="h-4 w-4" /></button></form><p className="mt-5 text-xs leading-5 text-white/45">Links expire after 30 minutes and can only be used for the email that requested them.</p></section></div></div></main>;
}
