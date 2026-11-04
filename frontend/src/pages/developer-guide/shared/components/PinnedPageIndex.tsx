import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type FC,
    type ReactNode,
    type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";
import {
    extractMarkdownToc,
    extractNestedMarkdownToc,
    slugifyHeading,
    stripHeadingNumberPrefix,
} from "@utils/markdownToc";

interface PinPosition {
    left: number;
    width: number;
    naturalTop: number;
    /** Final, already-clamped `top` to render the fixed panel at — computed
     * entirely inside `measure()` from values read at the same instant (scroll
     * position, anchor height, boundary bottom). Deriving this later during
     * render from a *fresh* `window.scrollY` read, paired against a boundary
     * value captured earlier, is what caused the panel to visibly stutter
     * while scrolling — the two would drift out of sync between the state
     * update and the actual paint. */
    top: number;
}

/**
 * Tracks where a right-rail index naturally sits and whether the page has
 * scrolled past that point. Needed because this index always lives inside a
 * `GuideTabFade` (tab-crossfade) ancestor somewhere up the tree — its
 * `overflow-hidden` wrapper silently breaks native `position: sticky` for
 * every descendant (sticky resolves against the nearest `overflow != visible`
 * ancestor, not the window). `PinnedPageIndex` below renders the portal'd
 * `position: fixed` copy once `pinned` is true.
 *
 * `boundaryRef` (optional) is the element whose bottom edge the panel must
 * respect — without it, `position: fixed` has no notion of "end of content"
 * the way native `position: sticky` does, so the panel keeps floating over
 * whatever comes after (e.g. the page footer) once scrolled past it.
 */
export function usePinnedIndexPosition(
    topOffset: number,
    boundaryRef?: RefObject<HTMLElement | null>
) {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [pin, setPin] = useState<PinPosition | null>(null);
    const [pinned, setPinned] = useState(false);

    const measure = () => {
        const el = anchorRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollY = window.scrollY;
        // naturalTop/boundaryBottom are document-relative, so they stay
        // correct across scroll positions even though the source rects are
        // viewport-relative.
        const naturalTop = rect.top + scrollY;
        const boundaryEl = boundaryRef?.current;
        const boundaryBottom = boundaryEl
            ? boundaryEl.getBoundingClientRect().bottom + scrollY
            : null;
        // Clamp so the panel's bottom never crosses the boundary (e.g. the
        // content card's bottom edge) — the same "stop at the end of the
        // containing block" behavior native `position: sticky` gives for
        // free. Computed here (not during render) so every value involved —
        // scrollY, rect.height, boundaryBottom — is read at the same instant.
        const maxTop = boundaryBottom != null ? boundaryBottom - rect.height - scrollY : topOffset;
        const top = Math.min(topOffset, maxTop);
        setPin({ left: rect.left, width: rect.width, naturalTop, top });
        setPinned(scrollY + topOffset >= naturalTop);
    };

    useLayoutEffect(() => {
        measure();
        window.addEventListener("scroll", measure, { passive: true });
        window.addEventListener("resize", measure);
        return () => {
            window.removeEventListener("scroll", measure);
            window.removeEventListener("resize", measure);
        };
    }, []);

    // Scroll/resize alone miss layout shifts with no viewport change — e.g. the
    // left Developer Guide sidebar collapsing/expanding, which reflows this
    // column's left offset mid-animation without firing either event. While
    // pinned (the only state where a stale `left`/`width` is visible, since the
    // portal escapes normal layout), keep re-measuring every frame so the panel
    // tracks the real anchor position instead of snapping to a stale one.
    useEffect(() => {
        if (!pinned) return;
        let frame: number;
        const tick = () => {
            measure();
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [pinned]);

    return { anchorRef, pin, pinned };
}

interface PinnedPageIndexProps {
    topOffset: number;
    /** Column width/placement classes for both the in-flow placeholder and the
     * portal copy (e.g. "hidden lg:block w-64 shrink-0 self-start"). */
    className?: string;
    /** Element whose bottom edge the panel stops at — typically the main
     * content card beside it. Without this, the panel keeps floating past the
     * end of the content (e.g. over the page footer) once scrolled that far. */
    boundaryRef?: RefObject<HTMLElement | null>;
    children: ReactNode;
}

/**
 * Renders `children` (an index/TOC) once in normal flow (reserving the
 * column's layout space) and, once scrolled past its natural position, again
 * via a `document.body` portal with `position: fixed` tracking the anchor's
 * real `left`/`width` — see `usePinnedIndexPosition` for why this replaces
 * `position: sticky` here.
 */
export const PinnedPageIndex: FC<PinnedPageIndexProps> = ({
    topOffset,
    className,
    boundaryRef,
    children,
}) => {
    const { anchorRef, pin, pinned } = usePinnedIndexPosition(topOffset, boundaryRef);

    return (
        <>
            <div ref={anchorRef} className={className}>
                {/* Hidden (not unmounted) once pinned, so the portal copy below is
                    the only one visible — but this still reserves the column's
                    width/space in normal flow. */}
                <div className={pinned ? "invisible" : undefined}>{children}</div>
            </div>

            {pinned &&
                pin &&
                createPortal(
                    <div
                        className={cn("fixed overflow-y-auto", className)}
                        style={{
                            top: pin.top,
                            left: pin.left,
                            width: pin.width,
                            maxHeight: `calc(100vh - ${pin.top}px)`,
                        }}
                    >
                        {children}
                    </div>,
                    document.body
                )}
        </>
    );
};

export interface PageIndexItem {
    id: string;
    label: string;
}

export interface PageIndexGroup {
    /** Section/anchor for the group's own heading (e.g. a doc's slug/title). */
    id: string;
    label: string;
    /** Nested sections shown under the group heading (already capped by the caller). */
    items: PageIndexItem[];
    /** The doc slug this group was built from — lets callers with multiple
     * tabbed docs (e.g. `DocsViewer`) know which doc to switch to before
     * scrolling to one of its items. */
    slug: string;
}

interface PageIndexListProps {
    groups: PageIndexGroup[];
    activeId: string;
    onItemClick: (id: string) => void;
    heading?: string;
}

/** The "On this page" list itself — plain text + links, no card chrome (per
 * request: this index should never look like a boxed panel). */
export const PageIndexList: FC<PageIndexListProps> = ({
    groups,
    activeId,
    onItemClick,
    heading = "On this page",
}) => (
    <>
        <span className="block px-3 pb-2 text-[12px] font-bold text-slate-700 dark:text-n-20 uppercase tracking-widest">
            {heading}
        </span>
        <nav className="space-y-px">
            {groups.map((group) => (
                <div key={group.id}>
                    <PageIndexLink
                        id={group.id}
                        label={group.label}
                        isActive={activeId === group.id}
                        onClick={onItemClick}
                    />
                    {group.items.map((item) => (
                        <PageIndexLink
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            isActive={activeId === item.id}
                            onClick={onItemClick}
                            indent
                        />
                    ))}
                </div>
            ))}
        </nav>
    </>
);

interface PageIndexLinkProps {
    id: string;
    label: string;
    isActive: boolean;
    indent?: boolean;
    onClick: (id: string) => void;
}

/** First `# heading` in the doc, slugified the same way `rehype-slug` (via
 * `github-slugger`) assigns ids to the actual rendered heading. */
function extractH1Id(markdown: string): string | null {
    const line = markdown
        .split("\n")
        .find((l) => /^#\s+\S/.test(l.trim()) && !/^##/.test(l.trim()));
    if (!line) return null;
    const text = line.trim().replace(/^#\s+/, "");
    return slugifyHeading(text);
}

/** Builds one `PageIndexGroup` per doc: the group's own heading/anchor is the
 * doc's first `#` title (falling back to its slug when none is found), with
 * its first `maxSectionsPerDoc` `##` sections nested underneath (no `###`
 * level) — used by the Additional Resources index, where many small docs are
 * shown together and only a quick-scan outline per doc is wanted. */
export function buildDocIndexGroups(
    docs: Record<string, string>,
    slugs: string[],
    maxSectionsPerDoc: number,
    groupLabel: (slug: string) => string = (slug) => slug
): PageIndexGroup[] {
    return slugs.map((slug) => {
        const content = docs[slug] ?? "";
        const sections = extractMarkdownToc(content)
            .filter((entry) => entry.level === 2)
            .slice(0, maxSectionsPerDoc);
        return {
            id: extractH1Id(content) ?? slug,
            label: groupLabel(slug),
            items: sections.map((section) => ({
                id: section.id,
                label: stripHeadingNumberPrefix(section.text),
            })),
            slug,
        };
    });
}

/** Each section's `###` subsections are capped to this many in the index —
 * the sections themselves are never capped (see `buildSectionIndexGroups`). */
const MAX_SUBSECTIONS_PER_SECTION = 4;

/** Builds one `PageIndexGroup` per `##` section across all docs (no doc-level
 * wrapper, no cap) — every section is listed, each with its first
 * `MAX_SUBSECTIONS_PER_SECTION` `###` subsections nested underneath. Used by
 * the Use Case Brief index, where the doc is usually one long brief and the
 * index should mirror its full section structure, with just a quick-scan
 * sample of each section's subsections rather than every one of them. */
export function buildSectionIndexGroups(
    docs: Record<string, string>,
    slugs: string[]
): PageIndexGroup[] {
    return slugs.flatMap((slug) => {
        const content = docs[slug] ?? "";
        return extractNestedMarkdownToc(content).map(({ section, subsections }) => ({
            id: section.id,
            label: stripHeadingNumberPrefix(section.text),
            items: subsections.slice(0, MAX_SUBSECTIONS_PER_SECTION).map((sub) => ({
                id: sub.id,
                label: stripHeadingNumberPrefix(sub.text),
            })),
            slug,
        }));
    });
}

const PageIndexLink: FC<PageIndexLinkProps> = ({ id, label, isActive, indent, onClick }) => (
    <div className="relative flex items-start">
        {isActive && (
            <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sky-500" />
        )}
        <Button
            type="button"
            variant="ghost"
            onClick={() => onClick(id)}
            title={label}
            className={cn(
                "h-auto flex-1 justify-start text-left leading-snug rounded transition-colors truncate",
                indent
                    ? "pl-5 py-1 text-xs font-normal"
                    : "pl-3 py-1.5 text-sm font-medium",
                isActive
                    ? indent
                        ? "bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-300 font-medium"
                        : "bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-300 font-semibold"
                    : indent
                        ? "text-slate-500 dark:text-n-40 hover:bg-slate-100 dark:hover:bg-surface-muted hover:text-slate-800 dark:hover:text-n-10"
                        : "text-slate-700 dark:text-n-20 hover:bg-slate-100 dark:hover:bg-surface-muted hover:text-slate-900 dark:hover:text-n-10"
            )}
        >
            {label}
        </Button>
    </div>
);
