import { ROUTES, getDeveloperGuideDocPath } from "@constants/routes";
import { IQuickStep, IPathCard, ISupportCard, ISupportInfoItem } from "@pages/home/types";
import { IStatLayoutProps } from "@components/StatLayout/types";
import GitHubIcon from "@assets/svgs/GitHubIcon";
import LiveStatusIcon from "@assets/svgs/LiveStatusIcon";
import SmartPhoneGraphIcon from "@assets/svgs/SmartPhoneGraphIcon";
import { isDevGuideEnabled } from "@/types/environment";

const allQuickSteps: IQuickStep[] = [
    {
        number: "01",
        title: "Read the Guide",
        subtitle: "Understand ONDC flows",
        href: ROUTES.DEVELOPER_GUIDE,
    },
    {
        number: "02",
        title: "Validate Schemas",
        subtitle: "Per-payload checks",
        href: ROUTES.SCHEMA,
    },
    {
        number: "03",
        title: "Run Scenarios",
        subtitle: "End-to-end testing",
        href: ROUTES.SCENARIO,
    },
    {
        number: "04",
        title: "Go Live",
        subtitle: "Production ready",
        href: "https://portal.ondc.org/",
        external: true,
    },
];

export const quickSteps: IQuickStep[] = isDevGuideEnabled
    ? allQuickSteps
    : allQuickSteps
          .filter((step) => step.href !== ROUTES.DEVELOPER_GUIDE)
          .map((step, index) => ({
              ...step,
              number: String(index + 1).padStart(2, "0"),
          }));

const learnPathCard: IPathCard = {
    label: "// 01 · LEARN",
    title: "New to ONDC?",
    subtitle: "Start with the fundamentals.",
    description:
        "Understand the ONDC protocol, the buyer-app/seller-app model, transaction lifecycle, and the role of network participants.",
    links: [
        { label: "What is ONDC?", href: getDeveloperGuideDocPath("about-ondc") },
        {
            label: "Components of a transaction",
            href: ROUTES.DEVELOPER_GUIDE_GENERAL,
        },
        { label: "Buyer apps vs seller apps", href: ROUTES.DEVELOPER_GUIDE_GENERAL },
        {
            label: "Network participant glossary",
            href: ROUTES.DEVELOPER_GUIDE_GENERAL,
        },
    ],
};

const buildPathCard: IPathCard = {
    label: "// 02 · BUILD",
    title: "Ready to integrate?",
    subtitle: "Step-by-step from setup to pre-production.",
    description:
        "Configure your environment, pick your domain, validate every payload, and simulate full transaction flows before you ship.",
    links: [
        { label: "Set up your environment", href: ROUTES.DEVELOPER_GUIDE_GETTING_STARTED },
        { label: "Choose a domain", href: ROUTES.DEVELOPER_GUIDE_DOMAINS },
        { label: "Run your first scenario", href: ROUTES.SCENARIO },
        {
            label: "View past session reports",
            href: ROUTES.PROFILE_HISTORY,
            requiresAuth: true,
        },
    ],
};

const shipPathCard: IPathCard = {
    label: "// 03 · SHIP",
    title: "Need support?",
    subtitle: "We're here to unblock you.",
    description:
        "Tap into the community, raise issues, browse known limitations, or get on a call with the integration team for critical bugs.",
    links: [
        {
            label: "GitHub community",
            href: "https://github.com/ONDC-Official",
            external: true,
        },
        {
            label: "Raise an issue",
            href: "https://github.com/ONDC-Official/automation-framework/issues",
            external: true,
        },
        // Discuss with ashish sir do we really need to remove this link?
        { label: "Read the FAQ", href: getDeveloperGuideDocPath("ondc-FAQs") },
        {
            label: "Contact integration team",
            href: "mailto:team@ondc.org",
            external: true,
        },
    ],
};

function isDeveloperGuideHref(href: string): boolean {
    return (
        href === ROUTES.DEVELOPER_GUIDE ||
        href.startsWith(`${ROUTES.DEVELOPER_GUIDE}/`) ||
        href.startsWith("/validations/developer-guide/")
    );
}

function withoutDeveloperGuideLinks(card: IPathCard): IPathCard {
    return {
        ...card,
        links: card.links.filter((link) => !isDeveloperGuideHref(link.href)),
    };
}

function withPathCardNumber(card: IPathCard, index: number): IPathCard {
    const suffix = card.label.includes("·") ? card.label.split("·").slice(1).join("·").trim() : "";
    return {
        ...card,
        label: suffix
            ? `// ${String(index + 1).padStart(2, "0")} · ${suffix}`
            : `// ${String(index + 1).padStart(2, "0")}`,
    };
}

export const pathCards: IPathCard[] = isDevGuideEnabled
    ? [learnPathCard, buildPathCard, shipPathCard]
    : [withoutDeveloperGuideLinks(buildPathCard), withoutDeveloperGuideLinks(shipPathCard)].map(
          withPathCardNumber
      );

export const usageSectionContent: IStatLayoutProps = {
    label: "// USAGE",
    title: "Trusted by integrators across the network.",
    description: "Live numbers from the ONDC Workbench platform.",
    stats: [
        {
            value: "508+",
            title: "Unique Subscriber IDs",
            subtitle: "across the network",
        },
        {
            value: "28+",
            title: "Categories Tested",
            subtitle: "retail, logistics, fis, trv",
        },
        {
            value: "33,460+",
            title: "Flows Tested",
            subtitle: "end-to-end scenarios",
        },
        {
            value: "11M+",
            title: "Tests Executed",
            subtitle: "since v1.0 launch",
        },
    ],
};
export const supportCards: ISupportCard[] = [
    {
        title: "GitHub Community",
        description:
            "Open-source community, discussions, and feature requests. Built and maintained in the open.",
        linkLabel: "Visit GitHub",
        href: "https://github.com/ONDC-Official",
        Icon: GitHubIcon,
        external: true,
    },
    {
        title: "Issue Tracker",
        description:
            "Raise, track, and resolve issues. Critical issues get prioritised — see live status anytime.",
        linkLabel: "View tickets",
        href: "https://github.com/ONDC-Official/automation-framework/issues",
        Icon: LiveStatusIcon,
        external: true,
    },
    {
        title: "Live Status",
        description:
            "Monitor real-time platform health, scheduled maintenance, and historical uptime.",
        linkLabel: "Check status",
        href: ROUTES.LIVE_HEALTHCHECK_STATUS,
        Icon: SmartPhoneGraphIcon,
    },
];

export const supportInfoItems: ISupportInfoItem[] = [
    {
        label: "SUPPORT HOURS",
        title: "Mon — Fri · 10:00 AM to 6:00 PM IST",
        subtitle: "Weekend support available for planned and critical cases only",
    },
    {
        label: "RESPONSE · NORMAL",
        title: "Within 8 business hours",
        subtitle: "Raise issues via GitHub for the fastest turnaround time.",
    },
    {
        label: "RESPONSE · CRITICAL",
        title: "Within 4 business hours",
        subtitle: "Production blockers and network-wide issues are prioritised.",
    },
];
