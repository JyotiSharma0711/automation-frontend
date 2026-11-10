import { useMemo } from "react";
import type { FlowEntry, ValidationTableAction } from "@pages/developer-guide/types";
import { getActionId } from "@/pages/developer-guide/utils";
import { getExamplesFromStep } from "@/pages/developer-guide/FlowInformation/utils";
import { resolveSequenceMermaid } from "@/pages/developer-guide/FlowInformation/utils";

/**
 * Resolves the currently-selected flow/step and the values derived from it
 * (examples, x-validations, whether the Details tabs should render at all).
 */
export function useSelectedFlowStep(
    flows: FlowEntry[],
    selectedFlow: string,
    selectedFlowAction: string,
    selectedExampleIndex: number,
    validationTable: Record<string, ValidationTableAction> | null,
    apiDocs: Record<string, string> | undefined
) {
    const selectedFlowData = flows.find((f) => f.flowId === selectedFlow);
    const steps = selectedFlowData?.config?.steps ?? [];
    const selectedStep = steps.find((s) => getActionId(s) === selectedFlowAction);
    const examples = useMemo(() => getExamplesFromStep(selectedStep), [selectedStep]);

    const selectedExample = examples[selectedExampleIndex] ?? examples[0];
    const examplePayload = selectedExample?.payload;
    const hasExampleObject =
        examplePayload != null &&
        typeof examplePayload === "object" &&
        !Array.isArray(examplePayload);

    const sequenceMermaid = useMemo(
        () =>
            resolveSequenceMermaid(
                apiDocs,
                selectedFlowData?.flowId,
                selectedStep ? getActionId(selectedStep) : undefined
            ),
        [apiDocs, selectedFlowData, selectedStep]
    );

    const apiForValidations = selectedStep?.api ?? selectedFlowAction;
    const selectedValidations = validationTable ? validationTable[apiForValidations] : undefined;
    const hasXValidations = !!selectedValidations;
    const hasTabs = hasExampleObject || hasXValidations || !!selectedStep;

    return {
        selectedFlowData,
        steps,
        selectedStep,
        examples,
        selectedExample,
        examplePayload,
        hasExampleObject,
        sequenceMermaid,
        selectedValidations,
        hasXValidations,
        hasTabs,
    };
}
