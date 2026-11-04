import type { IAccordionStep } from "@components/Shadcn/Accordion/types";
import { INewSessionFormValues } from "@pages/scenario/types";

const workbenchBaseUrl = import.meta.env.VITE_BASE_URL;

/** Step definitions for the Scenario Testing guide accordion */
export const SCENARIO_GUIDE_STEPS: IAccordionStep[] = [
    {
        key: "1",
        label: "1. Enter Subscriber URL:",
        description: "Enter the correct Subscriber URL where you will receive requests.",
    },
    {
        key: "2",
        label: "2. Select Domain:",
        description:
            "Select the domain for which you want to test. For example: to test Retail F&B, select F&B (ONDC:RET11).",
    },
    {
        key: "3",
        label: "3. Select Version:",
        description:
            "Based on the domain selected, available versions will be displayed. Select the version you want to test. For example: for F&B (ONDC:RET11), version 1.2.5 is available.",
    },
    {
        key: "4",
        label: "4. Select Usecase:",
        description:
            "Based on domain and version, a list of use cases is shown. For example: for F&B (ONDC:RET11) version 1.2.5, F&B is displayed.",
    },
    {
        key: "5",
        label: "5. Select Your Role:",
        description: `Select BAP if you are testing as a Buyer NP, or BPP if you are testing as a Seller NP. If you are a Buyer NP, Workbench acts as Seller NP and you receive requests at ${workbenchBaseUrl}/<domain>/<version>/seller (e.g. ${workbenchBaseUrl}/ONDC:RET11/1.2.5/seller). If you are a Seller NP, Workbench acts as Buyer NP and you receive requests at ${workbenchBaseUrl}/<domain>/<version>/buyer.`,
    },
    {
        key: "6",
        label: "6. Select Environment:",
        description:
            "Select the environment for which you want to test: STAGING or PRE-PRODUCTION. After filling the form, click Submit to open the session page.",
    },
    {
        key: "7",
        label: "7. Generate Report:",
        description:
            "After completing your test flows, click the Generate Report button (top-right of the session page) to compile a compliance report for the current session. The button is available only after at least one flow has been executed.",
    },
    {
        key: "8",
        label: "8. View Report:",
        description:
            "Once the report is generated, click View Report to open the full report. It includes session metadata, flow-wise execution summary with pass/fail status, request and response payloads, and validation errors with attribute-level compliance details.",
    },
    {
        key: "9",
        label: "9. Download / Share Report:",
        description:
            "Download the report by clicking the download button in the top-right corner of the session page.",
    },
];

export const DEFAULT_VALUES: INewSessionFormValues = {
    subscriberUrl: "",
    domain: "",
    version: "",
    usecaseId: "",
    npType: "BAP",
    env: "PRE-PRODUCTION",
    orgId: "",
    config: "",
};

/** Friendly labels for the Scenario Testing "Select Domain" field, keyed by the raw domain key the API returns. */
export const SCENARIO_DOMAIN_LABELS: Record<string, string> = {
    "nic2004:60232": "Logistics 1.2.0 (nic2004:60232)",
    "ONDC:LOG10": "Logistics 1.2.5 P2P (LOG10)",
    "ONDC:LOG11": "Logistics 1.2.5 P2H2P (LOG11)",
    "ONDC:TRV10": "Ride hailing (TRV10)",
    "ONDC:TRV11": "Unreserved travel ticketing (TRV11)",
    "ONDC:TRV12": "Reserved travel ticketing (TRV12)",
    "ONDC:TRV13": "Accommodation Hotel booking (TRV13)",
    "ONDC:TRV14": "Unreserved entry pass / Experiences (TRV14)",
    "ONDC:RET10": "Grocery (RET10)",
    "ONDC:RET11": "F&B (RET11)",
    "ONDC:RET12": "Fashion (RET12)",
    "ONDC:RET13": "BPC (RET13)",
    "ONDC:RET14": "Electronics (RET14)",
    "ONDC:RET15": "Appliances (RET15)",
    "ONDC:RET16": "Home & Kitchen (RET16)",
    "ONDC:RET18": "Health & Wellness (RET18)",
    "ONDC:RETeB2B": "eB2B (DigiDukaan) (RETeB2B)",
    "ONDC:RETINVL": "Inventory Less (RETINVL)",
    "ONDC:FIS10": "Gift Cards (FIS10)",
    "ONDC:FIS11": "Metro Card Recharge (FIS11)",
    "ONDC:FIS12": "Credit (FIS12)",
    "ONDC:FIS12:BL": "Business Loan (FIS12:BL)",
    "ONDC:FIS12:PF": "Solar Purchase Finance (FIS12:PF)",
    "ONDC:FIS12:SL": "Loan Against Mutual Funds (FIS12:SL)",
    "ONDC:FIS13": "Insurance (FIS13)",
    "ONDC:FIS14": "Investment (FIS14)",
};

/** Label for the Scenario Testing domain select; falls back to the raw key for any domain not in the map. */
export const getScenarioDomainLabel = (domainKey: string): string =>
    SCENARIO_DOMAIN_LABELS[domainKey] ?? domainKey;

export const LS_KEY = "flowTestingSessions";
export const SESSIONS_PER_PAGE = 4;

export const SCENARIO_TIP_BANNER_MESSAGE =
    "Allow pop-ups for this site in your browser settings, they are blocked by default and required for the new tabs to open.";
