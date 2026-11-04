/**
 * API Routes Constants
 *
 * Centralized constants for all API endpoints used throughout the application.
 * This ensures consistency and makes it easier to update routes if needed.
 */

export const API_ROUTES = {
    // Flow routes
    FLOW: {
        TRIGGER: "/flow/trigger",
        TRIGGER_ACTION: (action: string) => `/flow/trigger/${action}`,
        CURRENT_STATE: "/flow/current-state",
        PROCEED: "/flow/proceed",
        NEW: "/flow/new",
        EXTERNAL_FORM: "/flow/external-form",
        CUSTOM_FLOW: "/flow/custom-flow",
        ACTIONS: "/flow/actions",
        ROUTE: "/flow/route",
        GEOCODE: "/flow/geocode",
        // Resolves a public ride-tracking token into { session_id, transaction_id,
        // domain, version }. The token is minted seller-side and reaches the buyer
        // as `message.tracking.url` on on_track.
        TRACK_CONTEXT: "/flow/track-context",
        REPORT: "/flow/report",
        VALIDATE: (action: string) => `/flow/validate/${action}`,
    },

    // Session routes
    SESSIONS: {
        BASE: "/sessions",
        CLEAR_FLOW: "/sessions/clearFlow",
        TRANSACTION: "/sessions/transaction",
        EXPECTATION: "/sessions/expectation",
        FLOW_PERMISSION: "/sessions/flowPermission",
        PLAYGROUND: "/sessions/playground",
    },

    // Database routes
    DB: {
        PAYLOAD: "/db/payload",
        REPORT: "/db/report",
        SESSIONS: "/db/sessions",
        ADMIN_AUTH: "/db/admin/auth",
        PAYLOADS: (domain: string, version: string, action: string, page?: string) =>
            `/db/payloads/${domain}/${version}/${action}/${page || "1"}`,
        SUBSCRIBER_URLS: (userId: string) => `/db/subscriber-urls/${userId}`,
        SESSION_PAYLOADS: (sessionId: string) => `/db/sessions/${sessionId}/payloads`,
    },

    // Config routes
    CONFIG: {
        SCENARIO_FORM_DATA: "/config/senarioFormData",
        REPORTING_STATUS: "/config/reportingStatus",
        FLOWS: "/config/flows",
    },

    // Logs routes
    LOGS: {
        BASE: "/logs",
    },

    // Form callback routes (cross-service contract with api-service GET /callback,
    // which writes form_completed:{session_id})
    FORM: {
        CHECK_COMPLETION: "/form/check-completion",
        RESET_COMPLETION: "/form/reset-completion",
        SAVE_REDIRECTION: "/form/save-redirection",
    },

    // Finvu Account Aggregator routes
    FINVU: {
        CHECK_COMPLETION: "/finvu/check-completion",
        VERIFY_CONSENT: "/finvu/verify-consent",
    },

    // API routes (external services)
    API: {
        SESSIONS_FLOWS: (sessionId: string) => `/api/sessions/flows/${sessionId}`,
    },

    // Image upload routes
    IMAGES: {
        UPLOAD: "/images/upload",
        UPLOAD_MULTIPLE: "/images/upload-multiple",
    },

    AUTH: {
        // LOGOUT: "/auth/logout",
        ME: "/auth/api/me",
        EXCHANGE: "/auth/exchange",
        PROVIDER: "/auth/provider",
        SUBSCRIBE: "/auth/subscribe",
        LOOKUP: "/auth/lookup",
        GENERATE_KEYS: "/auth/api/generate-keys",
    },

    // Seller routes
    SELLER: {
        ON_SEARCH: "/seller/on_search",
    },

    USER: {
        SCENARIO_PREFERENCES: "/user/scenario-preferences",
        SCENARIO_PREFERENCE_BY_KEY: (configKey: string) =>
            `/user/scenario-preferences/${configKey}`,
        PAST_REPORTS: (userId: string) => `/reports/user/${userId}`,
        FLOW_DATA: "/reports/flow-data",
    },

    /**
     * MCP API key (user-management). One key per user, so every verb shares one
     * path. The key is returned by POST exactly once and is never readable
     * again — GET returns metadata only.
     */
    MCP_KEY: {
        BASE: "/user/mcp-key",
    },

    HEALTH: {
        API_SERVICE: "/health/api-service",
    },

    NOTES: {
        BASE: "api/notes",
        BY_ID: (noteId: string) => `api/notes/${noteId}`,
    },

    COMMENTS: {
        BASE: "api/comments",
        BY_ID: (commentsId: string) => `api/comments/${commentsId}`,
        RESOLVE: (commentsId: string) => `api/comments/${commentsId}/resolve`,
    },

    DEV_GUIDE: {
        BUILDS: "dev-guide/available-builds",
        SPEC: (domain: string, version: string) =>
            `dev-guide/spec/${encodeURIComponent(domain)}/${encodeURIComponent(version)}`,
    },

    // Seller load-testing routes (load-test backend)
    LOAD_TEST: {
        SESSIONS: "/sessions/",
        SESSION_BY_ID: (sessionId: string) => `/sessions/${sessionId}`,
        DISCOVERY_PAYLOAD: (sessionId: string) => `/sessions/${sessionId}/discovery/payload`,
        DISCOVERY: (sessionId: string) => `/sessions/${sessionId}/discovery`,
        PREORDER: (sessionId: string) => `/sessions/${sessionId}/preorder`,
        RUN_STATUS: (sessionId: string, runId: string) => `/sessions/${sessionId}/runs/${runId}`,
    },
} as const;
