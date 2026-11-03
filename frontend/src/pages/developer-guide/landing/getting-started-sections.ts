import type { BuildEntry } from "../types";
import { isUseCaseEnabled } from "../utils";

/** In-page section anchors for Getting Started (Stripe-style hub) */
export const GETTING_STARTED_SECTIONS = [
    { id: "understanding-ondc", label: "Understanding ONDC" },
    { id: "learn-about-ondc", label: "Learn about ONDC" },
    { id: "start-your-ondc-journey", label: "Start your ONDC journey" },
    { id: "start-with-a-use-case", label: "Start with a use case" },
    { id: "common-paths", label: "Common paths" },
    { id: "start-exploring", label: "Start exploring" },
    { id: "how-to", label: "How to" },
    { id: "glossary-of-terms", label: "Glossary of Terms" },
] as const;

/** Domain and protocol terms that need plain-language definitions on Getting Started. */
export const GLOSSARY_TERMS = [
    {
        id: "ondc",
        term: "ONDC",
        definition:
            "Open Network for Digital Commerce — an open, interoperable network that lets buyer and seller apps discover, transact, and fulfill across platforms through a shared protocol.",
    },
    {
        id: "domain",
        term: "Domain",
        definition:
            'A category of commerce on the network, identified by a code. Labels are often written as "Friendly name (CODE)" — for example, Credit (FIS12) means the Credit domain under Financial Services, whose protocol code is FIS12 (full key ONDC:FIS12).',
    },
    {
        id: "domain-family",
        term: "Domain family",
        definition:
            "A group of related domains that share a prefix. Examples: Financial Services (FIS), Retail (RET), Logistics (LOG), Mobility Transit and Tourism (TRV), and Network Services (NTS).",
    },
    {
        id: "use-case",
        term: "Use case",
        definition:
            "A specific product or scenario inside a domain. For example, under Credit (FIS12) you may see use cases such as Personal Loan or Gold Loan — each with its own documents, flows, and error codes.",
    },
    {
        id: "bap",
        term: "BAP",
        definition:
            "Buyer App Platform — the network participant that represents the buyer side. It initiates discovery and transaction requests on the protocol.",
    },
    {
        id: "bpp",
        term: "BPP",
        definition:
            "Provider Platform (seller app) — the network participant that catalogs offerings and responds to BAP requests.",
    },
    {
        id: "flow",
        term: "Flow",
        definition:
            "An ordered sequence of protocol actions that together complete a transaction scenario for a use case (for example, search → select → init → confirm).",
    },
    {
        id: "action",
        term: "Action",
        definition:
            "A single protocol call in a flow — such as search, on_search, select, or confirm — with its own request and response payloads.",
    },
    {
        id: "payload",
        term: "Payload",
        definition:
            "The JSON body of a protocol request or response for an action. Example payloads in the guide show the shape of data exchanged between BAP and BPP.",
    },
    {
        id: "schema",
        term: "Schema",
        definition:
            "The structure and validation rules that a payload must follow for a given domain and action. Schema Validation checks whether a sample payload conforms to those rules.",
    },
    {
        id: "np",
        term: "Network Participant (NP)",
        definition:
            "Any registered entity on the ONDC network — typically a BAP, BPP, or gateway — that can send or receive protocol messages.",
    },
] as const;

/** Walkthrough videos shown under the How to section.
 * Use Google Drive file `/preview` URLs (exported MP4s), not Google Vids
 * project `/edit` links — Vids projects are not iframe-embeddable.
 */
export const HOW_TO_GUIDES = [
    {
        id: "schema-validation",
        title: "Schema Validation",
        description: "See how to validate request and response payloads against domain schemas.",
        videoUrl: "https://drive.google.com/file/d/1Ab74E7vctRJUBk_pn9X82WGuAsTjVm3I/preview",
    },
    {
        id: "scenario-testing",
        title: "Scenario Testing",
        description: "See how to run and walk through end-to-end scenario testing flows.",
        videoUrl: "https://drive.google.com/file/d/1o7RRKjNwLKJ0vwmofA99cQgmkr-6LLTL/preview",
    },
    {
        id: "protocol-playground",
        title: "Protocol Playground",
        description: "See how to explore and experiment with protocol flows in the playground.",
        videoUrl: "https://drive.google.com/file/d/1OdOyDqiqlN46LTNz1AqYVkQcdKPfPRbm/preview",
    },
] as const;

export type GettingStartedSectionId = (typeof GETTING_STARTED_SECTIONS)[number]["id"];

export interface ReferenceUseCase {
    domainKey: string;
    versionKey: string;
    label: string;
}

/** Prefer FIS12 LAMF when present; otherwise the first enabled use case. */
export function findReferenceUseCase(builds: BuildEntry[]): ReferenceUseCase | null {
    const enabled = builds.filter((dom) =>
        (dom.version ?? []).some((ver) =>
            (ver.usecase ?? []).some((uc) => isUseCaseEnabled(dom, uc))
        )
    );

    const fis12 = enabled.find((dom) => /FIS12/i.test(dom.key));
    const preferDomains = fis12 ? [fis12, ...enabled.filter((d) => d !== fis12)] : enabled;

    for (const dom of preferDomains) {
        for (const ver of [...(dom.version ?? [])].reverse()) {
            const usecases = ver.usecase ?? [];
            const lamf = usecases.find((uc) => /lamf/i.test(uc));
            const pick = lamf ?? usecases.find((uc) => isUseCaseEnabled(dom, uc));
            if (pick) {
                return { domainKey: dom.key, versionKey: ver.key, label: pick };
            }
        }
    }

    return null;
}
