import {
    FC,
    useCallback,
    useMemo,
    type CSSProperties,
    type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronRightIcon,
    CodeBracketIcon,
    DocumentTextIcon,
    KeyIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";
import { COMMENTS_PANEL_TOGGLE_CLASS } from "../shared/styles";
import { ROUTES, getDeveloperGuideDocPath } from "@constants/routes";
import { buildGeneralDocCommentScope } from "@/types/comment-scope";
import { QuickStepBadge } from "@pages/home/QuickStepBadge";
import {
    GETTING_STARTED_SECTIONS,
    GLOSSARY_TERMS,
    HOW_TO_GUIDES,
    findReferenceUseCase,
} from "../landing/getting-started-sections";
import { useDeveloperGuideShell } from "./DeveloperGuideNav";
import DeveloperGuideGuideCard from "./DeveloperGuideGuideCard";
import CommentsPanel from "../flowActionDetails/CommentsPanel";
import { useDocsSectionSelection } from "../DocsViewer/useDocsSectionSelection";
import { useInlineCommentHeading } from "../shared/hooks/useInlineCommentHeading";
import { getDomainDisplayLabel } from "../domainGrouping";

const GETTING_STARTED_SLUG = "getting-started";

/** Synthetic markdown so section hashes/labels stay in sync with `GETTING_STARTED_SECTIONS`. */
const GETTING_STARTED_SECTION_MARKDOWN = GETTING_STARTED_SECTIONS.map(
    (section) => `## ${section.label}`
).join("\n\n");

interface PathCard {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: ReactNode;
    onClick: () => void;
}

interface ExploreStep {
    id: string;
    number: string;
    title: string;
    description: string;
}

const SectionHeading: FC<{
    sectionId: string;
    label: string;
    onSelect: (id: string) => void;
    headingAction?: ReactNode;
    className?: string;
}> = ({ sectionId, label, onSelect, headingAction, className }) => (
    <h2
        className={cn(
            "group/heading mb-2 flex scroll-mt-24 items-center gap-2 text-xl font-semibold text-brand-normal",
            className
        )}
    >
        <button
            type="button"
            onClick={() => onSelect(sectionId)}
            className="min-w-0 cursor-default text-left text-inherit"
        >
            {label}
        </button>
        {headingAction ? (
            <span
                className="shrink-0 scale-95 opacity-0 transition-all duration-150 group-hover/heading:scale-100 group-hover/heading:opacity-100 group-focus-within/heading:scale-100 group-focus-within/heading:opacity-100 focus-within:scale-100 focus-within:opacity-100 has-data-[state=open]:scale-100 has-data-[state=open]:opacity-100"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                {headingAction}
            </span>
        ) : null}
    </h2>
);

const DeveloperGuideGettingStartedContent: FC = () => {
    const navigate = useNavigate();
    const { builds } = useDeveloperGuideShell();

    const docSlugs = useMemo(() => [GETTING_STARTED_SLUG], []);
    const docsRecord = useMemo(
        () => ({ [GETTING_STARTED_SLUG]: GETTING_STARTED_SECTION_MARKDOWN }),
        []
    );
    const {
        selectedSectionId,
        selectedSectionLabel,
        selectSection,
        rightPanelOpen,
        setRightPanelOpen,
        toc,
        tocOffset,
    } = useDocsSectionSelection({ docSlugs, docs: docsRecord });

    const commentScope = useMemo(() => buildGeneralDocCommentScope(GETTING_STARTED_SLUG), []);
    const { renderHeadingAction, commentsRefreshKey } = useInlineCommentHeading({
        commentScope,
        selectSection,
        setRightPanelOpen,
    });

    const resolveSectionLabel = useCallback(
        (sectionId: string) => toc.find((entry) => entry.id === sectionId)?.text,
        [toc]
    );

    const referenceUseCase = useMemo(() => findReferenceUseCase(builds), [builds]);

    const referencePathHint = referenceUseCase
        ? `Explore by domain → Financial Services → ${getDomainDisplayLabel(referenceUseCase.domainKey)} → ${referenceUseCase.label}`
        : "Explore by domain → Financial Services → Credit (FIS12) → LAMF";

    const commonPaths: PathCard[] = [
        {
            id: "browse-domains",
            title: "Browse by domain",
            subtitle: "API reference",
            description:
                "Explore protocol specs and use-case flows grouped by domain family — Retail, Logistics, Financial Services, and more.",
            icon: <CodeBracketIcon className="size-5 text-brand-normal" aria-hidden />,
            onClick: () => navigate(ROUTES.DEVELOPER_GUIDE_DOMAINS),
        },
        {
            id: "auth-tools",
            title: "Auth Tools",
            subtitle: "Authorization",
            description:
                "Generate and verify ONDC authorization headers using BLAKE2B-512 hashing and Ed25519 signing.",
            icon: <KeyIcon className="size-5 text-brand-normal" aria-hidden />,
            onClick: () => navigate(ROUTES.DEVELOPER_GUIDE_AUTH_TOOLS),
        },
        {
            id: "schema-validation",
            title: "Schema Validation",
            subtitle: "Payloads",
            description:
                "Validate sample request and response payloads against domain schemas before you integrate.",
            icon: <DocumentTextIcon className="size-5 text-brand-normal" aria-hidden />,
            onClick: () => navigate(ROUTES.SCHEMA),
        },
    ];

    const exploreSteps: ExploreStep[] = [
        {
            id: "product-understanding",
            number: "01",
            title: "Read Documents",
            description: "Get domain and use-case context before you dig into protocol calls.",
        },
        {
            id: "browse-flows",
            number: "02",
            title: "Browse Flows",
            description: "Select a flow, then an action, to walk the sequence of protocol calls.",
        },
        {
            id: "inspect-payloads",
            number: "03",
            title: "Inspect payloads and schemas",
            description:
                "Review example payloads, request/response schemas, validations, and key attributes.",
        },
        {
            id: "capture-notes",
            number: "04",
            title: "Capture notes as you go",
            description:
                "Record edge cases, error handling, and partner-specific behavior while reviewing examples.",
        },
    ];

    return (
        <div className="flex min-h-full w-full items-stretch bg-white dark:bg-surface-page">
            <div className="min-w-0 flex-1 w-full">
                <header className="border-n-40 bg-white dark:border-n-60 dark:bg-surface-elevated">
                    <div className="w-full pt-8 px-8">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <h1 className="text-3xl font-bold leading-tight tracking-tight text-n-900 dark:text-n-0 md:text-4xl">
                                Getting <span className="text-brand-normal">Started</span>
                            </h1>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                                title={
                                    rightPanelOpen
                                        ? "Collapse comments panel"
                                        : "Expand comments panel"
                                }
                                aria-label={
                                    rightPanelOpen
                                        ? "Collapse comments panel"
                                        : "Expand comments panel"
                                }
                                className={COMMENTS_PANEL_TOGGLE_CLASS}
                            >
                                <ChevronRightIcon
                                    className={cn(
                                        "size-3 text-slate-700 transition-transform duration-300 ease-in-out",
                                        rightPanelOpen ? "" : "rotate-180"
                                    )}
                                />
                            </Button>
                        </div>

                        <p className="w-full text-body-1 text-n-300 dark:text-n-60">
                            Learn how to explore ONDC protocol flows in the Developer Guide —
                            starting with a reference use case, then moving into payloads, schemas,
                            and tools. Whereas, before that lets's begin with knowing about ONDC.
                        </p>
                    </div>
                </header>

                <div className="min-h-[60vh] w-full space-y-10 p-8">
                    <section id={GETTING_STARTED_SECTIONS[0].id} className="scroll-mt-24">
                        <SectionHeading
                            sectionId={GETTING_STARTED_SECTIONS[0].id}
                            label={GETTING_STARTED_SECTIONS[0].label}
                            onSelect={selectSection}
                            headingAction={renderHeadingAction(GETTING_STARTED_SECTIONS[0].id)}
                        />
                        <p className="w-full text-body-1 leading-relaxed text-n-300 dark:text-n-60">
                            Understanding ONDC involves gaining a clear understanding of the ONDC
                            protocol, its architecture, and the complete transaction lifecycle
                            across buyer, seller, logistics, and financial participants. This
                            includes studying domain-specific APIs, request-response flows, error
                            handling, and network standards to effectively test, validate, and
                            troubleshoot scenarios. A strong understanding of these concepts helps
                            ensure that implementations remain compliant with ONDC specifications
                            while enabling reliable end-to-end testing and automation across
                            different network participants.
                        </p>
                    </section>

                    <section id={GETTING_STARTED_SECTIONS[1].id} className="scroll-mt-24">
                        <p className="w-full text-body-1 leading-relaxed text-n-300 dark:text-n-60">
                            ONDC is an open, interoperable network for digital commerce — it lets
                            buyer and seller apps discover, transact, and fulfill across platforms
                            through a shared protocol, without locking either side into a single
                            app.
                        </p>
                        <Button
                            type="button"
                            className="mt-4"
                            onClick={() => navigate(getDeveloperGuideDocPath("about-ondc"))}
                        >
                            Know more
                        </Button>
                        <p className="mt-4 w-full text-body-1 leading-relaxed text-n-300 dark:text-n-60">
                            To start with ONDC, the sections below will guide you through how a
                            developer finds the information they need — and walk you through how
                            things work, step by step.
                        </p>
                    </section>

                    <section id={GETTING_STARTED_SECTIONS[2].id} className="scroll-mt-24">
                        <SectionHeading
                            sectionId={GETTING_STARTED_SECTIONS[2].id}
                            label={GETTING_STARTED_SECTIONS[2].label}
                            onSelect={selectSection}
                            headingAction={renderHeadingAction(GETTING_STARTED_SECTIONS[2].id)}
                        />
                        <p className="w-full text-body-1 leading-relaxed text-n-300 dark:text-n-60">
                            Open any use case as your reference use case from the sidebar under{" "}
                            <strong className="font-semibold text-n-900 dark:text-n-0">
                                Explore by domain
                            </strong>
                            . For example{" "}
                            <strong className="font-semibold text-n-900 dark:text-n-0">
                                {referencePathHint}
                            </strong>
                            . To understand it completely after the use case, walk through the
                            sections of Documents, Flows, and Error Codes. The same way, you can
                            explore for every other domain. Please check the Explore by domain
                            section from the sidebar to get the list of all the usecases.
                        </p>
                        <Button
                            type="button"
                            className="mt-4"
                            onClick={() => navigate(ROUTES.DEVELOPER_GUIDE_DOMAINS)}
                        >
                            Open API References By Domains
                        </Button>
                    </section>

                    <section id={GETTING_STARTED_SECTIONS[3].id} className="scroll-mt-24">
                        <SectionHeading
                            sectionId={GETTING_STARTED_SECTIONS[3].id}
                            label={GETTING_STARTED_SECTIONS[3].label}
                            onSelect={selectSection}
                            headingAction={renderHeadingAction(GETTING_STARTED_SECTIONS[3].id)}
                        />
                        <p className="mb-5 w-full text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                            Jump to the path that matches what you need right now.
                        </p>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                            {commonPaths.map((card) => (
                                <DeveloperGuideGuideCard
                                    key={card.id}
                                    title={card.title}
                                    subtitle={card.subtitle}
                                    description={card.description}
                                    icon={card.icon}
                                    onClick={card.onClick}
                                />
                            ))}
                        </div>
                    </section>

                    <section id={GETTING_STARTED_SECTIONS[4].id} className="scroll-mt-24">
                        <SectionHeading
                            sectionId={GETTING_STARTED_SECTIONS[4].id}
                            label={GETTING_STARTED_SECTIONS[4].label}
                            onSelect={selectSection}
                            headingAction={renderHeadingAction(GETTING_STARTED_SECTIONS[4].id)}
                        />
                        <p className="mb-5 w-full text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                            Once a use case is open, work through it in this order.
                        </p>
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
                            {exploreSteps.map((step) => (
                                <div key={step.id} className="flex items-start gap-3">
                                    <QuickStepBadge number={step.number} />
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <h3 className="text-body-1 font-semibold text-n-800 dark:text-n-0">
                                            {step.title}
                                        </h3>
                                        <p className="mt-1 text-body-2 text-n-300 dark:text-n-60">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id={GETTING_STARTED_SECTIONS[5].id} className="scroll-mt-24">
                        <SectionHeading
                            sectionId={GETTING_STARTED_SECTIONS[5].id}
                            label={GETTING_STARTED_SECTIONS[5].label}
                            onSelect={selectSection}
                            headingAction={renderHeadingAction(GETTING_STARTED_SECTIONS[5].id)}
                        />
                        <p className="mb-5 w-full text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                            Short walkthroughs of how different screens and flows work in the
                            Workbench.
                        </p>
                        <div className="space-y-6">
                            {HOW_TO_GUIDES.map((guide) => (
                                <div
                                    key={guide.id}
                                    className="overflow-hidden rounded-2xl border border-n-40 dark:border-n-60"
                                >
                                    <div className="border-b border-n-40 px-5 py-4 dark:border-n-60">
                                        <p className="mb-1 text-base font-semibold text-n-900 dark:text-n-0">
                                            {guide.title}
                                        </p>
                                        <p className="mb-0 text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                                            {guide.description}
                                        </p>
                                    </div>
                                    <div className="aspect-video bg-n-20 dark:bg-surface-muted">
                                        <iframe
                                            title={`${guide.title} walkthrough`}
                                            src={guide.videoUrl}
                                            className="size-full border-0"
                                            allow="autoplay"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id={GETTING_STARTED_SECTIONS[6].id} className="scroll-mt-24">
                        <SectionHeading
                            sectionId={GETTING_STARTED_SECTIONS[6].id}
                            label={GETTING_STARTED_SECTIONS[6].label}
                            onSelect={selectSection}
                            headingAction={renderHeadingAction(GETTING_STARTED_SECTIONS[6].id)}
                        />
                        <p className="mb-5 w-full text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                            Plain-language definitions for protocol and domain terms you will see in
                            the guide — including labels like Credit (FIS12) that are not everyday
                            language.
                        </p>
                        <dl className="divide-y divide-n-40 rounded-2xl border border-n-40 dark:divide-n-60 dark:border-n-60">
                            {GLOSSARY_TERMS.map((entry) => (
                                <div key={entry.id} className="px-5 py-4">
                                    <dt className="mb-1 text-base font-semibold text-n-900 dark:text-n-0">
                                        {entry.term}
                                    </dt>
                                    <dd className="mb-0 text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                                        {entry.definition}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                </div>
            </div>

            <div
                className={cn(
                    "sticky shrink-0 self-start overflow-hidden transition-[max-width,margin-right,opacity] duration-300 ease-in-out",
                    rightPanelOpen
                        ? "mr-4 mt-4 mb-4 max-w-80 opacity-100"
                        : "mr-0 max-w-0 opacity-0 pointer-events-none"
                )}
                style={
                    {
                        top: tocOffset,
                        height: `calc(100vh - ${tocOffset}px)`,
                    } as unknown as CSSProperties
                }
            >
                <div className="h-full w-80">
                    <CommentsPanel
                        key={commentsRefreshKey}
                        selectedPath={selectedSectionId}
                        commentScope={commentScope}
                        selectionLabel={selectedSectionLabel}
                        resolvePathLabel={resolveSectionLabel}
                        emptySelectionMessage="Select a section to add comments."
                    />
                </div>
            </div>
        </div>
    );
};

export default DeveloperGuideGettingStartedContent;
