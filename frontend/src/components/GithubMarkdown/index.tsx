import { type FC, memo, useState, useEffect, useMemo } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import type { Components } from "react-markdown";
import { useClipboard } from "@hooks/useClipboard";
import {
    DocumentDuplicateIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button";
import MermaidBlock from "./MermaidBlock";

interface GithubMarkdownProps {
    content: string;
    onSectionClick?: (id: string) => void;
    /** Rendered next to a clickable heading (visible on hover/focus); e.g. an inline "add comment" trigger. */
    renderHeadingAction?: (id: string) => React.ReactNode;
    /** Given an inline-code token, return a click handler to render it as a link
     * (e.g. `/search` → jump to that API call), or null to keep plain code. */
    resolveInlineCodeLink?: (code: string) => (() => void) | null;
}

// Recursively extracts text from React children for copy
function extractText(node: React.ReactNode): string {
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (React.isValidElement(node))
        return extractText((node.props as { children?: React.ReactNode }).children);
    if (Array.isArray(node)) return node.map(extractText).join("");
    return "";
}

// Extracts language from code child className (e.g. "language-json" → "json")
function extractLang(node: React.ReactNode): string {
    for (const child of React.Children.toArray(node)) {
        if (React.isValidElement(child)) {
            const cls = (child.props as { className?: string }).className ?? "";
            const m = /language-(\w+)/.exec(cls);
            if (m) return m[1];
        }
    }
    return "";
}

const PreBlock: FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { copyToClipboard } = useClipboard();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const lang = extractLang(children);
    const text = extractText(children).replace(/\n$/, "");

    const handleCopy = () => {
        void copyToClipboard(text);
    };

    useEffect(() => {
        if (!isFullscreen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsFullscreen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFullscreen]);

    return (
        <>
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={() => setIsFullscreen(false)}
                />
            )}

            <div
                className={
                    isFullscreen
                        ? "fixed inset-4 z-50 overflow-hidden rounded-lg border border-border bg-background shadow-xl"
                        : "relative my-4 overflow-hidden rounded-lg"
                }
            >
                <div className="flex items-center justify-between bg-brand-light px-4 py-1.5 dark:bg-muted">
                    <span className="font-mono text-body-2 font-semibold tracking-wider text-foreground">
                        {lang || "Text"}
                    </span>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCopy}
                            className="gap-1 rounded px-2 py-0.5 text-body-2 font-semibold bg-brand-normal text-n-0 transition-colors hover:bg-brand-normal-hover hover:text-n-0"
                        >
                            <DocumentDuplicateIcon className="size-4" />
                            Copy
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsFullscreen((v) => !v)}
                            className="rounded p-1 text-brand-normal transition-colors hover:bg-brand-normal hover:text-n-0"
                            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                            {isFullscreen ? (
                                <ArrowsPointingInIcon className="size-4" />
                            ) : (
                                <ArrowsPointingOutIcon className="size-4" />
                            )}
                        </Button>
                    </div>
                </div>

                <pre
                    className={
                        isFullscreen
                            ? "h-[calc(100vh-4rem)] overflow-auto bg-brand-light/30 px-4 py-4 text-sm leading-relaxed whitespace-pre text-foreground dark:bg-muted/70 [&_code]:text-inherit"
                            : "m-0 overflow-x-auto bg-brand-light/30 px-4 py-4 text-sm leading-relaxed whitespace-pre text-foreground dark:bg-muted/70 [&_code]:text-inherit"
                    }
                >
                    {children}
                </pre>
            </div>
        </>
    );
};

const components: Components = {
    pre({ children }) {
        const lang = extractLang(children);
        if (lang === "mermaid") {
            return <MermaidBlock source={extractText(children).replace(/\n$/, "")} />;
        }
        return <PreBlock>{children}</PreBlock>;
    },
    code({ className, children }) {
        const str = String(children);

        // Block code
        if (className || str.includes("\n")) {
            return (
                <code className={`${className ?? ""} font-mono text-sm text-inherit`}>
                    {children}
                </code>
            );
        }

        // Inline code
        return (
            <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                {children}
            </code>
        );
    },
    table({ children }) {
        return (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border text-sm">{children}</table>
            </div>
        );
    },
    thead({ children }) {
        return <thead className="bg-muted">{children}</thead>;
    },
    th({ children }) {
        return (
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wider border-b border-border">
                {children}
            </th>
        );
    },
    td({ children }) {
        return <td className="px-4 py-2.5 text-foreground border-b border-border">{children}</td>;
    },
    tr({ children }) {
        return <tr className="even:bg-muted/50 hover:bg-muted/80 transition-colors">{children}</tr>;
    },
    blockquote({ children }) {
        return (
            <blockquote className="mt-3 mb-2 rounded-lg bg-alert-50 px-4 py-3 text-[12px] font-regular text-n-300 not-italic dark:bg-alert-500/10 dark:text-n-60 [&_p]:m-0 [&_p]:text-[12px] [&_p]:text-n-300 [&_p]:dark:text-n-60">
                {children}
            </blockquote>
        );
    },
    h1({ children, id }) {
        return (
            <h1
                id={id}
                className="text-2xl font-bold text-brand-normal mb-3 pb-2 border-b border-border scroll-mt-24"
            >
                {children}
            </h1>
        );
    },
    h2({ children, id }) {
        return (
            <h2
                id={id}
                className="text-xl font-semibold text-brand-normal mt-8 mb-3 pb-2 border-b border-border scroll-mt-24"
            >
                {children}
            </h2>
        );
    },
    h3({ children, id }) {
        return (
            <h3
                id={id}
                className="text-base font-semibold text-brand-normal mt-6 mb-2 scroll-mt-24"
            >
                {children}
            </h3>
        );
    },
    h4({ children, id }) {
        return (
            <h4
                id={id}
                className="text-sm font-semibold text-brand-normal mt-5 mb-1.5 scroll-mt-24"
            >
                {children}
            </h4>
        );
    },
    a({ children, href }) {
        const isExternal = href?.startsWith("http");
        return (
            <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 hover:underline underline-offset-2 transition-colors"
            >
                {children}
            </a>
        );
    },
    ul({ children }) {
        return (
            <ul className="my-3 ml-5 space-y-1 list-disc marker:text-muted-foreground">
                {children}
            </ul>
        );
    },
    ol({ children }) {
        return (
            <ol className="my-3 ml-5 space-y-1 list-decimal marker:text-muted-foreground">
                {children}
            </ol>
        );
    },
    li({ children }) {
        return <li className="text-foreground leading-relaxed pl-1">{children}</li>;
    },
    p({ children }) {
        return <p className="my-3 text-foreground leading-relaxed">{children}</p>;
    },
    hr() {
        // Spacing-only break — no visible rule (heading borders were removed for cleaner docs UI)
        return <hr className="my-6 border-0" aria-hidden />;
    },
    img({ src, alt }) {
        return (
            <img src={src} alt={alt} className="my-4 max-w-full rounded-lg border border-border" />
        );
    },
};

const GithubMarkdown: FC<GithubMarkdownProps> = memo(function GithubMarkdown({
    content,
    onSectionClick,
    renderHeadingAction,
    resolveInlineCodeLink,
}) {
    const markdownComponents = useMemo<Components>(() => {
        const base: Components = resolveInlineCodeLink
            ? {
                  ...components,
                  code({ className, children }) {
                      const str = String(children);
                      if (className || str.includes("\n")) {
                          return (
                              <code className={`${className ?? ""} font-mono text-sm text-inherit`}>
                                  {children}
                              </code>
                          );
                      }
                      const onClick = resolveInlineCodeLink(str);
                      if (onClick) {
                          return (
                              <button
                                  type="button"
                                  onClick={onClick}
                                  title="Open this API call in the API Walkthrough"
                                  className="cursor-pointer rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 font-mono text-[0.85em] text-sky-700 underline-offset-2 transition-colors hover:border-sky-300 hover:bg-sky-100 hover:underline dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                              >
                                  {children}
                              </button>
                          );
                      }
                      return (
                          <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                              {children}
                          </code>
                      );
                  },
              }
            : components;

        // Plain headings by default. Only customize when a hover action (e.g. comment) needs a
        // slot beside the title — never style headings as links (no pointer, underline, or sky color).
        if (!onSectionClick || !renderHeadingAction) return base;

        const headingAction = (id?: string) =>
            id ? (
                <span
                    // `has-[[data-state=open]]` keeps this visible while the popover is open even
                    // though the mouse has left `.group/heading` — Radix portals PopoverContent to
                    // document.body, so moving the cursor into it exits the group-hover/focus-within
                    // DOM subtree, and without this the trigger would shrink back to opacity-0/scale-95
                    // mid-interaction, shifting its anchor rect and making the popover jump sideways.
                    className="shrink-0 opacity-0 scale-95 group-hover/heading:opacity-100 group-hover/heading:scale-100 group-focus-within/heading:opacity-100 group-focus-within/heading:scale-100 focus-within:opacity-100 focus-within:scale-100 has-data-[state=open]:opacity-100 has-data-[state=open]:scale-100 transition-all duration-150"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
                >
                    {renderHeadingAction(id)}
                </span>
            ) : null;

        const headingClickProps = (id?: string) =>
            id
                ? {
                      onClick: () => {
                          onSectionClick(id);
                      },
                  }
                : {};

        return {
            ...base,
            h1({ children, id }) {
                return (
                    <h1
                        id={id}
                        {...headingClickProps(id)}
                        className="group/heading flex items-center gap-2 text-2xl font-bold text-brand-normal mb-3 pb-2 border-b border-border scroll-mt-24"
                    >
                        <span className="min-w-0">{children}</span>
                        {headingAction(id)}
                    </h1>
                );
            },
            h2({ children, id }) {
                return (
                    <h2
                        id={id}
                        {...headingClickProps(id)}
                        className="group/heading flex items-center gap-2 text-xl font-semibold text-brand-normal mt-8 mb-3 pb-2 border-b border-border scroll-mt-24"
                    >
                        <span className="min-w-0">{children}</span>
                        {headingAction(id)}
                    </h2>
                );
            },
            h3({ children, id }) {
                return (
                    <h3
                        id={id}
                        {...headingClickProps(id)}
                        className="group/heading flex items-center gap-2 text-base font-semibold text-brand-normal mt-6 mb-2 scroll-mt-24"
                    >
                        <span className="min-w-0">{children}</span>
                        {headingAction(id)}
                    </h3>
                );
            },
            h4({ children, id }) {
                return (
                    <h4
                        id={id}
                        {...headingClickProps(id)}
                        className="group/heading flex items-center gap-2 text-sm font-semibold text-brand-normal mt-5 mb-1.5 scroll-mt-24"
                    >
                        <span className="min-w-0">{children}</span>
                        {headingAction(id)}
                    </h4>
                );
            },
        };
    }, [onSectionClick, renderHeadingAction, resolveInlineCodeLink]);

    return (
        <div className="github-markdown text-foreground [&_blockquote+h2]:mt-4">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug, rehypeHighlight]}
                components={markdownComponents}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
});

export default GithubMarkdown;
