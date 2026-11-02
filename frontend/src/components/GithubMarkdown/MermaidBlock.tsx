import { type FC, useEffect, useId, useState } from "react";
import { useTheme } from "@/theme/hooks/useTheme";

interface MermaidBlockProps {
    source: string;
}

// Resolved copies of this app's own design tokens (src/styles/tokens.css).
// Mermaid's theme engine needs concrete, parseable color values for its internal
// color math (lighten/darken) — passing raw `var(--token)` strings throws
// "Unsupported color format", so these are hex snapshots, one per mode.
const PALETTE = {
    light: {
        background: "#fafafb",
        foreground: "#172b4d",
        card: "#ffffff",
        border: "#dfe1e6",
        muted: "#f4f5f7",
        mutedForeground: "#42526e",
        primary: "#0081cc",
    },
    dark: {
        background: "#000000",
        foreground: "#fafafb",
        card: "#141414",
        border: "#2a2a2a",
        muted: "#1a1a1a",
        mutedForeground: "#97a0af",
        primary: "#0081cc",
    },
};

// Distinct per-actor colors for sequence diagrams only (flowcharts stay neutral).
// Cycles by participant declaration order. Mermaid gives the top actor boxes'
// parent <g> a predictable `root-{index}` id, but the duplicate boxes it draws
// at the bottom of the diagram get no id at all — those are matched up by their
// (identical) `x` position instead, since mermaid draws both rows at the same
// x per participant.
const ACTOR_PALETTE = {
    light: [
        { fill: "#fdf2f8", border: "#ec4899" }, // pink
        { fill: "#f0fdfa", border: "#14b8a6" }, // teal
        { fill: "#fff7ed", border: "#f97316" }, // orange
        { fill: "#ecfeff", border: "#06b6d4" }, // cyan
        { fill: "#f5f3ff", border: "#8b5cf6" }, // violet
    ],
    dark: [
        { fill: "#3b0a28", border: "#f472b6" },
        { fill: "#042f2a", border: "#2dd4bf" },
        { fill: "#3a1d05", border: "#fb923c" },
        { fill: "#06282c", border: "#22d3ee" },
        { fill: "#1e1033", border: "#a78bfa" },
    ],
};

function colorizeActors(svgString: string, isDark: boolean): string {
    if (!svgString.includes('class="actor')) return svgString; // not a sequence diagram

    const palette = isDark ? ACTOR_PALETTE.dark : ACTOR_PALETTE.light;
    const doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.documentElement;

    // mermaid's `root-N` id is a page-lifetime counter, not reset per diagram, so N
    // itself isn't a reliable 0-based participant index. Sort by x position instead
    // (left-to-right = declaration order) to get a deterministic index per diagram.
    const topGroups = Array.from(svgEl.querySelectorAll('g[id^="root-"]'))
        .map((g) => ({ g, rect: g.querySelector("rect.actor") }))
        .filter((e): e is { g: Element; rect: Element } => e.rect !== null)
        .sort(
            (a, b) =>
                parseFloat(a.rect.getAttribute("x") ?? "0") -
                parseFloat(b.rect.getAttribute("x") ?? "0")
        );

    const xToColor = new Map<string, { fill: string; border: string }>();
    topGroups.forEach(({ rect }, index) => {
        const color = palette[index % palette.length];
        rect.setAttribute("fill", color.fill);
        rect.setAttribute("stroke", color.border);
        const x = rect.getAttribute("x");
        if (x) xToColor.set(x, color);
    });

    svgEl.querySelectorAll("rect.actor-bottom").forEach((rect) => {
        const x = rect.getAttribute("x");
        const color = x ? xToColor.get(x) : undefined;
        if (!color) return;
        rect.setAttribute("fill", color.fill);
        rect.setAttribute("stroke", color.border);
    });

    return new XMLSerializer().serializeToString(svgEl);
}

/**
 * Renders a ```mermaid fenced code block as an actual diagram, same on-demand
 * dynamic-import + mermaid.render() approach as SequenceDiagramPanel. Themed to
 * match this app's own neutral gray/white design instead of mermaid's default
 * purple/yellow palette.
 */
const MermaidBlock: FC<MermaidBlockProps> = ({ source }) => {
    const reactId = useId().replace(/:/g, "");
    const containerId = `md-mermaid-${reactId}`;
    const { isDark } = useTheme();
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function render() {
            setLoading(true);
            setError(null);
            try {
                const mermaid = (await import("mermaid")).default;
                const c = isDark ? PALETTE.dark : PALETTE.light;
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: "strict",
                    theme: "base",
                    themeVariables: {
                        fontFamily: "Inter, sans-serif",
                        background: c.background,
                        primaryColor: c.card,
                        primaryTextColor: c.foreground,
                        primaryBorderColor: c.border,
                        secondaryColor: c.muted,
                        secondaryBorderColor: c.border,
                        tertiaryColor: c.muted,
                        tertiaryBorderColor: c.border,
                        lineColor: c.mutedForeground,
                        textColor: c.foreground,
                        mainBkg: c.card,
                        clusterBkg: c.muted,
                        clusterBorder: c.border,
                        edgeLabelBackground: c.background,
                        nodeBorder: c.border,
                        titleColor: c.foreground,
                        actorBkg: c.card,
                        actorBorder: c.border,
                        actorTextColor: c.foreground,
                        actorLineColor: c.border,
                        signalColor: c.mutedForeground,
                        signalTextColor: c.foreground,
                        labelBoxBkgColor: c.card,
                        labelBoxBorderColor: c.border,
                        labelTextColor: c.foreground,
                        loopTextColor: c.foreground,
                        noteBkgColor: c.muted,
                        noteBorderColor: c.border,
                        noteTextColor: c.foreground,
                    },
                    flowchart: { htmlLabels: false, curve: "basis" },
                });
                const { svg: rendered } = await mermaid.render(
                    `${containerId}-${Date.now()}`,
                    source
                );
                if (!cancelled) setSvg(colorizeActors(rendered, isDark));
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Failed to render diagram");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void render();
        return () => {
            cancelled = true;
        };
    }, [source, isDark, containerId]);

    if (error) {
        return (
            <div className="my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                Could not render diagram: {error}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="my-4 h-40 animate-pulse rounded-lg border border-border bg-muted/40" />
        );
    }

    return (
        <div
            className="my-4 flex justify-center overflow-x-auto rounded-lg border border-border bg-background p-4 [&_svg]:max-w-full"
            dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
        />
    );
};

export default MermaidBlock;
