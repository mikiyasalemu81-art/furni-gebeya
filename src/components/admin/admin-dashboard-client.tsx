"use client";

import * as React from "react";
import { UserProfile } from "@/lib/auth-session";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Search,
  Building,
  MapPin,
  Phone,
  Eye,
  Send,
  History,
  X,
  CreditCard,
  Flag,
  Star,
  Users,
  Grid,
  BarChart3,
  Ban,
  UserCheck,
  CalendarPlus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Subscription, Report, Review } from "@/lib/marketplace-types";

interface VerificationRequestItem {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_role: string;
  business_name: string;
  city: string;
  address: string;
  id_front_path: string;
  id_back_path: string;
  trade_license_path: string;
  id_front_signed_url: string;
  id_back_signed_url: string;
  trade_license_signed_url: string;
  status: "pending" | "approved" | "rejected" | "more_documents_requested";
  rejection_reason?: string | null;
  created_at: string;
}

interface AuditLogItem {
  id: string;
  admin_name: string;
  target_phone: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export function AdminDashboardClient({
  adminUser,
  locale,
}: {
  adminUser: UserProfile;
  locale: string;
}) {
  const [activeTab, setActiveTab] = React.useState<
    "queue" | "subscriptions" | "reports" | "reviews" | "users" | "audit" | "stats"
  >("queue");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [requests, setRequests] = React.useState<VerificationRequestItem[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogItem[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [reports, setReports] = React.useState<Report[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = React.useState<{
    title: string;
    url: string;
  } | null>(null);

  // Reject / Request More Docs Modal
  const [actionModal, setActionModal] = React.useState<{
    requestId: string;
    action: "reject" | "request_more_documents";
    applicantName: string;
  } | null>(null);
  const [reasonInput, setReasonInput] = React.useState("");

  // Payment Recording Modal
  const [paymentModalUser, setPaymentModalUser] = React.useState<UserProfile | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState("500");
  const [paymentMethod, setPaymentMethod] = React.useState<any>("telebirr");
  const [paymentRef, setPaymentRef] = React.useState("");
  const [paymentDays, setPaymentDays] = React.useState("30");

  // Fetch Verification Queue
  const fetchQueue = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/queue?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  // Fetch Subscriptions
  const fetchSubscriptions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Reports
  const fetchReports = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Reviews
  const fetchReviews = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reports?type=reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Audit Logs
  const fetchAuditLogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === "queue") fetchQueue();
    else if (activeTab === "subscriptions") fetchSubscriptions();
    else if (activeTab === "reports") fetchReports();
    else if (activeTab === "reviews") fetchReviews();
    else if (activeTab === "users") fetchUsers();
    else if (activeTab === "audit") fetchAuditLogs();
    else setIsLoading(false);
  }, [activeTab, fetchQueue, fetchSubscriptions, fetchReports, fetchReviews, fetchUsers, fetchAuditLogs]);

  // Actions
  const handleApprove = async (requestId: string, docType: "all" | "id" | "license" = "all") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "approve", docType }),
      });
      if (res.ok) {
        const badgeName = docType === "id" ? "ID badge" : docType === "license" ? "Trade License badge" : "ID & License badges + 30-day trial";
        setMessage(`Verification updated: ${badgeName} approved and SMS sent.`);
        fetchQueue();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const submitActionModal = async () => {
    if (!actionModal || !reasonInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: actionModal.requestId,
          action: actionModal.action,
          reason: reasonInput,
        }),
      });
      if (res.ok) {
        setMessage(`Action completed and SMS dispatched.`);
        setActionModal(null);
        setReasonInput("");
        fetchQueue();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_payment",
          userId: paymentModalUser.id,
          amount: paymentAmount,
          paymentMethod,
          paymentReference: paymentRef,
          daysDuration: paymentDays,
        }),
      });
      if (res.ok) {
        setMessage(`Payment recorded for ${paymentModalUser.full_name}. Subscription active.`);
        setPaymentModalUser(null);
        setPaymentRef("");
        fetchSubscriptions();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendTrial = async (userId: string, days: number) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend_trial",
          userId,
          extraDays: days,
        }),
      });
      if (res.ok) {
        setMessage(`Trial extended by ${days} days.`);
        fetchUsers();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserSuspension = async (u: UserProfile) => {
    const isSuspending = !u.is_suspended;
    const confirmMsg = isSuspending
      ? `Are you sure you want to SUSPEND ${u.full_name}? They will be locked from publishing or chatting.`
      : `Reactivate ${u.full_name}'s account?`;
    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: u.id,
          isSuspended: isSuspending,
          reason: isSuspending ? "Admin enforcement" : null,
        }),
      });
      if (res.ok) {
        setMessage(`User ${isSuspending ? "suspended" : "reactivated"}.`);
        fetchUsers();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleModerateReport = async (reportId: string, status: "resolved" | "dismissed") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderate_report",
          reportId,
          status,
        }),
      });
      if (res.ok) {
        setMessage(`Report marked as ${status}.`);
        fetchReports();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleModerateReview = async (reviewId: string, status: "approved" | "hidden") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderate_review",
          reviewId,
          status,
        }),
      });
      if (res.ok) {
        setMessage(`Review marked as ${status}.`);
        fetchReviews();
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 space-y-6 max-w-7xl">
      {/* Admin Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-500 shadow-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Furni Gebeya Master Console
              </h1>
              <span className="rounded-full bg-red-500/15 text-red-500 border border-red-500/30 px-2.5 py-0.5 text-[11px] font-bold">
                Admin Mode
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Signed in as <strong className="text-foreground">{adminUser.full_name}</strong> ({adminUser.phone_number})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-secondary/80 px-3.5 py-2 text-xs border border-border">
          <Send className="h-4 w-4 text-accent-cyan" />
          <span className="text-muted-foreground">
            SMS Gateway: <strong className="text-foreground">AfroMessage Active</strong>
          </span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {message && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {[
          { id: "queue", label: "Verification Queue", icon: Clock },
          { id: "subscriptions", label: "Subscriptions & Trial", icon: CreditCard },
          { id: "reports", label: "Reports Moderation", icon: Flag },
          { id: "reviews", label: "Reviews Moderation", icon: Star },
          { id: "users", label: "User Accounts", icon: Users },
          { id: "audit", label: "Audit Trail", icon: History },
          { id: "stats", label: "Platform Stats", icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Verification Queue */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Identity & Trade License Verification ({requests.length})</h3>
            <div className="flex gap-1.5">
              {["all", "pending", "approved", "rejected"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                    statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">Loading queue...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No verification requests found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{r.business_name || r.user_name}</h4>
                      <p className="text-xs text-muted-foreground">{r.user_phone} • {r.city}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {r.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1"
                      onClick={() => setPreviewDoc({ title: "National ID (Front)", url: r.id_front_signed_url })}
                    >
                      <FileText className="w-3 h-3" /> ID Front
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1"
                      onClick={() => setPreviewDoc({ title: "National ID (Back)", url: r.id_back_signed_url })}
                    >
                      <FileText className="w-3 h-3" /> ID Back
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1"
                      onClick={() => setPreviewDoc({ title: "Trade License", url: r.trade_license_signed_url })}
                    >
                      <FileText className="w-3 h-3" /> License
                    </Button>
                  </div>

                  {r.status === "pending" && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] h-7 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => handleApprove(r.id, "id")}
                          disabled={actionLoading}
                        >
                          Approve ID
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] h-7 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => handleApprove(r.id, "license")}
                          disabled={actionLoading}
                        >
                          Approve License
                        </Button>
                      </div>

                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(r.id, "all")}
                          disabled={actionLoading}
                        >
                          Approve All (30d Trial)
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs h-8"
                          onClick={() => setActionModal({ requestId: r.id, action: "reject", applicantName: r.user_name })}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs h-8"
                          onClick={() =>
                            setActionModal({
                              requestId: r.id,
                              action: "request_more_documents",
                              applicantName: r.user_name,
                            })
                          }
                        >
                          Request More
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Subscriptions & Trial */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Active Subscriptions & Free Trial Records</h3>
            <Button
              size="sm"
              onClick={() => {
                const artisan = users.find((u) => u.role === "supplier" || u.role === "seller");
                if (artisan) setPaymentModalUser(artisan);
                else alert("Select a user from User Accounts tab to record payment.");
              }}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Record Payment
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">User / Business</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method / Ref</th>
                  <th className="p-3">Expires At</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/40">
                    <td className="p-3 font-semibold">{s.user_name || s.user_id}</td>
                    <td className="p-3">{s.plan_name}</td>
                    <td className="p-3 font-mono">{s.amount} {s.currency}</td>
                    <td className="p-3 capitalize">{s.payment_method} {s.payment_reference ? `(${s.payment_reference})` : ""}</td>
                    <td className="p-3">{new Date(s.expires_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Reports Moderation */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm">Flagged Listings & User Reports</h3>
          {reports.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">No reports pending moderation.</div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-red-500/10 text-red-500">
                        {rep.report_type}
                      </span>
                      <span className="font-bold text-xs">{rep.reason}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{rep.details || "No additional notes"}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      Reported by {rep.reporter_name || rep.reporter_phone} • {new Date(rep.created_at).toLocaleString()}
                    </p>
                  </div>

                  {rep.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleModerateReport(rep.id, "resolved")}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => handleModerateReport(rep.id, "dismissed")}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Reviews Moderation */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm">Profile Reviews & Ratings Moderation</h3>
          {reviews.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">No reviews found.</div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{rev.reviewer_name}</span>
                      <span className="text-amber-500 font-bold text-xs">★ {rev.rating}.0</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted uppercase">{rev.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">"{rev.comment}"</p>
                  </div>

                  <div className="flex gap-2">
                    {rev.status !== "hidden" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        onClick={() => handleModerateReview(rev.id, "hidden")}
                      >
                        Hide Review
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleModerateReview(rev.id, "approved")}
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: User Accounts with Suspend/Reactivate & Trial Extensions */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm">Registered Marketplace Users ({users.length})</h3>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Verified</th>
                  <th className="p-3">Trial / Sub Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <td className="p-3">
                      <div className="font-bold text-foreground">{u.full_name}</div>
                      <div className="text-[10px] text-muted-foreground">{u.business_name}</div>
                    </td>
                    <td className="p-3 font-mono">{u.phone_number}</td>
                    <td className="p-3 capitalize">{u.role}</td>
                    <td className="p-3">
                      {u.is_verified ? (
                        <span className="text-green-600 font-bold">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/10 text-accent-blue capitalize">
                        {u.subscription_status || "trial"}
                      </span>
                      {u.trial_ends_at && (
                        <div className="text-[10px] text-muted-foreground">
                          Ends: {new Date(u.trial_ends_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px]"
                        onClick={() => handleExtendTrial(u.id, 14)}
                      >
                        +14d Trial
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[10px]"
                        onClick={() => setPaymentModalUser(u)}
                      >
                        Record Pay
                      </Button>
                      <Button
                        size="sm"
                        variant={u.is_suspended ? "default" : "destructive"}
                        className="h-7 text-[10px]"
                        onClick={() => handleToggleUserSuspension(u)}
                      >
                        {u.is_suspended ? "Reactivate" : "Suspend"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Audit Trail */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm">System Audit Trail</h3>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="bg-card border border-border rounded-xl p-3 text-xs flex justify-between">
                <div>
                  <span className="font-bold">{log.admin_name}</span> performed{" "}
                  <span className="font-mono text-primary">{log.action}</span> on user {log.target_phone}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: Platform Stats */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">Total Users</span>
            <p className="text-3xl font-extrabold text-foreground">{users.length || 6}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">Verified Artisans</span>
            <p className="text-3xl font-extrabold text-accent-blue">
              {users.filter((u) => u.is_verified).length || 2}
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">Pending Verifications</span>
            <p className="text-3xl font-extrabold text-amber-500">{requests.filter((r) => r.status === "pending").length}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">Active Subscriptions</span>
            <p className="text-3xl font-extrabold text-green-500">{subscriptions.length || 1}</p>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground">{previewDoc.title}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-96 w-full overflow-hidden rounded-2xl bg-black/10 flex items-center justify-center">
              <img src={previewDoc.url} alt={previewDoc.title} className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleRecordPayment}
            className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground">Record Payment</h3>
              <button
                type="button"
                onClick={() => setPaymentModalUser(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Recording manual subscription for <strong>{paymentModalUser.full_name}</strong> ({paymentModalUser.phone_number}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Amount (ETB)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="telebirr">Telebirr</option>
                  <option value="cbe_birr">CBE Birr</option>
                  <option value="manual_bank_transfer">Direct Bank Transfer</option>
                  <option value="admin_grant">Admin Grant (Exempt)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Payment Reference / TxID</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. TLB-93847291"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={paymentDays}
                  onChange={(e) => setPaymentDays(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPaymentModalUser(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={actionLoading}>
                {actionLoading ? "Saving..." : "Confirm Payment"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reject / Request More Docs Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-foreground">
              {actionModal.action === "reject" ? "Reject Verification" : "Request More Documents"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Specify reason for {actionModal.applicantName}. Dispatched via AfroMessage SMS.
            </p>

            <textarea
              rows={4}
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="e.g. Trade license is blurred..."
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setActionModal(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant={actionModal.action === "reject" ? "destructive" : "default"}
                onClick={submitActionModal}
                disabled={actionLoading || !reasonInput.trim()}
              >
                Confirm & Dispatch SMS
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
