import { useEffect, useState } from "react";
import { FlowMap, MappedStep } from "../../../types/flow-state-type";
import FormConfig, {
	FormConfigType,
} from "../../ui/forms/config-form/config-form";
import Popup from "../../ui/pop-up/pop-up";
import { SubmitEventParams } from "../../../types/flow-types";
import { proceedFlow } from "../../../utils/request-utils";
import { useSession } from "../../../context/context";
import { toast } from "react-toastify";
import PairedCard from "./pair-card";

export default function DisplayFlow({
	mappedFlow,
	flowId,
}: {
	mappedFlow: FlowMap;
	flowId: string;
}) {
	// mappedFlow = dummy;
	const steps = getOrderedSteps(mappedFlow);
	const [inputPopUp, setInputPopUp] = useState(false);
	const [activeFormConfig, setActiveFormConfig] = useState<
		FormConfigType | undefined
	>(undefined);

	const { sessionId, sessionData } = useSession();

	useEffect(() => {
		const conf = mappedFlow?.sequence?.filter(
			(s, index) => s.status === "INPUT-REQUIRED" && index !== 0
		)?.[0]?.input;
		if (conf?.length === 0) {
			if (sessionData?.activeFlow !== flowId) return;
			handleFormSubmit({ jsonPath: {}, formData: {} });
			return;
		}
		setActiveFormConfig(conf);
		if (conf) {
			setInputPopUp(true);
		}
	}, [mappedFlow]);

	useEffect(() => {
		const latestSending = mappedFlow?.sequence.find(
			(f) => f.status === "RESPONDING"
		);
		const transactionId = sessionData?.flowMap[flowId];
		if (latestSending && latestSending.force_proceed && transactionId) {
			proceedFlow(sessionId, transactionId);
		}
	}, [mappedFlow]);

	const handleFormSubmit = async (formData: SubmitEventParams) => {
		try {
			const txId = sessionData?.flowMap[flowId];
			if (!txId) {
				console.error("Transaction ID not found");
				return;
			}
			await proceedFlow(sessionId, txId, formData.jsonPath, formData.formData);
			setInputPopUp(false);
			setActiveFormConfig(undefined);
		} catch (error) {
			toast.error("Error submitting form ");
			console.error("Error submitting form data:", error);
			setInputPopUp(false);
		}
	};
	return (
		<>
			<div>
				{steps.map((pairedStep, index) => (
					<PairedCard key={index} pairedStep={pairedStep} flowId={flowId} />
				))}
			</div>
			<div></div>
		{inputPopUp && activeFormConfig && (
			<Popup isOpen={inputPopUp} disableClose>
				<FormConfig
					formConfig={activeFormConfig}
					submitEvent={handleFormSubmit}
					referenceData={mappedFlow.reference_data}
					flowId={flowId}
				/>
			</Popup>
		)}
		</>
	);
}

export type PairedStep = {
	first: MappedStep;
	second?: MappedStep;
};

function getOrderedSteps(mappedFlow: FlowMap): PairedStep[] {
	const sequence = [...mappedFlow.sequence, ...mappedFlow.missedSteps];
	const visited = new Set<string>();
	const steps: PairedStep[] = [];

	for (const step of sequence) {
		if (visited.has(`${step.actionId}_${step.index}`)) continue;

		visited.add(`${step.actionId}_${step.index}`);

		let pairStep: MappedStep | undefined;
		if (step.pairActionId) {
			pairStep = sequence.find((s) => s.actionId === step.pairActionId);
			if (pairStep && !visited.has(pairStep.actionId)) {
				visited.add(`${pairStep.actionId}_${pairStep.index}`);
			}
		}

		steps.push({
			first: step,
			second: pairStep,
		});
	}

	return steps.sort((a, b) => {
		return a.first.index - b.first.index;
	});
}
