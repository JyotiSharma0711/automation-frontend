/**
 * Route constants for the application
 * All route paths should be defined here and used throughout the project
 */
export const ROUTES = {
    HOME: "/",
    SCHEMA: "/schema-validation",
    SCENARIO: "/scenario",
    FLOW_TESTING: "/flow-testing",
    /**
     * Read-only viewer for a session on an `ondc-mcp` engine.
     *
     * Reached only by a link the engine hands out, so it is deliberately not
     * in the header nav — without an engine there is nothing to show. Its
     * parameters arrive in the URL *fragment*, never the query string.
     */
    MCP_SESSION: "/mcp-session",
    /**
     * Public, read-only live map for one ride.
     *
     * Reached only by the link the provider (BPP) puts in `message.tracking.url`
     * on on_track, so it is deliberately not in the header nav — without a token
     * there is no ride to show. `:token` is `<sessionId>.<transactionId>`, both
     * verbatim; a dot appears in neither id's alphabet.
     */
    TRACK: "/track/:token",
    /** Prefix of {@link ROUTES.TRACK}, for matching without the param. */
    TRACK_PREFIX: "/track/",
    LOGIN: "/login",
    PROFILE: "/profile",
    /** Read-only NP Portal details for ONDC logins. */
    PROFILE_ACCOUNT: "/profile/account",
    PROFILE_PAST_REPORTS: "/profile/past-reports",
    PROFILE_HISTORY: "/profile/history",
    /** Issue, inspect and revoke the user's MCP API key. */
    PROFILE_MCP_KEY: "/profile/mcp-key",
    SELLER_ONBOARDING: "/seller-onboarding",
    PLAYGROUND: "/playground",
    HISTORY: "/history",
    DB_BACK_OFFICE: "/db-back-office",
    ROOT: "/",
    AUTH_HEADER: "/auth-header",
    FRAMEWORK_HEALTH: "/framework-health",
    LIVE_HEALTHCHECK_STATUS: "/live-healthcheck-status",
    SUPPORT: "/support",
    DEVELOPER_GUIDE: "/developer-guide",
    DEVELOPER_GUIDE_GETTING_STARTED: "/developer-guide/getting-started",
    DEVELOPER_GUIDE_GENERAL: "/developer-guide/general",
    DEVELOPER_GUIDE_DOMAINS: "/developer-guide/domains",
    DEVELOPER_GUIDE_AUTH_TOOLS: "/developer-guide/auth-tools",
    SELLER_LOAD_TESTING: "/seller-load-testing",
    /** Business dashboard — analytics over test sessions, participants and reports. */
    BUSINESS: "/business",
    BUSINESS_SESSIONS: "/business/sessions",
    BUSINESS_PARTICIPANTS: "/business/participants",
    BUSINESS_REPORTS: "/business/reports",
    BUSINESS_EXPORT: "/business/export",
    /** Use case flow: domain and version are URL-encoded if needed; useCase is slug e.g. personal_loan */
    DEVELOPER_GUIDE_USE_CASE: "/developer-guide/:domain/:version/:useCase",
    /** General developer doc page, slug matches filename in GitHub docs/developer-docs */
    DEVELOPER_GUIDE_DOC: "/developer-guide/docs/:slug",
    /** Standalone x-validations table for a domain/version (usecase-independent). */
    DEVELOPER_GUIDE_VALIDATIONS: "/validations/developer-guide/:domain/:version",
} as const;

/** Build path for a specific developer guide use case (domain/version passed as-is; useCase as slug). */
export function getDeveloperGuideUseCasePath(
    domain: string,
    version: string,
    useCaseSlug: string
): string {
    const enc = encodeURIComponent;
    return `/developer-guide/${enc(domain)}/${enc(version)}/${enc(useCaseSlug)}`;
}

export function getDeveloperGuideDocPath(slug: string): string {
    return `/developer-guide/docs/${slug}`;
}

export function getDeveloperGuideValidationsPath(domain: string, version: string): string {
    const enc = encodeURIComponent;
    return `/validations/developer-guide/${enc(domain)}/${enc(version)}`;
}

/**
 * Routes that render without the workbench chrome (header/footer).
 *
 * These are pages handed to someone outside the workbench by a link — a rider
 * following a tracking URL is not operating the app, and the nav would only
 * offer them tools they have no use for.
 */
export function isChromelessRoute(pathname: string): boolean {
    return pathname.startsWith(ROUTES.TRACK_PREFIX);
}

/**
 * Type for route paths
 */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
