import { useState, useMemo, useRef, useEffect } from "react";

export type PreviousSessionItem = {
    sessionId: string;
    subscriberUrl: string;
    role: string;
    timestamp: string;
};

type PreviousSessionsPanelProps = {
    sessions: PreviousSessionItem[];
    onOpenSession: (session: PreviousSessionItem) => void;
    onSessionsChange?: (sessions: PreviousSessionItem[]) => void;
};

const SESSIONS_PER_PAGE = 8;
const LS_KEY = "flowTestingSessions";

const roleColors: Record<string, { bg: string; text: string; dot: string }> = {
    BAP: { bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
    BPP: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
    default: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

function getRoleStyle(role: string | undefined | null) {
    if (!role) return roleColors.default;
    return roleColors[role.toUpperCase()] ?? roleColors.default;
}

function formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function truncateId(id: string | undefined | null, len = 24): string {
    if (!id) return "—";
    if (id.length <= len) return id;
    return `${id.slice(0, len / 2)}…${id.slice(-len / 2)}`;
}

export const PreviousSessionsPanel = ({
    sessions,
    onOpenSession,
    onSessionsChange,
}: PreviousSessionsPanelProps) => {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("All");
    const [page, setPage] = useState(1);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const confirmRef = useRef<HTMLDivElement>(null);

    // Gather unique roles for filter tabs
    const roles = useMemo(() => {
        const set = new Set(sessions.map((s) => (s.role ?? "UNKNOWN").toUpperCase()));
        return ["All", ...Array.from(set).sort()];
    }, [sessions]);

    // Filtered + searched sessions
    const filtered = useMemo(() => {
        let list = sessions;
        if (roleFilter !== "All") {
            list = list.filter((s) => (s.role ?? "UNKNOWN").toUpperCase() === roleFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (s) =>
                    (s.sessionId ?? "").toLowerCase().includes(q) ||
                    (s.subscriberUrl ?? "").toLowerCase().includes(q) ||
                    (s.role ?? "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [sessions, search, roleFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / SESSIONS_PER_PAGE));

    // Reset to page 1 on filter/search change
    useEffect(() => {
        setPage(1);
    }, [search, roleFilter]);

    const paginated = filtered.slice((page - 1) * SESSIONS_PER_PAGE, page * SESSIONS_PER_PAGE);

    // Close confirm dropdown on outside click
    useEffect(() => {
        if (!showDeleteConfirm) return;
        const handler = (e: MouseEvent) => {
            if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
                setShowDeleteConfirm(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showDeleteConfirm]);

    const handleDeleteAll = () => {
        localStorage.removeItem(LS_KEY);
        onSessionsChange?.([]);
        setShowDeleteConfirm(false);
    };

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1500);
        });
    };

    return (
        <div
            className="mt-6 rounded-2xl border border-sky-100 bg-white overflow-hidden"
            style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}
        >
            {/* ── Header ── */}
            <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-sky-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-base leading-tight">
                                Local Session History
                            </h3>
                            <p className="text-sky-200 text-xs mt-0.5">
                                {sessions.length} saved · {filtered.length} shown
                            </p>
                        </div>
                    </div>

                    {/* Delete All */}
                    <div className="relative" ref={confirmRef}>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm((v) => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                            Clear All
                        </button>
                        {showDeleteConfirm && (
                            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 p-4 z-50">
                                <p className="text-xs font-medium text-slate-700 mb-3">
                                    This will permanently delete all {sessions.length} saved
                                    sessions.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDeleteAll}
                                        className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                    >
                                        Delete All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Search + Filter Bar ── */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex flex-col gap-2.5">
                {/* Search */}
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                        />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by session ID, URL or role…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder-slate-400 text-slate-700"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Role filter pills */}
                {roles.length > 2 && (
                    <div className="flex gap-1.5 flex-wrap">
                        {roles.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRoleFilter(r)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                                    roleFilter === r
                                        ? "bg-sky-600 text-white"
                                        : "bg-white border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600"
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Content ── */}
            {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mb-3">
                        <svg
                            className="w-6 h-6 text-sky-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-500">No sessions yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Sessions will appear here after you run flow tests
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <p className="text-sm font-medium text-slate-500">No results found</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Try a different search term or filter
                    </p>
                </div>
            ) : (
                <>
                    <div className="divide-y divide-slate-100">
                        {paginated.map((session, index) => {
                            const role = getRoleStyle(session.role ?? "UNKNOWN");
                            const isCopied = copiedId === session.sessionId;
                            const rowNum = (page - 1) * SESSIONS_PER_PAGE + index + 1;

                            return (
                                <div
                                    key={`${session.sessionId}-${index}`}
                                    className="group px-4 py-3.5 hover:bg-sky-50/40 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Row Number */}
                                        <span className="shrink-0 w-5 text-right text-xs text-slate-300 group-hover:text-sky-400 font-mono transition-colors">
                                            {rowNum}
                                        </span>

                                        {/* Role dot */}
                                        <div
                                            className={`shrink-0 w-2 h-2 rounded-full ${role.dot}`}
                                        />

                                        {/* Main content */}
                                        <div className="min-w-0 flex-1">
                                            {/* Top row: session ID + copy button */}
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-semibold text-slate-800 truncate">
                                                    {truncateId(session.sessionId)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyId(session.sessionId)}
                                                    title="Copy full session ID"
                                                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-sky-500"
                                                >
                                                    {isCopied ? (
                                                        <svg
                                                            className="w-3 h-3 text-green-500"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2.5}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            className="w-3 h-3"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>

                                            {/* URL */}
                                            <p
                                                className="text-xs text-slate-400 truncate mt-0.5"
                                                title={session.subscriberUrl}
                                            >
                                                {session.subscriberUrl}
                                            </p>

                                            {/* Meta row */}
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${role.bg} ${role.text}`}
                                                >
                                                    {session.role ?? "Unknown"}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {formatRelativeTime(session.timestamp)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Open button */}
                                        <button
                                            type="button"
                                            onClick={() => onOpenSession(session)}
                                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 active:scale-95 transition-all shadow-sm shadow-sky-200"
                                        >
                                            Open
                                            <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Pagination ── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
                            <p className="text-xs text-slate-500">
                                {(page - 1) * SESSIONS_PER_PAGE + 1}–
                                {Math.min(page * SESSIONS_PER_PAGE, filtered.length)} of{" "}
                                {filtered.length}
                            </p>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:border hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>

                                {/* Page number pills */}
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(
                                        (p) =>
                                            p === 1 || p === totalPages || Math.abs(p - page) <= 1
                                    )
                                    .reduce<(number | "…")[]>((acc, p, i, arr) => {
                                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) =>
                                        p === "…" ? (
                                            <span
                                                key={`ellipsis-${i}`}
                                                className="text-xs text-slate-400 px-1"
                                            >
                                                …
                                            </span>
                                        ) : (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPage(p as number)}
                                                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                                                    page === p
                                                        ? "bg-sky-600 text-white"
                                                        : "text-slate-600 hover:bg-white hover:border hover:border-slate-200"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}

                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:border hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
