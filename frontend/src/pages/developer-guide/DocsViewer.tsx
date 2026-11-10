import { type FC, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import GithubMarkdown from "@components/GithubMarkdown";
import { cn } from "@/lib/utils";
import { COMMENTS_PANEL_TOGGLE_CLASS } from "./shared/styles";
import { Button } from "@components/Shadcn/Button";
import { stripRedundantMarkdownHorizontalRules } from "@utils/markdownToc";
import GuideTabs from "./shared/components/GuideTabs";
import GuideTabFade from "./shared/components/GuideTabFade";
import CommentsPanel from "./flowActionDetails/CommentsPanel";
import { useDocsSectionSelection } from "./DocsViewer/useDocsSectionSelection";
import {
    PinnedPageIndex,
    PageIndexList,
    buildSectionIndexGroups,
} from "./shared/components/PinnedPageIndex";
import { buildApiCallLinkMap, normalizeApiToken } from "./DocsViewer/apiCallLinks";
import type { FlowEntry } from "./types";
import { buildDocumentCommentScope } from "./DocsViewer/utils";
import { useInlineCommentHeading } from "./shared/hooks/useInlineCommentHeading";
import {
    isAdditionalResourcesSlug,
    isChangelogSlug,
    isSequenceDiagramDocSlug,
} from "./content/resolveUseCaseDocs";

interface DocsViewerProps {
    docs: Record<string, string>;
    useCaseId: string;
    domain: string;
    version: string;
    /** When provided, inline-code API mentions (e.g. `/search`) link to the matching
     * call in the API Walkthrough. */
    flows?: FlowEntry[];
}

function formatSlug(slug: string): string {
    return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const DocsViewer: FC<DocsViewerProps> = ({ docs, useCaseId, domain, version, flows }) => {
    const filteredDocs = useMemo(() => {
        if (!docs) return {};

        const contentEntries = Object.entries(docs).filter(([key]) => {
            const normalized = key.toLowerCase().replace(/[-_]/g, " ").trim();
            return (
                normalized !== "release notes" &&
                normalized !== "references" &&
                normalized !== "refrences" &&
                normalized !== "figma" &&
                !isAdditionalResourcesSlug(key) &&
                !isChangelogSlug(key) &&
                !isSequenceDiagramDocSlug(key)
            );
        });

        if (contentEntries.length <= 1) {
            return Object.fromEntries(contentEntries);
        }

        const cleanStr = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
        const activeKey = cleanStr(useCaseId || "");

        const matchingEntries = contentEntries.filter(([key]) => {
            const docKeyClean = cleanStr(key);
            if (
                docKeyClean === activeKey ||
                docKeyClean === `${activeKey}s` ||
                activeKey === `${docKeyClean}s`
            ) {
                return true;
            }
            const docWords = key.toLowerCase().split(/[-_\s]+/);
            const useCaseWords = (useCaseId || "").toLowerCase().split(/[-_\s]+/);
            const firstUseCaseWord = useCaseWords[0];
            if (firstUseCaseWord && firstUseCaseWord.length > 2) {
                return docWords.includes(firstUseCaseWord);
            }
            return false;
        });

        if (matchingEntries.length > 0) {
            return Object.fromEntries(matchingEntries);
        }

        return Object.fromEntries(contentEntries);
    }, [docs, useCaseId]);

    const slugs = useMemo(() => Object.keys(filteredDocs), [filteredDocs]);

    const {
        activeDocSlug,
        setActiveDocSlug,
        selectedSectionId,
        selectedSectionLabel,
        selectSection,
        selectDocSection,
        rightPanelOpen,
        setRightPanelOpen,
        toc,
        tocOffset,
    } = useDocsSectionSelection({
        docSlugs: slugs,
        docs: filteredDocs,
    });

    const indexGroups = useMemo(
        () => buildSectionIndexGroups(filteredDocs, slugs),
        [filteredDocs, slugs]
    );
    const contentRef = useRef<HTMLDivElement>(null);

    const handleIndexItemClick = useCallback(
        (id: string) => {
            const owningGroup = indexGroups.find(
                (group) => group.id === id || group.items.some((item) => item.id === id)
            );
            if (owningGroup && owningGroup.slug !== activeDocSlug) {
                selectDocSection(owningGroup.slug, id);
            } else {
                selectSection(id);
            }
        },
        [indexGroups, activeDocSlug, selectDocSection, selectSection]
    );

    const resolveSectionLabel = useCallback(
        (sectionId: string) => toc.find((entry) => entry.id === sectionId)?.text,
        [toc]
    );

    const content = filteredDocs[activeDocSlug] ?? "";
    // Domain docs often use `# Section` + `---` — strip those so they don't leave
    // uneven empty gaps under titles.
    const displayContent = useMemo(() => stripRedundantMarkdownHorizontalRules(content), [content]);
    const commentScope = useMemo(
        () =>
            useCaseId && activeDocSlug && domain && version
                ? buildDocumentCommentScope(domain, version, useCaseId, activeDocSlug)
                : undefined,
        [useCaseId, activeDocSlug, domain, version]
    );

    const [, setSearchParams] = useSearchParams();
    const apiLinkMap = useMemo(() => (flows?.length ? buildApiCallLinkMap(flows) : null), [flows]);
    const resolveInlineCodeLink = useCallback(
        (code: string) => {
            if (!apiLinkMap) return null;
            const token = normalizeApiToken(code);
            const target = token ? apiLinkMap.get(token) : undefined;
            if (!target) return null;
            return () => {
                // Drop the docs section anchor before leaving, same as handleViewChange.
                if (window.location.hash) {
                    window.history.replaceState(
                        null,
                        "",
                        `${window.location.pathname}${window.location.search}`
                    );
                }
                setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("view", "flows");
                    next.set("flow", target.flowId);
                    next.set("action", target.actionId);
                    // Params owned by the docs view.
                    next.delete("doc");
                    next.delete("attr");
                    next.delete("panel");
                    return next;
                });
            };
        },
        [apiLinkMap, setSearchParams]
    );

    const { renderHeadingAction, commentsRefreshKey } = useInlineCommentHeading({
        commentScope,
        selectSection,
        setRightPanelOpen,
    });

    if (slugs.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
                <p className="text-sm text-slate-400">No documentation available.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {slugs.length > 1 && (
                <GuideTabs
                    active={activeDocSlug}
                    onChange={setActiveDocSlug}
                    tabs={slugs.map((slug) => ({ id: slug, label: formatSlug(slug) }))}
                />
            )}

            <div className="flex items-stretch min-h-[60vh]">
                <div
                    ref={contentRef}
                    className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden border border-slate-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-elevated relative"
                >
                    <Button
                        variant="ghost"
                        onClick={() => setRightPanelOpen(!rightPanelOpen)}
                        title={rightPanelOpen ? "Collapse comments panel" : "Expand comments panel"}
                        aria-label={
                            rightPanelOpen ? "Collapse comments panel" : "Expand comments panel"
                        }
                        className={cn(COMMENTS_PANEL_TOGGLE_CLASS, "absolute top-5 right-3 z-10")}
                    >
                        <ChevronRightIcon
                            className={cn(
                                "w-3 h-3 text-slate-400 transition-transform duration-300 ease-in-out motion-reduce:transition-none",
                                rightPanelOpen ? "" : "rotate-180"
                            )}
                        />
                    </Button>

                    <div className="flex flex-1 min-h-0 overflow-hidden">
                        {/*
                          Domains like LAMF use `# Title` + `---` + `# 1. Overview` (both h1).
                          Stripping heading-adjacent --- leaves h1+h1; space them so Overview
                          isn't glued to the title rule. Scoped to DocsViewer only.
                        */}
                        <GuideTabFade
                            activeKey={activeDocSlug}
                            tabOrder={slugs}
                            className={cn(
                                "flex-1 min-w-0 overflow-auto p-4",
                                "[&_h1+h1]:mt-2"
                                // "[&_h1+h2]:mt-8",
                                // "[&_h2+h2]:mt-8"
                            )}
                        >
                            <GithubMarkdown
                                content={displayContent}
                                onSectionClick={selectSection}
                                renderHeadingAction={renderHeadingAction}
                                resolveInlineCodeLink={resolveInlineCodeLink}
                            />
                        </GuideTabFade>
                    </div>
                </div>

                {indexGroups.length > 0 && (
                    <div className="ml-4 shrink-0 self-start">
                        <PinnedPageIndex
                            topOffset={tocOffset}
                            boundaryRef={contentRef}
                            className="hidden lg:block w-64"
                        >
                            <PageIndexList
                                groups={indexGroups}
                                activeId={selectedSectionId ?? ""}
                                onItemClick={handleIndexItemClick}
                            />
                        </PinnedPageIndex>
                    </div>
                )}

                {/* Stretch with the content card — sticky+top is wrong here because GuideTabFade's overflow-hidden becomes the sticky containing block and offsets the panel downward. */}
                <div
                    className={cn(
                        "shrink-0 overflow-hidden transition-[max-width,margin-left,opacity] duration-300 ease-in-out",
                        rightPanelOpen
                            ? "max-w-80 ml-4 opacity-100"
                            : "max-w-0 ml-0 opacity-0 pointer-events-none"
                    )}
                >
                    <div className="w-80 h-full">
                        {commentScope && (
                            <CommentsPanel
                                key={commentsRefreshKey}
                                selectedPath={selectedSectionId}
                                commentScope={commentScope}
                                selectionLabel={selectedSectionLabel}
                                resolvePathLabel={resolveSectionLabel}
                                emptySelectionMessage="Select a section to add comments."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocsViewer;
