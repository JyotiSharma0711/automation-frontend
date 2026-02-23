import { PlaygroundActionStep } from "@ondc/automation-mock-runner";

export const ONDC_ACTION_LIST = [
    "search",
    "select",
    "init",
    "confirm",
    "status",
    "track",
    "cancel",
    "update",
    "on_search",
    "on_select",
    "on_init",
    "on_confirm",
    "on_status",
    "on_track",
    "on_cancel",
    "on_update",
    "issue",
    "on_issue",
    "issue_close",
    "on_issue_close",
] as const;

export const ONDC_FORM_LIST = ["dynamic_form", "html_form (not-implemented-yet"];

export type PlaygroundLeftTabType = "generator" | "default" | "inputs" | "requirements";
export type PlaygroundRightTabType =
    | "session"
    | "transaction"
    | "terminal"
    | "output_payload"
    | "common_lib";

export type MockPropertyTab = {
    id: string;
    label: string;
    language: "javascript" | "json" | "html";
    property: keyof PlaygroundActionStep["mock"];
};

export const PLAYGROUND_LEFT_TABS: MockPropertyTab[] = [
    {
        id: "generate",
        label: "generator.js",
        language: "javascript",
        property: "generate",
    },
    {
        id: "validate",
        label: "validator.js",
        language: "javascript",
        property: "validate",
    },
    {
        id: "requirements",
        label: "requirements.js",
        language: "javascript",
        property: "requirements",
    },
    {
        id: "defaultPayload",
        label: "defaultPayload.json",
        language: "json",
        property: "defaultPayload",
    },
    {
        id: "inputs",
        label: "inputs.json",
        language: "json",
        property: "inputs",
    },
];

export const PLAYGROUND_LEFT_TABS_FORM: MockPropertyTab[] = [
    {
        id: "form_html",
        label: "form.html",
        language: "html",
        property: "formHtml",
    },
];

export type PlaygroundRightTab = {
    id: PlaygroundRightTabType;
    label: string;
};

export const PLAYGROUND_RIGHT_TABS: PlaygroundRightTab[] = [
    {
        id: "session",
        label: "Live Session Data",
    },
    {
        id: "transaction",
        label: "Session Manager",
    },
    {
        id: "common_lib",
        label: "Common",
    },
    {
        id: "output_payload",
        label: "Output Payload",
    },
    {
        id: "terminal",
        label: "Terminal",
    },
];
