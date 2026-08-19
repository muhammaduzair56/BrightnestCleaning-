/**
 * BrightNest design reminder — the private admin uses the same calm ink/mint system as the
 * public site, with operational density, direct status clarity and no customer-facing clutter.
 */
import { Booking, BookingStatus, bookingApi, configuredApiUrl, Dashboard } from "@/lib/api";
import { Check, ChevronRight, ClipboardList, LockKeyhole, LogOut, Mail, RefreshCcw, ShieldCheck } from "lucide-react";
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

export default function Admin() {
  const [token, setToken] = useState(readStoredToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async (activeToken = token, activeFilter = filter) => {
    if (!activeToken) return;
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, bookingsResponse] = await Promise.all([
        bookingApi.dashboard(activeToken),
        bookingApi.list(activeToken, activeFilter),
      ]);
      setDashboard(dashboardResponse);
      setBookings(bookingsResponse.items);
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
  }, [filter, token]);

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

  const logout = () => {
    sessionStorage.removeItem("brightnest_admin_access");
    setToken("");
    setBookings([]);
    setDashboard(null);
    setSelected(null);
  };

  const updateBooking = async (status: BookingStatus) => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await bookingApi.update(token, selected.id, { status, admin_notes: adminNotes });
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
        {error && <p className="admin-error mt-6">{error}</p>}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {(["total", "new", "contacted", "confirmed", "completed", "cancelled"] as const).map((key) => <div key={key} className="admin-stat"><span>{key === "total" ? "All requests" : statusLabels[key]}</span><strong>{dashboard?.[key] ?? "—"}</strong></div>)}
        </div>
        <div className="mt-10 flex flex-wrap gap-2 border-b border-[#173137]/10 pb-5">
          {(Object.keys(statusLabels) as (BookingStatus | "all")[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={`admin-filter ${filter === item ? "admin-filter-active" : ""}`}>{statusLabels[item]}</button>)}
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="overflow-hidden rounded-[24px] border border-[#173137]/10 bg-white">
            {loading ? <p className="p-7 text-sm font-bold text-[#173137]/55">Loading booking requests…</p> : bookings.length === 0 ? <p className="p-7 text-sm font-bold text-[#173137]/55">No requests in this view yet.</p> : <div className="divide-y divide-[#173137]/10">{bookings.map((booking) => <button key={booking.id} onClick={() => { setSelected(booking); setAdminNotes(booking.admin_notes ?? ""); }} className={`admin-booking-row ${selected?.id === booking.id ? "admin-booking-selected" : ""}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-extrabold">{booking.customer_name}</p><span className={`admin-status ${statusTone[booking.status]}`}>{statusLabels[booking.status]}</span></div><p className="mt-1 truncate text-sm text-[#173137]/60">{booking.service_type} · {booking.postcode}</p><p className="mt-1 text-xs font-bold text-[#2f9f91]">{booking.preferred_date} at {booking.preferred_time.slice(0, 5)}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-[#173137]/35" /></button>)}</div>}
          </section>
          <aside className="rounded-[24px] border border-[#173137]/10 bg-[#edf3ed] p-6">
            {selected ? <><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Request details</p><h2 className="font-display mt-3 text-3xl tracking-[-0.05em]">{selected.customer_name}</h2></div><span className={`admin-status ${statusTone[selected.status]}`}>{statusLabels[selected.status]}</span></div><div className="mt-7 space-y-4 text-sm"><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Service</strong>{selected.service_type} · {selected.frequency}</p><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Preferred visit</strong>{selected.preferred_date} at {selected.preferred_time.slice(0, 5)}</p><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Contact</strong>{selected.customer_email}<br />{selected.postcode}</p><p><strong className="block text-xs uppercase tracking-[0.12em] text-[#173137]/45">Customer note</strong>{selected.notes || "No additional note"}</p></div><label className="admin-label mt-7" htmlFor="admin-notes">Internal note</label><textarea id="admin-notes" className="admin-input min-h-28 resize-y" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} placeholder="Next action, quote or contact note" /><div className="mt-5 grid grid-cols-2 gap-2">{(["contacted", "confirmed", "completed", "cancelled"] as BookingStatus[]).map((nextStatus) => <button key={nextStatus} disabled={saving} onClick={() => void updateBooking(nextStatus)} className="admin-action-button">{nextStatus === selected.status ? <Check className="h-3.5 w-3.5" /> : null}{statusLabels[nextStatus]}</button>)}</div></> : <div className="grid min-h-[340px] place-items-center text-center"><div><span className="admin-icon mx-auto"><ClipboardList className="h-6 w-6" /></span><p className="mt-5 text-sm font-bold text-[#173137]/60">Select a request to see the full details and next action.</p></div></div>}
          </aside>
        </div>
      </main>
    </div>
  );
}
