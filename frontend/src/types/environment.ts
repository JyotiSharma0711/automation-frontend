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

/** ONDC Portal (sign up / sign in). Defaults to the public portal when the env var is unset. */
export const ondcPortalUrl = import.meta.env.VITE_ONDC_PORTAL_URL || "https://portal.ondc.org";
