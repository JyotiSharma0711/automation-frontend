import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useParams } from "react-router-dom";
import { useGetGithubDocContentQuery } from "@store/api";
import GithubMarkdown from "@components/GithubMarkdown";
import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";
import { COMMENTS_PANEL_TOGGLE_CLASS } from "../shared/styles";
import {
    stripMarkdownOnThisPage,
    stripMarkdownTableOfContents,
    stripRedundantMarkdownHorizontalRules,
} from "@utils/markdownToc";
import { buildGeneralDocCommentScope } from "@/types/comment-scope";
import {
    docShowsInPageToc,
    docStripsEmbeddedToc,
    docUsesSidebarSections,
} from "./docsWithSidebarSections";
import CommentsPanel from "../flowActionDetails/CommentsPanel";
import { useDocsSectionSelection } from "../DocsViewer/useDocsSectionSelection";
import GuideContentSkeleton from "../shared/components/GuideContentSkeleton";
import { useInlineCommentHeading } from "../shared/hooks/useInlineCommentHeading";
import {
    PinnedPageIndex,
    PageIndexList,
    buildSectionIndexGroups,
} from "../shared/components/PinnedPageIndex";

const DeveloperGuideDocContent: FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const showsInPageToc = docShowsInPageToc(slug);
    const stripsEmbeddedToc = docStripsEmbeddedToc(slug);
    const usesSidebarSections = docUsesSidebarSections(slug);

    const {
        data: content = "",
        isLoading,
        isError,
    } = useGetGithubDocContentQuery(slug ?? "", { skip: !slug });

    const docSlugs = useMemo(() => (slug ? [slug] : []), [slug]);
    const docsRecord = useMemo(() => (slug ? { [slug]: content } : {}), [slug, content]);
    const {
        selectedSectionId,
        selectedSectionLabel,
        selectSection,
        rightPanelOpen,
        setRightPanelOpen,
        toc,
        tocOffset,
    } = useDocsSectionSelection({ docSlugs, docs: docsRecord });

    const indexGroups = useMemo(
        () => (slug && content ? buildSectionIndexGroups(docsRecord, docSlugs) : []),
        [docsRecord, docSlugs, slug, content]
    );

    const contentRef = useRef<HTMLDivElement>(null);
    const [scrolledActiveId, setScrolledActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (!content) return;
        const headings = Array.from(document.querySelectorAll<HTMLElement>("h2[id], h3[id]"));
        if (headings.length === 0) return;

        const onScroll = () => {
            const scrollPos = window.scrollY + tocOffset + 40;
            let currentId: string | null = null;
            for (const h of headings) {
                if (h.offsetTop <= scrollPos) {
                    currentId = h.id;
                } else {
                    break;
                }
            }
            if (currentId) setScrolledActiveId(currentId);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, [content, tocOffset]);

    const activeSectionId = selectedSectionId ?? scrolledActiveId ?? "";

    const resolveSectionLabel = useCallback(
        (sectionId: string) => toc.find((entry) => entry.id === sectionId)?.text,
        [toc]
    );

    const commentScope = useMemo(
        () => (slug ? buildGeneralDocCommentScope(slug) : undefined),
        [slug]
    );
    const { renderHeadingAction, commentsRefreshKey } = useInlineCommentHeading({
        commentScope,
        selectSection,
        setRightPanelOpen,
    });

    // GitHub md often uses `# Title` / `## Section` + `---` — strip heading-adjacent
    // rules so they don't leave empty vertical gaps under titles.
    const displayContent = useMemo(() => {
        const withoutToc = stripsEmbeddedToc
            ? stripMarkdownOnThisPage(stripMarkdownTableOfContents(content))
            : content;
        return stripRedundantMarkdownHorizontalRules(withoutToc);
    }, [content, stripsEmbeddedToc]);

    if (isLoading) {
        return <GuideContentSkeleton />;
    }

    if (isError) {
        return (
            <div className="p-4 py-16 text-center">
                <p className="text-slate-500 text-sm">
                    Failed to load documentation. Refresh the page to try again.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex gap-6 items-stretch min-h-[60vh]">
                <div ref={contentRef} className="flex-1 min-w-0 relative">
                    {commentScope && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setRightPanelOpen(!rightPanelOpen)}
                            title={
                                rightPanelOpen ? "Collapse comments panel" : "Expand comments panel"
                            }
                            aria-label={
                                rightPanelOpen ? "Collapse comments panel" : "Expand comments panel"
                            }
                            className={cn(
                                COMMENTS_PANEL_TOGGLE_CLASS,
                                "absolute top-0 right-0 z-10"
                            )}
                        >
                            <ChevronRightIcon
                                className={cn(
                                    "w-3 h-3 text-slate-400 transition-transform duration-300 ease-in-out",
                                    rightPanelOpen ? "" : "rotate-180"
                                )}
                            />
                        </Button>
                    )}
                    {/* Doc-route only: GitHub md uses --- dividers that stack with heading border-b. */}
                    <div
                        className={[
                            "max-w-none",
                            usesSidebarSections
                                ? [
                                      // FAQ docs: no divider lines — use vertical rhythm instead (Stripe-style)
                                      "[&_h1]:border-b-0!",
                                      "[&_h1]:pb-0!",
                                      "[&_h1]:mb-6!",
                                      "[&_h2]:mt-12!",
                                      "[&_h2:first-of-type]:mt-0!",
                                      "[&_h2]:border-b-0!",
                                      "[&_h2]:pb-0!",
                                      "[&_h2]:mb-3!",
                                      "[&_h3]:mt-10!",
                                      "[&_h2+_h3]:mt-5!",
                                      "[&_h3]:mb-3!",
                                      "[&_h3+_p]:mt-0!",
                                      "[&_pre]:my-4!",
                                  ].join(" ")
                                : [
                                      // Avoid double rule under title (h1 border-b + following ---)
                                      "[&_h1:has(+hr)]:border-b-0!",
                                      "[&_h1:has(+hr)]:pb-0!",
                                      // Equalize space above/below ## titles between --- and border-b
                                      "[&_hr:has(+h2)]:mt-8!",
                                      "[&_hr:has(+h2)]:mb-0!",
                                      "[&_hr+h2]:mt-0!",
                                      "[&_hr+h2]:pt-3!",
                                      "[&_hr+h2]:pb-3!",
                                  ].join(" "),
                        ].join(" ")}
                    >
                        <GithubMarkdown
                            content={displayContent}
                            onSectionClick={selectSection}
                            renderHeadingAction={renderHeadingAction}
                        />
                    </div>
                </div>

                {showsInPageToc && indexGroups.length > 0 && (
                    <div className="shrink-0 self-start">
                        <PinnedPageIndex
                            topOffset={tocOffset}
                            boundaryRef={contentRef}
                            className="hidden lg:block w-64"
                        >
                            <PageIndexList
                                groups={indexGroups}
                                activeId={activeSectionId}
                                onItemClick={selectSection}
                            />
                        </PinnedPageIndex>
                    </div>
                )}

                {commentScope && (
                    <div
                        className={cn(
                            "shrink-0 self-start sticky overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out",
                            rightPanelOpen
                                ? "max-w-80 opacity-100"
                                : "max-w-0 opacity-0 pointer-events-none"
                        )}
                        style={
                            {
                                top: tocOffset,
                                height: `calc(100vh - ${tocOffset}px)`,
                            } as unknown as CSSProperties
                        }
                    >
                        <div className="w-80 h-full">
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
                )}
            </div>
        </div>
    );
};

export default DeveloperGuideDocContent;
