import React, { FC, Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
    ArrowTurnDownRightIcon,
    ArrowsRightLeftIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button";
import { Switch } from "@/components/Shadcn/Switch/switch";
import { cn } from "@/lib/utils";
import type { FlowEntry, FlowStep, StepDisplayItem } from "./types";
import { getActionId } from "./utils";
import OwnerPill from "./shared/components/OwnerPill";
import {
    buildFlowHierarchies,
    type FlowHierarchyGroup,
} from "./FlowInformation/flowHierarchyPreview";
import { buildStepDisplayItems } from "./FlowInformation/utils";
import {
    annotateSimplifiedItems,
    filterItemsExcludingSections,
    getInlineFlowConfigs,
    getSimplifiedGroups,
    getSimplifiedGroupsExcluding,
    lastIndexPerHeading,
    type SimplifiedItemAnnotation,
} from "./FlowInformation/simplifiedFlowView";

interface FlowsHierarchyAccordionProps {
    flows: FlowEntry[];
    selectedFlow?: string;
    selectedFlowAction?: string;
    setSelectedFlow: (flow: string) => void;
    setSelectedFlowAction: (action: string) => void;
}

const flowTitle = (flowId: string) => flowId.split("_").join(" ");

const AccordionFlowDescription: FC<{ text: string }> = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);
    const textRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const el = textRef.current;
        if (!el) return;
        setCanExpand(el.scrollHeight > el.clientHeight + 1);
    }, [text]);

    const toggle = (e: React.SyntheticEvent) => {
        e.stopPropagation();
        setExpanded((v) => !v);
    };

    return (
        <span className="flex flex-col items-start gap-0.5">
            <span
                ref={textRef}
                className={cn(
                    "whitespace-normal text-xs font-normal leading-snug text-slate-500 dark:text-n-40",
                    !expanded && "line-clamp-2"
                )}
            >
                {text}
            </span>
            {(canExpand || expanded) && (
                <span
                    role="button"
                    tabIndex={0}
                    onClick={toggle}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggle(e);
                        }
                    }}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 cursor-pointer"
                >
                    {expanded ? "Show less" : "… Learn more"}
                </span>
            )}
        </span>
    );
};

// ─── Shared collapsible-card primitives ─────────────────────────────────────
// Every accordion card in this file (prerequisite, inline, optional-step
// segment, servicing-flow secondary, primary) shares the same chevron +
// grid-rows collapse + badge-pill shapes. Centralizing them here keeps every
// card visually/behaviorally consistent — e.g. the chevron is always wrapped
// in its own span so Shadcn Button's `has-[>svg]:px-3` base style never
// silently shrinks a header's padding (see FlowsHierarchyAccordion padding
// fixes earlier this file's history).

const Chevron: FC<{ isOpen: boolean; size?: "sm" | "md" }> = ({ isOpen, size = "sm" }) => (
    <ChevronDownIcon
        className={cn(
            size === "md" ? "size-4" : "size-3.5",
            "text-slate-400 transition-transform duration-300",
            isOpen && "rotate-180"
        )}
    />
);

const BADGE_COLOR_CLASS = {
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
} as const;

const Badge: FC<{ color: keyof typeof BADGE_COLOR_CLASS; children: React.ReactNode }> = ({
    color,
    children,
}) => (
    <span
        className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            BADGE_COLOR_CLASS[color]
        )}
    >
        {children}
    </span>
);

const CountChip: FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-surface-muted dark:text-n-40">
        {children}
    </span>
);

/** The `grid-rows-[0fr]` → `grid-rows-[1fr]` collapse trick, shared by every
 * accordion body in this file (it animates height without a measured pixel
 * value). */
const CollapsiblePanel: FC<{ isOpen: boolean; children: React.ReactNode }> = ({
    isOpen,
    children,
}) => (
    <div
        className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
    >
        <div className="overflow-hidden">{children}</div>
    </div>
);

const CARD_BORDER_CLASS = {
    slate: "border-slate-200 dark:border-border-default",
    violet: "border-violet-200 dark:border-violet-800",
    sky: "border-sky-200 dark:border-sky-800",
} as const;

interface CollapsibleCardProps {
    isOpen: boolean;
    onToggle: () => void;
    borderColor?: keyof typeof CARD_BORDER_CLASS;
    /** Extra classes on the outer card wrapper (e.g. "min-w-0 flex-1" when the
     * card sits alongside a stepper bullet instead of standing alone). */
    wrapperClassName?: string;
    /** Extra/overriding classes on the header Button — gap/padding/hover color. */
    headerClassName?: string;
    bodyClassName?: string;
    /** Icon shown before the title/badge stack (e.g. a "nested under" arrow). */
    leading?: React.ReactNode;
    titleClassName?: string;
    title: React.ReactNode;
    badge?: React.ReactNode;
    /** Rendered before the chevron inside the same trailing group (e.g. a count chip). */
    trailing?: React.ReactNode;
    children: React.ReactNode;
}

const CollapsibleCard: FC<CollapsibleCardProps> = ({
    isOpen,
    onToggle,
    borderColor = "slate",
    wrapperClassName,
    headerClassName,
    bodyClassName = "px-3 pb-3 pt-0.5",
    leading,
    titleClassName = "text-[11px]",
    title,
    badge,
    trailing,
    children,
}) => {
    const titleBlock = (
        <span className="flex min-w-0 flex-col items-start gap-1">
            <span
                className={cn(
                    "min-w-0 font-medium text-slate-800 dark:text-n-10 wrap-anywhere whitespace-normal leading-4",
                    titleClassName
                )}
            >
                {title}
            </span>
            {badge}
        </span>
    );

    return (
        <div
            className={cn(
                "rounded-lg border bg-white dark:bg-surface-elevated overflow-hidden",
                CARD_BORDER_CLASS[borderColor],
                wrapperClassName
            )}
        >
            <Button
                type="button"
                variant="ghost"
                onClick={onToggle}
                aria-expanded={isOpen}
                className={cn(
                    "h-auto w-full justify-between gap-2 rounded-none px-3 font-normal text-left hover:bg-slate-50 dark:hover:bg-surface-muted",
                    headerClassName
                )}
            >
                {leading ? (
                    <span className="flex min-w-0 items-start gap-2">
                        {leading}
                        {titleBlock}
                    </span>
                ) : (
                    titleBlock
                )}
                <span className="flex shrink-0 items-center gap-1.5">
                    {trailing}
                    <Chevron isOpen={isOpen} />
                </span>
            </Button>
            <CollapsiblePanel isOpen={isOpen}>
                <div className={bodyClassName}>{children}</div>
            </CollapsiblePanel>
        </div>
    );
};

/** The outer shell shared by both "primary" cards (Journey view's "Full
 * Journey" card and API Reference's primary-flow card) — same rounded-xl
 * wrapper, toggle button, and collapse panel; only the header content and
 * body differ per view. */
const PrimaryCardShell: FC<{
    isOpen: boolean;
    onToggle: () => void;
    headerClassName: string;
    header: React.ReactNode;
    children: React.ReactNode;
}> = ({ isOpen, onToggle, headerClassName, header, children }) => (
    <div className="rounded-xl border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated shadow-sm overflow-hidden">
        <Button
            type="button"
            variant="ghost"
            onClick={onToggle}
            aria-expanded={isOpen}
            className={cn(
                "h-auto w-full items-start justify-between gap-2 rounded-none font-normal text-left hover:bg-slate-50 dark:hover:bg-surface-muted",
                headerClassName
            )}
        >
            {header}
        </Button>
        <CollapsiblePanel isOpen={isOpen}>{children}</CollapsiblePanel>
    </div>
);

const FlowsHierarchyAccordion: FC<FlowsHierarchyAccordionProps> = ({
    flows,
    selectedFlow,
    selectedFlowAction,
    setSelectedFlow,
    setSelectedFlowAction,
}) => {
    const groups: FlowHierarchyGroup[] = useMemo(() => buildFlowHierarchies(flows), [flows]);

    // "API Reference" toggle: off (default) shows the simplified, user-friendly
    // names for the main-path steps covered by a simplified-view config; on shows
    // the existing API-call UI. The toggle only renders when a config matches
    // these flows (e.g. FIS12 Personal Loan) — other use cases are unaffected.
    const [showApiReference, setShowApiReference] = useState(false);

    const simplifiedAnnotations = useMemo(() => {
        const map = new Map<string, SimplifiedItemAnnotation[]>();
        for (const group of groups) {
            // Every primary group gets its own "Full Journey"/"Flow" card in the
            // Journey View below, not just explicit PRIMARY-typed ones with
            // secondaries — so a standalone flow's own `meta.display` must be
            // annotated too, or its card silently falls back to raw API names.
            const configGroups = getSimplifiedGroups(group.primary);
            if (!configGroups) continue;
            const annotations = annotateSimplifiedItems(group.primaryItems, configGroups);
            if (annotations) map.set(group.primary.flowId, annotations);
        }
        return map;
    }, [groups]);

    // Business Illustration view: when a use case has one (or more) flows
    // marked `meta.display.preferred`, only those preferred flows' journeys are
    // shown for that use case — everything else is hidden, not just reordered.
    // Use cases with no preferred flow (or no display config at all) are
    // unaffected and keep showing every primary group as before.
    const journeyGroupOrder = useMemo(() => {
        const preferredUsecases = new Set<string>();
        for (const group of groups) {
            if (group.primary.meta?.display?.preferred === true) {
                preferredUsecases.add(group.primary.usecase ?? "");
            }
        }
        return groups.filter((group) => {
            const usecase = group.primary.usecase ?? "";
            if (!preferredUsecases.has(usecase)) return true;
            return group.primary.meta?.display?.preferred === true;
        });
    }, [groups]);
    const hasSimplifiedView = simplifiedAnnotations.size > 0;

    const [openGroupId, setOpenGroupId] = useState<string | null>(null);
    const [openSecondaryId, setOpenSecondaryId] = useState<string | null>(null);
    const [openPrereqId, setOpenPrereqId] = useState<string | null>(null);
    const [openJourneySecondaryId, setOpenJourneySecondaryId] = useState<string | null>(null);
    const [openInlineFlowId, setOpenInlineFlowId] = useState<string | null>(null);
    const [openOptionalGroupId, setOpenOptionalGroupId] = useState<string | null>(null);

    const flowsById = useMemo(() => new Map(flows.map((f) => [f.flowId, f])), [flows]);
    const inlineOwnerByFlowId = useMemo(() => {
        const map = new Map<string, string>();
        for (const group of groups) {
            for (const cfg of getInlineFlowConfigs(group.primary)) {
                if (flowsById.has(cfg.flow)) {
                    map.set(cfg.flow, group.primary.flowId);
                }
            }
        }
        return map;
    }, [groups, flowsById]);

    // Keep the group (and secondary) owning the externally-selected flow expanded.
    useEffect(() => {
        if (!selectedFlow) return;

        const inlineOwnerId = inlineOwnerByFlowId.get(selectedFlow);
        if (inlineOwnerId) {
            setOpenGroupId(inlineOwnerId);
            return;
        }

        for (const group of groups) {
            if (group.primary.flowId === selectedFlow) {
                setOpenGroupId(group.primary.flowId);
                return;
            }
            const secondary = group.secondaries.find((s) => s.flow.flowId === selectedFlow);
            if (secondary) {
                setOpenGroupId(group.primary.flowId);
                setOpenSecondaryId(secondary.flow.flowId);
                return;
            }
            // Prerequisites render inside every primary card; open this one to reveal it.
            if (group.prerequisites.some((p) => p.flow.flowId === selectedFlow)) {
                setOpenGroupId(group.primary.flowId);
                setOpenPrereqId(selectedFlow);
                return;
            }
        }
    }, [groups, selectedFlow, inlineOwnerByFlowId]);

    if (groups.length === 0) return null;

    const selectStep = (flowId: string, step: FlowStep) => {
        setSelectedFlow(flowId);
        setSelectedFlowAction(getActionId(step));
    };

    // Same sizing/padding as FlowsAccordion's renderStepButton.
    const stepButton = (flowId: string, step: FlowStep) => {
        const actionId = getActionId(step);
        const isSelected = selectedFlow === flowId && selectedFlowAction === actionId;
        return (
            <Button
                key={actionId}
                type="button"
                variant="ghost"
                onClick={() => selectStep(flowId, step)}
                className={cn(
                    "h-auto w-full min-w-0 flex-col items-stretch px-2 py-2 rounded-lg border font-normal text-left transition-[border-color,box-shadow] duration-200",
                    isSelected
                        ? "border-sky-400 dark:border-sky-500 ring-2 ring-sky-100 dark:ring-sky-500/20 bg-white dark:bg-surface-elevated shadow-sm"
                        : "border-slate-200 bg-white dark:bg-surface-elevated hover:border-slate-300 hover:shadow-xs"
                )}
            >
                <div className="flex w-full min-w-0 items-center justify-between gap-1">
                    <span className="min-w-0 text-[11px] font-medium leading-tight text-slate-800 dark:text-n-10 whitespace-nowrap">
                        {step.action_label ?? step.api}
                    </span>
                    <OwnerPill
                        owner={step.owner}
                        className="shrink-0 px-1 py-px text-[8px] leading-none"
                    />
                </div>
            </Button>
        );
    };

    // Vertical stepper rail (same as FlowsAccordion): dot per row, segments filled up
    // to the currently-selected call.
    const stepperBullet = (
        isReached: boolean,
        isPast: boolean,
        isFirst: boolean,
        isLast: boolean
    ) => (
        <div
            className="relative flex w-4 shrink-0 items-center justify-center self-stretch"
            aria-hidden
        >
            {!isFirst && (
                <span
                    className={cn(
                        "absolute -top-2.5 bottom-1/2 left-1/2 w-px -translate-x-1/2",
                        isReached ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
                    )}
                />
            )}
            {!isLast && (
                <span
                    className={cn(
                        "absolute top-1/2 -bottom-2.5 left-1/2 w-px -translate-x-1/2",
                        isPast ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
                    )}
                />
            )}
            <span
                className={cn(
                    "relative z-10 size-2.5 shrink-0 rounded-full border-2",
                    isReached
                        ? "border-sky-500 bg-sky-500"
                        : "border-slate-300 bg-white dark:border-slate-600 dark:bg-surface-elevated"
                )}
            />
        </div>
    );

    const itemMatchesAction = (item: StepDisplayItem, actionId: string | undefined) => {
        if (!actionId) return false;
        if (item.type === "pair") {
            return (
                getActionId(item.request) === actionId || getActionId(item.response) === actionId
            );
        }
        return getActionId(item.step) === actionId;
    };

    // User-friendly rows shown in place of the API-call buttons while the
    // "API Reference" toggle is off. Same selection behavior as stepButton — the
    // rows only swap the label, so clicking still opens the API call details.
    const simplifiedStepRows = (
        flowId: string,
        item: StepDisplayItem,
        labels: Record<string, string>
    ) => {
        const steps = item.type === "pair" ? [item.request, item.response] : [item.step];
        return (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {steps.map((step) => {
                    const actionId = getActionId(step);
                    const isSelected = selectedFlow === flowId && selectedFlowAction === actionId;
                    return (
                        <Button
                            key={actionId}
                            type="button"
                            variant="ghost"
                            onClick={() => selectStep(flowId, step)}
                            className={cn(
                                "h-auto w-full min-w-0 justify-start px-2 py-2 rounded-lg border font-normal text-left transition-[border-color,box-shadow] duration-200",
                                isSelected
                                    ? "border-sky-400 dark:border-sky-500 ring-2 ring-sky-100 dark:ring-sky-500/20 bg-white dark:bg-surface-elevated shadow-sm"
                                    : "border-slate-200 bg-white dark:bg-surface-elevated hover:border-slate-300 hover:shadow-xs"
                            )}
                        >
                            <span className="min-w-0 text-[11px] font-medium leading-tight text-slate-800 dark:text-n-10 whitespace-normal text-left">
                                {labels[actionId] ?? step.action_label ?? step.api}
                            </span>
                        </Button>
                    );
                })}
            </div>
        );
    };

    // Renders one display item's row (stepper bullet + button/pair), used both
    // for the normal sequence and for the content inside an optional-step card.
    const renderStepItemRow = (
        flowId: string,
        item: StepDisplayItem,
        annotation: SimplifiedItemAnnotation | undefined,
        bullet: React.ReactNode
    ) => {
        const simplifiedLabels =
            !showApiReference && annotation?.stepLabels ? annotation.stepLabels : null;
        return (
            <div className="flex min-w-0 items-center gap-2.5">
                {bullet}
                {simplifiedLabels ? (
                    simplifiedStepRows(flowId, item, simplifiedLabels)
                ) : item.type === "pair" ? (
                    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_1.25rem_minmax(0,1fr)] items-center gap-x-2.5">
                        {stepButton(flowId, item.request)}
                        <span className="flex items-center justify-center">
                            <ArrowsRightLeftIcon
                                className="size-3 shrink-0 text-slate-400"
                                aria-hidden
                            />
                        </span>
                        {stepButton(flowId, item.response)}
                    </div>
                ) : (
                    <div className="min-w-0 flex-1">{stepButton(flowId, item.step)}</div>
                )}
            </div>
        );
    };

    const stepRows = (
        flowId: string,
        items: StepDisplayItem[],
        withStepper = false,
        annotations?: SimplifiedItemAnnotation[] | null,
        injectAfter?: Map<number, React.ReactNode>
    ) => {
        const selectedItemIndex =
            withStepper && selectedFlow === flowId
                ? items.findIndex((item) => itemMatchesAction(item, selectedFlowAction))
                : -1;

        const nodes: React.ReactNode[] = [];
        let i = 0;
        while (i < items.length) {
            const item = items[i];
            const annotation = annotations?.[i];

            // A run of consecutive items flagged `optional` (meta.display.sections[].optional)
            // renders as one collapsible "Optional Step" card — same badge/behavior as an
            // `inline` card, but for steps that belong to this flow's own sequence.
            if (annotation?.optional) {
                const start = i;
                let end = i;
                while (end < items.length && annotations?.[end]?.optional) end++;
                const segmentItems = items.slice(start, end);
                const segmentAnnotations = annotations?.slice(start, end) ?? [];
                const heading = annotation.heading ?? "Optional Step";
                const groupKey = `${flowId}::optional::${start}`;
                const isOpen =
                    openOptionalGroupId === groupKey ||
                    (selectedFlow === flowId &&
                        segmentItems.some((it) => itemMatchesAction(it, selectedFlowAction)));

                nodes.push(
                    <Fragment key={groupKey}>
                        <div className="flex min-w-0 items-center gap-2.5">
                            {withStepper &&
                                stepperBullet(
                                    selectedItemIndex >= 0 && start <= selectedItemIndex,
                                    selectedItemIndex >= 0 && start < selectedItemIndex,
                                    start === 0,
                                    end === items.length
                                )}
                            <CollapsibleCard
                                isOpen={isOpen}
                                onToggle={() => setOpenOptionalGroupId(isOpen ? null : groupKey)}
                                borderColor="violet"
                                wrapperClassName="min-w-0 flex-1"
                                headerClassName="py-2.5 hover:bg-violet-50/60 dark:hover:bg-violet-950/20"
                                bodyClassName="flex flex-col gap-2.5 px-3 pb-3 pt-0.5"
                                title={heading}
                                badge={<Badge color="violet">Optional Step</Badge>}
                            >
                                {segmentItems.map((segItem, segIdx) =>
                                    renderStepItemRow(
                                        flowId,
                                        segItem,
                                        segmentAnnotations[segIdx],
                                        null
                                    )
                                )}
                            </CollapsibleCard>
                        </div>
                        {injectAfter?.get(end - 1)}
                    </Fragment>
                );
                i = end;
                continue;
            }

            nodes.push(
                <Fragment key={i}>
                    {annotation?.heading && (
                        <div
                            className={cn(
                                "text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-n-40",
                                i > 0 && "pt-1"
                            )}
                        >
                            {annotation.heading}
                        </div>
                    )}
                    {renderStepItemRow(
                        flowId,
                        item,
                        annotation,
                        withStepper
                            ? stepperBullet(
                                  selectedItemIndex >= 0 && i <= selectedItemIndex,
                                  selectedItemIndex >= 0 && i < selectedItemIndex,
                                  i === 0,
                                  i === items.length - 1
                              )
                            : null
                    )}
                    {injectAfter?.get(i)}
                </Fragment>
            );
            i++;
        }

        return <div className="flex flex-col gap-2.5 pt-2.5">{nodes}</div>;
    };

    // Inline flows injected within a primary's items, anchored to one of its
    // sections (`meta.display.inline`) and rendered as collapsible
    // "optional"/"alternative" cards right after the section's last item.
    // Shared by both views — Business Illustration and API Reference.
    const buildInlineNodes = (
        primary: FlowEntry,
        annotations: SimplifiedItemAnnotation[] | null
    ) => {
        const injectNodes = new Map<number, React.ReactNode>();
        const inlineConfigs = getInlineFlowConfigs(primary);
        if (inlineConfigs.length === 0) return injectNodes;

        const lastIdxByHeading = lastIndexPerHeading(annotations);
        for (const cfg of inlineConfigs) {
            const targetIdx = lastIdxByHeading[cfg.after_section];
            if (targetIdx === undefined) continue;
            const inlineFlow = flowsById.get(cfg.flow);
            if (!inlineFlow) continue;

            const skipSections = cfg.skip_sections ?? [];
            const inlineItems = filterItemsExcludingSections(
                inlineFlow,
                buildStepDisplayItems(inlineFlow.config?.steps ?? []),
                skipSections
            );
            const inlineGroups = getSimplifiedGroupsExcluding(inlineFlow, skipSections);
            const inlineAnnotations = inlineGroups
                ? annotateSimplifiedItems(inlineItems, inlineGroups)
                : null;
            const inlineId = inlineFlow.flowId;
            const isOpen = openInlineFlowId === inlineId;
            const isAlternative = cfg.kind === "alternative";
            const node = (
                <div key={inlineId} className="space-y-1.5 mt-2">
                    <CollapsibleCard
                        isOpen={isOpen}
                        onToggle={() => setOpenInlineFlowId(isOpen ? null : inlineId)}
                        borderColor={isAlternative ? "sky" : "violet"}
                        headerClassName={cn(
                            "gap-4 py-2.5",
                            isAlternative
                                ? "hover:bg-sky-50/60 dark:hover:bg-sky-950/20"
                                : "hover:bg-violet-50/60 dark:hover:bg-violet-950/20"
                        )}
                        title={cfg.label ?? flowTitle(inlineId)}
                        badge={
                            <Badge color={isAlternative ? "sky" : "violet"}>
                                {isAlternative ? "Alternative Path" : "Optional Step"}
                            </Badge>
                        }
                    >
                        {stepRows(inlineId, inlineItems, false, inlineAnnotations)}
                    </CollapsibleCard>
                </div>
            );
            const existing = injectNodes.get(targetIdx);
            injectNodes.set(
                targetIdx,
                existing ? (
                    <>
                        {existing}
                        {node}
                    </>
                ) : (
                    node
                )
            );
        }
        return injectNodes;
    };

    // PREREQUISITE flows: collapsible sub-cards shown above a primary's calls,
    // shared by both the Journey View and the API Reference View.
    const renderPrerequisites = (prerequisites: FlowHierarchyGroup["prerequisites"]) =>
        prerequisites.length > 0 && (
            <div className="px-4 pb-2 pt-2.5 space-y-1.5">
                {prerequisites.map((prereq) => {
                    const prereqId = prereq.flow.flowId;
                    const isOpen = openPrereqId === prereqId;
                    const prereqGroups = getSimplifiedGroups(prereq.flow);
                    const prereqAnnotations = prereqGroups
                        ? annotateSimplifiedItems(prereq.items, prereqGroups)
                        : null;
                    return (
                        <CollapsibleCard
                            key={prereqId}
                            isOpen={isOpen}
                            onToggle={() => setOpenPrereqId(isOpen ? null : prereqId)}
                            headerClassName="py-2"
                            bodyClassName="px-8 pb-2.5 pt-0.5"
                            titleClassName="text-[12px]"
                            title={flowTitle(prereqId)}
                            badge={<Badge color="violet">Prerequisite</Badge>}
                            trailing={<CountChip>{prereq.stepCount} calls</CountChip>}
                        >
                            {stepRows(prereqId, prereq.items, false, prereqAnnotations)}
                        </CollapsibleCard>
                    );
                })}
            </div>
        );

    // Shared toggle bar rendered at the top of both views.
    const toggleBar = hasSimplifiedView && (
        <div className="sticky top-0 z-20 flex items-center gap-2 bg-white px-1 py-2 dark:bg-surface-page">
            <label
                htmlFor="dev-guide-api-reference"
                className="cursor-pointer text-[12px] font-medium text-slate-700 dark:text-n-20"
            >
                Business Illustration
            </label>
            <Switch
                id="dev-guide-api-reference"
                size="sm"
                checked={showApiReference}
                onCheckedChange={setShowApiReference}
            />
            <label
                htmlFor="dev-guide-api-reference"
                className="cursor-pointer text-[12px] font-medium text-slate-700 dark:text-n-20"
            >
                API References
            </label>
        </div>
    );

    // ── Journey View: toggle OFF (Business Illustration) ──────────────────────
    // Renders every primary group as its own "Full Journey" card — not just the
    // first one with a display config — so flows without a config (or whose
    // config doesn't cover every step) still show in full, falling back to raw
    // API labels per-call via stepRows' own annotation lookup.
    if (!showApiReference && hasSimplifiedView) {
        // Derive a short display label for secondary flows by stripping the
        // usecase prefix (e.g. "Personal Loan ") and variant suffixes (e.g. " Offline")
        // so "Personal Loan Foreclosure Offline" → "Foreclosure".
        const shortSecondaryName = (flow: FlowEntry, usecaseName: string): string => {
            let name = flow.flowId.split("_").join(" ");
            const VARIANT_SUFFIXES = [" Offline", " Single Redirection", " Online"];
            // Strip leading usecase prefix
            if (usecaseName && name.toLowerCase().startsWith(usecaseName.toLowerCase() + " ")) {
                name = name.slice(usecaseName.length + 1);
            }
            // Strip trailing variant suffix
            for (const suffix of VARIANT_SUFFIXES) {
                if (name.toLowerCase().endsWith(suffix.toLowerCase())) {
                    name = name.slice(0, -suffix.length);
                    break;
                }
            }
            return name.trim() || flow.flowId.split("_").join(" ");
        };

        return (
            <div className="space-y-3">
                {toggleBar}
                {journeyGroupOrder.map((journeyGroup) => {
                    const flowId = journeyGroup.primary.flowId;
                    const flowDescription = journeyGroup.primary.description;
                    const annotations = simplifiedAnnotations.get(flowId) ?? null;
                    const usecaseName = journeyGroup.primary.usecase ?? "";
                    const isPreferred = journeyGroup.primary.meta?.display?.preferred === true;

                    // Inline flows injected within this journey, anchored to one of its
                    // sections (`meta.display.inline`) and rendered as collapsible
                    // "optional"/"alternative" cards right after the section's last item.
                    const injectNodes = buildInlineNodes(journeyGroup.primary, annotations);

                    const isJourneyOpen = openGroupId === flowId;

                    return (
                        <PrimaryCardShell
                            key={flowId}
                            isOpen={isJourneyOpen}
                            onToggle={() => setOpenGroupId(isJourneyOpen ? null : flowId)}
                            headerClassName="px-4 pt-4 pb-4"
                            header={
                                <>
                                    <span className="flex min-w-0 flex-col items-start gap-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-n-40">
                                            {journeyGroup.isExplicitPrimary
                                                ? isPreferred
                                                    ? "Full Journey · Recommended"
                                                    : "Full Journey"
                                                : "Flow"}
                                        </span>
                                        <span className="min-w-0 text-body-2 font-semibold text-gray-900 dark:text-n-10 wrap-anywhere whitespace-normal leading-5">
                                            {journeyGroup.primary.usecase ?? flowTitle(flowId)}
                                        </span>
                                        {flowDescription && (
                                            <AccordionFlowDescription text={flowDescription} />
                                        )}
                                    </span>
                                    <span className="flex shrink-0 items-center mt-4">
                                        <Chevron isOpen={isJourneyOpen} size="md" />
                                    </span>
                                </>
                            }
                        >
                            {renderPrerequisites(journeyGroup.prerequisites)}

                            <div className="px-4 pb-4 pt-2.5">
                                {stepRows(
                                    flowId,
                                    journeyGroup.primaryItems,
                                    true,
                                    annotations,
                                    injectNodes.size > 0 ? injectNodes : undefined
                                )}
                            </div>

                            {/* Alternate paths inside the same card, below the main steps */}
                            {journeyGroup.secondaries.length > 0 && (
                                <div className="border-t border-slate-100 dark:border-border-default px-4 pb-3">
                                    <p className="pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-n-40">
                                        Servicing Flows
                                    </p>
                                    <div className="space-y-1.5">
                                        {journeyGroup.secondaries.map((secondary) => {
                                            const secId = secondary.flow.flowId;
                                            const isOpen = openJourneySecondaryId === secId;
                                            return (
                                                <CollapsibleCard
                                                    key={secId}
                                                    isOpen={isOpen}
                                                    onToggle={() =>
                                                        setOpenJourneySecondaryId(
                                                            isOpen ? null : secId
                                                        )
                                                    }
                                                    headerClassName="py-2.5"
                                                    title={shortSecondaryName(
                                                        secondary.flow,
                                                        usecaseName
                                                    )}
                                                    badge={
                                                        <Badge color="amber">Servicing Flow</Badge>
                                                    }
                                                >
                                                    {stepRows(
                                                        secId,
                                                        secondary.items,
                                                        false,
                                                        (() => {
                                                            const secGroups = getSimplifiedGroups(
                                                                secondary.flow
                                                            );
                                                            return secGroups
                                                                ? annotateSimplifiedItems(
                                                                      secondary.items,
                                                                      secGroups
                                                                  )
                                                                : null;
                                                        })()
                                                    )}
                                                </CollapsibleCard>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </PrimaryCardShell>
                    );
                })}
            </div>
        );
    }
    // ── API Reference View: toggle ON (or no simplified config) ──────────────
    return (
        <div className="space-y-3">
            {toggleBar}
            {groups.map((group) => {
                const groupId = group.primary.flowId;
                const groupDesc = group.primary.description;
                const isGroupOpen = openGroupId === groupId;
                const hasSecondaries = group.secondaries.length > 0;
                const groupAnnotations = simplifiedAnnotations.get(groupId) ?? null;
                // Inline flows (`meta.display.inline`) render identically here as in
                // Business Illustration — same collapsible optional/alternative cards,
                // anchored after the same section.
                const injectNodes = buildInlineNodes(group.primary, groupAnnotations);

                return (
                    <PrimaryCardShell
                        key={groupId}
                        isOpen={isGroupOpen}
                        onToggle={() => setOpenGroupId(isGroupOpen ? null : groupId)}
                        headerClassName="p-4 pb-3"
                        header={
                            <>
                                <span className="flex min-w-0 flex-col items-start gap-2">
                                    <span className="min-w-0 text-body-2 font-semibold text-gray-900 dark:text-n-10 wrap-anywhere whitespace-normal leading-5">
                                        {flowTitle(groupId)}
                                    </span>
                                    {groupDesc && <AccordionFlowDescription text={groupDesc} />}
                                    {group.isExplicitPrimary && (
                                        <Badge color="sky">Primary Path</Badge>
                                    )}
                                </span>
                                <span className="flex shrink-0 items-center mt-0.5">
                                    <Chevron isOpen={isGroupOpen} size="md" />
                                </span>
                            </>
                        }
                    >
                        {/* PREREQUISITE flows: collapsible, above the primary's calls */}
                        {renderPrerequisites(group.prerequisites)}

                        {/* Primary flow's full call sequence, with stepper rail */}
                        <div className="px-4 pb-3">
                            {stepRows(
                                groupId,
                                group.primaryItems,
                                true,
                                groupAnnotations,
                                injectNodes.size > 0 ? injectNodes : undefined
                            )}
                        </div>

                        {/* ── Secondary flows: nested under the primary's calls ── */}
                        {hasSecondaries && (
                            <div className="px-4 pb-3 space-y-1.5">
                                {group.secondaries.map((secondary) => {
                                    const secondaryId = secondary.flow.flowId;
                                    const isOpen = openSecondaryId === secondaryId;
                                    return (
                                        <CollapsibleCard
                                            key={secondaryId}
                                            isOpen={isOpen}
                                            onToggle={() =>
                                                setOpenSecondaryId(isOpen ? null : secondaryId)
                                            }
                                            headerClassName="py-2"
                                            bodyClassName="px-3 pb-2.5 pt-0.5"
                                            titleClassName="text-[12px]"
                                            leading={
                                                <ArrowTurnDownRightIcon
                                                    className="mt-0.5 size-3.5 shrink-0 text-slate-400 dark:text-n-40"
                                                    aria-hidden
                                                />
                                            }
                                            title={flowTitle(secondaryId)}
                                            badge={<Badge color="amber">Servicing Flow</Badge>}
                                            trailing={
                                                <CountChip>{secondary.stepCount} calls</CountChip>
                                            }
                                        >
                                            {stepRows(
                                                secondaryId,
                                                secondary.items,
                                                false,
                                                (() => {
                                                    const secGroups = getSimplifiedGroups(
                                                        secondary.flow
                                                    );
                                                    return secGroups
                                                        ? annotateSimplifiedItems(
                                                              secondary.items,
                                                              secGroups
                                                          )
                                                        : null;
                                                })()
                                            )}
                                        </CollapsibleCard>
                                    );
                                })}
                            </div>
                        )}
                    </PrimaryCardShell>
                );
            })}
        </div>
    );
};

export default FlowsHierarchyAccordion;
