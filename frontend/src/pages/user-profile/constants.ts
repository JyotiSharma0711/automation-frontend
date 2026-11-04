import { ROUTES } from "@constants/routes";
import type { IProfileNavItem } from "@pages/user-profile/types";

export const CONFIG_DISPLAY_NAME_MAP: Record<string, string> = {
    "personal-loan": "Personal Loan",
    "Personal Loan": "Personal Loan",
};

export const ENV_OPTIONS = ["PRE-PRODUCTION", "STAGING", "PRODUCTION"];

export const PROFILE_NAV_ITEMS: IProfileNavItem[] = [
    { label: "User profile", to: ROUTES.PROFILE_ACCOUNT },
    { label: "Configs", to: ROUTES.PROFILE, countKey: "configs" },
    { label: "Past reports", to: ROUTES.PROFILE_PAST_REPORTS, countKey: "pastReports" },
    { label: "Activity history", to: ROUTES.PROFILE_HISTORY },
    { label: "MCP API key", to: ROUTES.PROFILE_MCP_KEY },
];

export const PROFILE_PAGE_COPY = {
    account: {
        title: "User profile",
        subtitle: "Your details from NP Portal. They are read-only here.",
        readOnlyNote: "To change these details, update them on NP Portal and log in again.",
        detailsTitle: "Account",
        organisationsTitle: "Organisations",
        noOrganisations: "NP Portal did not send any organisations for this account.",
        githubNote:
            "You logged in with GitHub. Log in via ONDC to see your NP Portal details and organisations.",
    },
    configs: {
        title: "Configs",
        subtitle: "Your account, saved test configs, and report history in one place.",
        formTitle: "Create a new config",
        formDescription: "Fill the details to begin flow testing.",
        listTitle: "Scenario test configs",
    },
    pastReports: {
        title: "Past reports",
        subtitle: "Test runs from your scenario sessions. Mandatory checks decide certification.",
    },
    history: {
        title: "Activity history",
        subtitle:
            "View and manage your previous sessions. Check reports or resume a past session anytime.",
        searchLabel: "Enter subscriber details",
    },
    mcpKey: {
        title: "MCP API key",
        subtitle:
            "Connect your AI assistant to the ONDC Workbench MCP to test your buyer or seller app.",
        cardTitle: "Your API key",
        emptyDescription:
            "You don't have an API key yet. Your AI assistant needs one to use the Workbench MCP.",
        activeDescription:
            "Your AI assistant uses this key to authenticate with the Workbench MCP.",
        generate: "Generate API key",
        regenerate: "Regenerate",
        revoke: "Revoke",
        // Section 3: regenerating kills the previous key immediately, so say so
        // before the user does it rather than after.
        regenerateWarning:
            "Regenerating replaces your current key. The old one stops working immediately, and anything using it will need the new key.",
        expiredMessage: "This key has expired.",
        expiredDescription: "Generate a new one to keep using the Workbench MCP.",
        neverUsed: "Never used",
        revokeTitle: "Revoke your MCP API key?",
        revokeDescription:
            "Anything using this key will stop working immediately. You can generate a new key at any time.",
        revokeConfirm: "Revoke key",
        consentTitle: "ONDC Workbench MCP: Terms and Data Consent",
        // Section 12 of the consent document, verbatim.
        consentCheckbox:
            "I have read and agree to these terms. I will test only endpoints I'm allowed to test, use test data only, and keep my API key secret.",
        consentConfirm: "I agree, generate my API key",
        consentCancel: "Cancel",
        consentStaleMessage: "These terms have been updated.",
        consentStaleDescription:
            "Reload the page to read the current version before generating a key.",
        revealTitle: "Your MCP API key",
        // Drawn from section 3, so the UI and the document agree.
        revealWarning: "Copy this key now. You will not see it again.",
        revealDescription:
            "We store only a hashed copy, so even we can't read it. Keep it secret -- anyone who has it can use the MCP as you. If it leaks, regenerate it.",
        revealDone: "I've saved it",
        generateError: "Could not generate your API key. Please try again.",
        revokeError: "Could not revoke your API key. Please try again.",
        revokeSuccess: "API key revoked.",
    },
} as const;
