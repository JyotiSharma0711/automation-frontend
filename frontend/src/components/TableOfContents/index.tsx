import { type FC, useMemo, useState } from "react";
import { extractMarkdownToc } from "@utils/markdownToc";
import { scrollToSectionWithOffset } from "./scrollToSection";
import { Button } from "@/components/Shadcn/Button";

interface TableOfContentsProps {
    content: string;
    /** Optional extra class on the outer wrapper (e.g. sticky + top offset) */
    className?: string;
    /** Inline style on the outer wrapper (e.g. { top: 128 } for sticky offset) */
    style?: React.CSSProperties;
    /**
     * Height (px) of any sticky header/breadcrumb the page content scrolls under.
     * When set, clicking an entry scrolls just enough to clear that sticky area
     * instead of pulling the section to the absolute top of the viewport.
     */
    offset?: number;
    /** When provided, called on section click (parent handles scroll/URL). */
    onSectionClick?: (id: string) => void;
    /** Externally controlled active section id. */
    activeSectionId?: string | null;
}

const TableOfContents: FC<TableOfContentsProps> = ({
    content,
    className,
    style,
    offset = 0,
    onSectionClick,
    activeSectionId,
}) => {
    const toc = useMemo(() => extractMarkdownToc(content), [content]);
    const [activeId, setActiveId] = useState("");

    if (toc.length === 0) return null;

    const handleClick = (id: string) => {
        setActiveId(id);
        if (onSectionClick) {
            onSectionClick(id);
            return;
        }
        if (offset > 0) {
            scrollToSectionWithOffset(id, offset);
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    };

    const resolvedActiveId = activeSectionId ?? activeId;

    return (
        <div className={className} style={style}>
            <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
                {/* Header */}
                <div className="px-3 py-2 bg-slate-100 border-b border-slate-200">
                    <span className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">
                        On this page
                    </span>
                </div>

                {/* Nav */}
                <nav className="p-1.5 space-y-px">
                    {toc.map((entry) => {
                        const isActive = resolvedActiveId === entry.id;
                        return (
                            <div key={entry.id} className="relative flex items-start">
                                {/* Active accent bar */}
                                {isActive && (
                                    <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sky-500" />
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => handleClick(entry.id)}
                                    title={entry.text}
                                    className={[
                                        "h-auto flex-1 justify-start text-left leading-snug rounded transition-colors truncate",
                                        entry.level === 3
                                            ? "pl-5 py-1 text-xs font-normal"
                                            : "pl-3 py-1.5 text-sm font-medium",
                                        isActive
                                            ? entry.level === 3
                                                ? "bg-sky-50 text-sky-800 font-medium"
                                                : "bg-sky-50 text-sky-800 font-semibold"
                                            : entry.level === 3
                                                ? "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                                    ].join(" ")}
                                >
                                    {entry.text}
                                </Button>
                            </div>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default TableOfContents;
