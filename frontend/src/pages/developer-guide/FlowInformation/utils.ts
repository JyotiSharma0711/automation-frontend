import type { FlowStep, StepDisplayItem } from "@pages/developer-guide/types";
import { getActionId, labelToSlug } from "@pages/developer-guide/utils";
import type {
    FlowExample,
    FlowInformationSection,
} from "@pages/developer-guide/FlowInformation/types";

/** Pairs up request/response steps (e.g. search + on_search) for display; unpaired steps stand alone. */
export function buildStepDisplayItems(steps: FlowStep[]): StepDisplayItem[] {
    const displayed = new Set<number>();
    const items: StepDisplayItem[] = [];
    const actionIdToIdx = new Map<string, number>();

    steps?.forEach((s, i) => {
        const aid = getActionId(s);
        actionIdToIdx.set(aid, i);
    });

    for (let i = 0; i < steps?.length; i++) {
        if (displayed.has(i)) continue;
        const step = steps[i];
        const responseFor = step.responseFor;

        if (responseFor) {
            const requestIdx = actionIdToIdx.get(responseFor);
            if (requestIdx != null && !displayed.has(requestIdx)) {
                items.push({
                    type: "pair",
                    request: steps[requestIdx],
                    response: step,
                    requestIdx,
                    responseIdx: i,
                });
                displayed.add(requestIdx);
                displayed.add(i);
                continue;
            }
        }

        const actionId = getActionId(step);
        const responderIdx = steps.findIndex((s) => s.responseFor === actionId);
        if (responderIdx >= 0 && !displayed.has(responderIdx)) {
            items.push({
                type: "pair",
                request: step,
                response: steps[responderIdx],
                requestIdx: i,
                responseIdx: responderIdx,
            });
            displayed.add(i);
            displayed.add(responderIdx);
        } else {
            items.push({ type: "single", step, stepIdx: i });
            displayed.add(i);
        }
    }
    return items;
}

export function getExamplesFromStep(step: FlowStep | undefined): FlowExample[] {
    if (!step) return [];
    const fromStep = step.examples?.map((ex) => ({
        name: ex.name ?? ex.description ?? "Example",
        payload: ex.payload,
    }));
    if (fromStep && fromStep.length > 0) return fromStep;
    const fromMock = step.mock?.examples?.map((ex) => ({
        name: ex.name ?? ex.description ?? "Example",
        payload: ex.payload,
    }));
    if (fromMock && fromMock.length > 0) return fromMock;
    if (step.example?.value != null)
        return [
            {
                name: (step.example as { summary?: string }).summary ?? "Example",
                payload: step.example.value,
            },
        ];
    if (step.mock?.defaultPayload != null)
        return [{ name: "Default", payload: step.mock.defaultPayload }];
    return [];
}

/** Default Details tab for a newly-selected action. */
export function resolveDefaultSection(): FlowInformationSection {
    return "preview";
}

const SEQUENCE_DIAGRAM_DOC_SUFFIX = "-sequence-diagrams";

/** `x-docs` slug for a flow's per-step sequence-diagram doc (see `config/docs/<slug>.md`
 * in automation-specifications). One doc per flow, scoped by its own flowId. */
export function sequenceDiagramDocSlug(flowId: string): string {
    return `${labelToSlug(flowId)}${SEQUENCE_DIAGRAM_DOC_SUFFIX}`;
}

export function isSequenceDiagramDocSlug(slug: string): boolean {
    return slug.toLowerCase().endsWith(SEQUENCE_DIAGRAM_DOC_SUFFIX);
}

/** Pulls the Mermaid body out of the first ```mermaid fence under a `## <headingId>`
 * heading in a flow's sequence-diagram doc (section ends at the next heading or EOF). */
function extractMermaidForHeading(markdown: string, headingId: string): string | null {
    const lines = markdown.split("\n");
    const headingIdx = lines.findIndex((l) => l.trim() === `## ${headingId}`);
    if (headingIdx === -1) return null;

    let sectionEnd = lines.length;
    for (let i = headingIdx + 1; i < lines.length; i++) {
        if (/^#{1,6}\s/.test(lines[i])) {
            sectionEnd = i;
            break;
        }
    }

    const section = lines.slice(headingIdx + 1, sectionEnd);
    const fenceStart = section.findIndex((l) => l.trim().startsWith("```mermaid"));
    if (fenceStart === -1) return null;
    const fenceEnd = section.findIndex((l, i) => i > fenceStart && l.trim() === "```");
    if (fenceEnd === -1) return null;

    const body = section
        .slice(fenceStart + 1, fenceEnd)
        .join("\n")
        .trim();
    return body || null;
}

/**
 * Resolve authored Mermaid for the Details "Sequence Diagram" tab from the flow's
 * `x-docs` sequence-diagram doc (see `sequenceDiagramDocSlug`). No client-side fallback.
 */
export function resolveSequenceMermaid(
    apiDocs: Record<string, string> | undefined,
    flowId: string | undefined,
    actionId: string | undefined
): string | null {
    if (!apiDocs || !flowId || !actionId) return null;
    const doc = apiDocs[sequenceDiagramDocSlug(flowId)];
    if (!doc) return null;
    return extractMermaidForHeading(doc, actionId);
}
