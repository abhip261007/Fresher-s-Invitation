import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Download,
  RefreshCw,
  Trash2,
  X,
  Lock,
  Unlock,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export interface JuniorRecord {
  id: number;
  enrollment_no: string;
  full_name: string;
  dob: string;
  created_at: string;
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export function AdminModal({ isOpen, onClose, onDataChanged }: AdminModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [juniors, setJuniors] = useState<JuniorRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch juniors list from SQLite backend
  const fetchJuniors = async (query = "") => {
    setIsLoading(true);
    try {
      const url = query ? `/api/juniors?q=${encodeURIComponent(query)}` : "/api/juniors";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setJuniors(data.juniors || []);
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to load database records" });
      }
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: "Could not connect to database backend. Ensure Vite dev server is running.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchJuniors(searchQuery);
    }
  }, [isOpen, isAuthenticated]);

  // Handle Passcode Unlock (Council Key)
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "2029" || passcode.trim().toLowerCase() === "saarthi2029") {
      setIsAuthenticated(true);
      setPasscodeError("");
      fetchJuniors();
    } else {
      setPasscodeError("Incorrect Council PIN. Please try again.");
    }
  };

  // Delete junior record
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/juniors/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setJuniors((prev) => prev.filter((j) => j.id !== id));
        setDeleteConfirmId(null);
        setActionMessage({ type: "success", text: "Entry successfully removed from database." });
        setTimeout(() => setActionMessage(null), 3000);
        if (onDataChanged) onDataChanged();
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to delete entry" });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error while deleting entry." });
    }
  };

  // Trigger CSV Download
  const handleExportCSV = () => {
    window.open("/api/juniors/export", "_blank");
  };

  // Format Date of Birth nicely
  const formatDOB = (dobStr: string) => {
    if (!dobStr) return "N/A";
    const parts = dobStr.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
      const day = parts[2];
      return `${day} ${month} ${year}`;
    }
    return dobStr;
  };

  // Format Registration Timestamp
  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00072D]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,7,45,0.6)] border border-[#0A2472]/20 overflow-hidden flex flex-col text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#00072D] via-[#0A2472] to-[#1A43BF] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <Users className="h-5 w-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel text-lg sm:text-xl font-bold tracking-wide">
                  Saarthi 2026 • Juniors Roster
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> SQLite Active
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-0.5">
                Senior Council Administrative Database Viewer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Admin Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Notifications */}
        {actionMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                : "bg-red-50 text-red-800 border-b border-red-200"
            }`}
          >
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Body Content */}
        {!isAuthenticated ? (
          /* Council Access Passcode Gate */
          <div className="p-8 sm:p-12 flex flex-col items-center text-center my-auto">
            <div className="h-16 w-16 rounded-2xl bg-[#0A2472]/10 border border-[#1A43BF]/20 flex items-center justify-center text-[#1A43BF] mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <h4 className="font-cinzel text-2xl font-bold text-[#00072D]">
              Senior Council Verification
            </h4>
            <p className="text-xs text-[#475569] max-w-sm mt-2">
              Access to view registered CAIT 1st year students and export database records is restricted to senior organizers.
            </p>

            <form onSubmit={handleUnlock} className="mt-6 w-full max-w-xs space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter PIN"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  autoFocus
                  className="w-full text-center tracking-[0.3em] font-mono text-lg rounded-2xl border border-slate-300 bg-[#F8FAFC] py-3 text-[#00072D] focus:border-[#1A43BF] focus:bg-white focus:ring-2 focus:ring-[#1A43BF]/20 outline-none transition-all"
                />
                {passcodeError && (
                  <p className="mt-2 text-xs text-red-500 font-medium">{passcodeError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00072D] via-[#0A2472] to-[#1A43BF] py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <Unlock className="h-4 w-4" /> Unlock Roster
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-5">
            {/* Top Toolbar: Search, Count, Refresh, Export */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Junior's name or date of birth..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchJuniors(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs text-[#00072D] placeholder-slate-400 focus:border-[#1A43BF] focus:bg-white focus:ring-2 focus:ring-[#1A43BF]/20 outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => fetchJuniors(searchQuery)}
                  disabled={isLoading}
                  title="Reload from SQLite database"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#1A43BF]" : ""}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  disabled={juniors.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00072D] via-[#0A2472] to-[#1A43BF] text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="h-3.5 w-3.5 text-sky-300" />
                  <span>Export to Excel (CSV)</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total Registered Juniors
                </span>
                <span className="text-2xl font-black text-[#00072D] font-cinzel">
                  {juniors.length}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                  Database Engine
                </span>
                <span className="text-sm font-bold text-sky-950 flex items-center gap-1 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Node.js Native SQLite3
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                  Database File
                </span>
                <span className="text-xs font-mono font-bold text-indigo-950 truncate block mt-1">
                  data/freshers.db
                </span>
              </div>
            </div>

            {/* Data Table Container */}
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white">
              {isLoading && juniors.length === 0 ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#1A43BF] mb-3" />
                  <p className="text-xs font-medium">Fetching roster from SQLite database...</p>
                </div>
              ) : juniors.length === 0 ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Users className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-600">No juniors registered yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    When 1st year students submit the registration form, their Name and DOB will appear here.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 sticky top-0 z-10">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Enrollment No.</th>
                      <th className="py-3 px-4">Junior's Legal Name</th>
                      <th className="py-3 px-4">Date of Birth (DOB)</th>
                      <th className="py-3 px-4">Registered On</th>
                      <th className="py-3 px-4 text-center w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {juniors.map((junior, index) => (
                      <tr
                        key={junior.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-400 text-center">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1A43BF]">
                          <span className="px-2.5 py-1 rounded-md bg-[#0A2472]/5 border border-[#1A43BF]/20 text-xs">
                            {junior.enrollment_no || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#00072D]">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#00072D] to-[#1A43BF] text-white text-[11px] font-bold flex items-center justify-center uppercase shrink-0">
                              {junior.full_name.charAt(0)}
                            </div>
                            <span>{junior.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100 text-sky-900 font-semibold">
                            <Calendar className="h-3 w-3 text-sky-600" />
                            <span>{formatDOB(junior.dob)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{formatTimestamp(junior.created_at)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {deleteConfirmId === junior.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleDelete(junior.id)}
                                title="Confirm Delete"
                                className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[10px] hover:bg-red-700 cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                title="Cancel"
                                className="px-2 py-1 rounded bg-slate-200 text-slate-700 font-bold text-[10px] hover:bg-slate-300 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(junior.id)}
                              title="Delete entry"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Summary */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Showing {juniors.length} junior record{juniors.length === 1 ? "" : "s"}</span>
              <span className="font-medium text-slate-400">
                Permanent SQLite storage in <code className="text-slate-600 font-mono">data/freshers.db</code>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminModal;
