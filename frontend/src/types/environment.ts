export enum Environment {
    DEVELOPMENT = "development",
    PRE_PROD = "pre-prod",
    PRODUCTION = "production",
}

export const appEnvironment = import.meta.env.VITE_ENVIRONMENT as Environment;

export const isDev = appEnvironment === Environment.DEVELOPMENT;

/** Developer Guide UI/routes. Defaults to enabled when the env var is unset */
export const isDevGuideEnabled =
    (import.meta.env.VITE_ENABLE_DEV_GUIDE as string | undefined) !== "false";

/** Show every domain in "Explore by Domain" instead of the beta scope (FIS Credit only).
 * Off unless the env var is exactly "true", e.g. to open all domains on the dev environment. */
export const isDevGuideAllDomains =
    (import.meta.env.VITE_DEV_GUIDE_ALL_DOMAINS as string | undefined) === "true";

/** ONDC Portal (sign up / sign in). Defaults to the public portal when the env var is unset. */
export const ondcPortalUrl = import.meta.env.VITE_ONDC_PORTAL_URL || "https://portal.ondc.org";
