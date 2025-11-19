import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify"; // Assuming you're using react-toastify for notifications
import { Flow, SubmitEventParams } from "../../../types/flow-types";
import { SessionCache } from "../../../types/session-types";
import IconButton from "../../ui/mini-components/icon-button";
import { FaRegStopCircle } from "react-icons/fa";
import { IoPlay } from "react-icons/io5";
import { AiOutlineDelete } from "react-icons/ai";
import {
	clearFlowData,
	deleteExpectation,
	getCompletePayload,
	getMappedFlow,
	newFlow,
	proceedFlow,
	requestForFlowPermission,
	putCacheData,
	addFlowToSessionInDB,
} from "../../../utils/request-utils";
import { IoMdDownload } from "react-icons/io";
import { FlowMap } from "../../../types/flow-state-type";
import { FcWorkflow } from "react-icons/fc";
import DisplayFlow from "./mapped-flow";
import { getSequenceFromFlow } from "../../../utils/flow-utils";
import CircularProgress from "../../ui/circular-cooldown";
import { v4 as uuidv4 } from "uuid";
import Popup from "../../ui/pop-up/pop-up";
import FormConfig, {
	FormConfigType,
} from "../../ui/forms/config-form/config-form";
import { trackEvent } from "../../../utils/analytics";

interface AccordionProps {
	flow: Flow;
	activeFlow: string | null;
	setActiveFlow: (flowId: string | null) => void;
	sessionCache?: SessionCache | null;
	sessionId: string;
	setSideView: React.Dispatch<any>;
	subUrl: string;
	onFlowStop: () => void;
	onFlowClear: () => void;
}

export function Accordion({
	flow,
	activeFlow,
	setActiveFlow,
	sessionCache,
	sessionId,
	subUrl,
	onFlowStop,
	onFlowClear,
}: AccordionProps) {
	const [inputPopUp, setInputPopUp] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [mappedFlow, setMappedFlow] = useState<FlowMap>({
		sequence: getSequenceFromFlow(
			sessionCache?.flowConfigs[flow.id] ?? flow,
			sessionCache,
			activeFlow
		),
		missedSteps: [],
	});
	const [activeFormConfig, setActiveFormConfig] =
		useState<FormConfigType | null>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [maxHeight, setMaxHeight] = useState("0px");
	const apiCallFailCount = useRef(0);

	useEffect(() => {
		const executedFlowId = Object.keys((sessionCache?.flowMap as any) || {});

		if (executedFlowId.includes(flow.id) && sessionCache) {
			console.log("get current staet fot this");
			getCurrentState(sessionCache);
		}

		if (sessionCache?.activeFlow) {
			setActiveFlow(sessionCache.activeFlow);
		} else {
			setActiveFlow(null);
		}
	}, [flow, sessionCache]);

	const getCurrentState = async (sessionCache: SessionCache) => {
		const tx = sessionCache.flowMap?.[flow.id];
		if (tx) {
			try {
				const txData = (await getMappedFlow(tx, sessionId)) as FlowMap; // Assuming the response is of type FlowMap
				for (let i = 0; i < txData.sequence.length; i++) {
					const payloads = txData.sequence[i].payloads;
					if (payloads) {
						if (!payloads.entryType) {
							txData.sequence[i].payloads!.entryType = "API";
						}
					}
				}
				setMappedFlow(txData);
				apiCallFailCount.current = 0; // Reset fail count on successful fetch
			} catch (error) {
				apiCallFailCount.current = apiCallFailCount.current + 1;
				console.error("Failed to fetch transaction data:", error);
			}
		} else {
			setMappedFlow({
				sequence: getSequenceFromFlow(flow, sessionCache, activeFlow),
				missedSteps: [],
			});
		}
	};

	const fetchTransactionData = async () => {
		if (activeFlow !== flow.id || !sessionCache) {
			return;
		}
		getCurrentState(sessionCache);
	};

	useEffect(() => {
		if (contentRef.current) {
			setMaxHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
		}
	}, [isOpen, mappedFlow]);

	async function handleFormForNewFlow(formData: SubmitEventParams) {
		try {
			await newFlow(
				sessionId,
				flow.id,
				uuidv4(),
				formData.jsonPath,
				formData.formData
			);
			setInputPopUp(false);
			toast.success("Flow started successfully");
		} catch (e) {
			toast.error("Error while submitting form");
			setInputPopUp(false);
			console.error(e);
		}
	}

	const startFlow = async () => {
		try {
			if (!sessionCache) return;
			const canStart = await canStartFlow(sessionCache, mappedFlow);
			console.log(canStart);
			if (!canStart) return;
			setActiveFlow(flow.id);
			const given = sessionCache.flowMap[flow.id];
			if (given) {
				toast.info("Resuming the flow!");
				await proceedFlow(sessionId, given);
			} else {
				const txId = uuidv4();
				const data = await newFlow(sessionId, flow.id, txId);
				if (data.inputs) {
					toast.info("Inputs are required to start the flow");
					setActiveFormConfig(data.inputs);
					setInputPopUp(true);
				}
				// if (data.expectationAdded) {
				// 	toast.info("Expectation added successfully");
				// }
			}
			putCacheData({ activeFlow: flow.id }, sessionId);
			setIsOpen(true);
		} catch (e) {
			toast.error("Error while starting flow");
			console.error(e);
		}
	};

	if (!sessionCache) {
		return (
			<div className="bg-white rounded-md shadow-sm border border-sky-100 p-5 mb-4">
				<style>
					{`
						@keyframes shimmer {
							0% { background-position: -200px 0; }
							100% { background-position: calc(200px + 100%) 0; }
						}
						.skeleton {
							background: linear-gradient(90deg, #e0f2fe 25%, #b3e5fc 50%, #e0f2fe 75%);
							background-size: 200px 100%;
							animation: shimmer 1.5s infinite;
						}
					`}
				</style>
				<div className="space-y-4">
					{/* Header skeleton */}
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-6 h-6 rounded skeleton"></div>
							<div className="space-y-2">
								<div className="h-4 w-32 rounded skeleton"></div>
								<div className="h-3 w-24 rounded skeleton"></div>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<div className="w-8 h-8 rounded-md skeleton"></div>
							<div className="w-8 h-8 rounded-md skeleton"></div>
							<div className="w-8 h-8 rounded-md skeleton"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const handleDownload = async () => {
		const payload_ids = mappedFlow?.sequence.flatMap((s) => {
			if (s.payloads?.entryType === "FORM") {
				return [];
			}
			return s.payloads?.payloads.map((p) => p.payloadId) ?? [];
		});

		if (!payload_ids) {
			return;
		}

		const jsonData = await getCompletePayload(payload_ids);
		const jsonString = JSON.stringify(jsonData, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });

		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = `${flow?.id}-${activeFlow}.json`;
		document.body.appendChild(a);

		a.click();
		URL.revokeObjectURL(url);
		document.body.removeChild(a);
	};

	function AccordionButtons() {
		return (
			<div className="flex items-center">
				<div className="flex items-center justify-center p-2 ml-2 rounded-md shadow-sm bg-sky-50 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sky-600 ease-in">
					<div className="flex items-center gap-2 text-sm font-bold text-sky-700">
						{getPercent(mappedFlow).toFixed(0)}%
					</div>
				</div>
				{!activeFlow && (
					<IconButton
						icon={<IoPlay className=" text-md" />}
						label="Start flow"
						color="sky"
						onClick={async (e) => {
							addFlowToSessionInDB(sessionId, {id: flow.id, status: "PENDING"})
							trackEvent({
								category: "SCENARIO_TESTING-FLOWS",
								action: `Started a flow: ${flow.id}`,
							})
							e.stopPropagation();
							await startFlow();
						}}
					/>
				)}
				{activeFlow === flow.id && (
					<IconButton
						icon={<FaRegStopCircle className=" text-xl" />}
						label="Stop flow"
						color="red"
						onClick={async (e) => {
							trackEvent({
								category: "SCENARIO_TESTING-FLOWS",
								action: `Stopped a flow: ${flow.id}`,
							})
							e.stopPropagation(); // Prevent accordion toggle
							setActiveFlow(null);
							setIsOpen(false);
							await deleteExpectation(sessionId, subUrl);
							putCacheData({ activeFlow: "NONE" }, sessionId);
							onFlowStop();
						}}
					/>
				)}
				{!activeFlow && (
					<IconButton
						icon={<AiOutlineDelete className=" text-md" />}
						label="Clear flow data"
						color="orange"
						onClick={async (e) => {
							trackEvent({
								category: "SCENARIO_TESTING-FLOWS",
								action: `Cleared a flow: ${flow.id}`,
							})
							e.stopPropagation();
							setMappedFlow({
								sequence: getSequenceFromFlow(
									sessionCache?.flowConfigs[flow.id] ?? flow,
									sessionCache,
									activeFlow
								),
								missedSteps: [],
							});
							await clearFlowData(sessionId, flow.id);
							onFlowClear();
						}}
					/>
				)}
				{mappedFlow?.sequence && mappedFlow?.sequence?.length > 0 && (
					<IconButton
						icon={<IoMdDownload className=" text-md" />}
						label="Download Logs"
						color="green"
						onClick={async (e) => {
							trackEvent({
								category: "SCENARIO_TESTING-FLOWS",
								action: `Download logs for flow: ${flow.id}`,
							})
							e.stopPropagation();
							handleDownload();
						}}
					/>
				)}
				<CircularProgress
					key={flow.id}
					sqSize={24}
					strokeWidth={3}
					duration={3}
					onComplete={async () => {
						if (apiCallFailCount.current < 5) {
							await fetchTransactionData();
						}
					}}
					loop={true}
					isActive={activeFlow === flow.id}
					id="fetch-transaction-data"
				/>
			</div>
		);
	}

	const bg = activeFlow === flow.id ? "bg-blue-50" : "bg-white";
	return (
		<div className="rounded-md mb-4 w-full ml-1">
			<div
				className={`${bg} border rounded-md shadow-sm hover:bg-sky-100 cursor-pointer transition-colors px-5 py-3`}
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-controls={`accordion-content-${flow.id}`}
			>
				{/* Top Row: Title + Button */}
				<div className="flex items-center justify-between">
					{/* Text Block */}
					<div>
						<div className="flex items-center gap-2 text-base font-bold text-sky-700">
							<FcWorkflow className="text-lg" />
							{flow.id.split("_").join(" ")}
						</div>
						<h2 className="text-black font-medium">{flow?.title}</h2>
					</div>
					{/* Accordion Button */}
					<AccordionButtons />
				</div>

				{/* Progress Bar below */}
				<div className="mt-2">
					<ProgressBar percent={getPercent(mappedFlow)} />
				</div>
			</div>

			{/* Accordion content with drop animation */}
			<div
				ref={contentRef}
				id={`accordion-content-${flow.id}`}
				className="overflow-hidden transition-all duration-300 ease-in-out"
				style={{ maxHeight: `${maxHeight}` }}
			>
				<div className="px-4 py-5 bg-white">
					<p className="text-gray-700 mb-6">{flow.description}</p>

					<div className="space-y-4 relative">
						{<DisplayFlow 
							mappedFlow={mappedFlow} 
							flowId={flow.id}
							onFlowProceeded={() => {
								console.log('🔄 [complete-flow] Flow proceeded, refreshing state...');
								if (sessionCache) {
									getCurrentState(sessionCache);
								}
							}}
						/>}
					</div>
				</div>
			</div>
			{inputPopUp && activeFormConfig && (
				<Popup isOpen={inputPopUp} disableClose>
					<FormConfig
						formConfig={activeFormConfig}
						submitEvent={handleFormForNewFlow}
						referenceData={mappedFlow.reference_data}
						flowId={flow.id}
					/>
				</Popup>
			)}
		</div>
	);
}

async function canStartFlow(sessionData: SessionCache, mappedFlow: FlowMap) {
	const action = mappedFlow.sequence[0].actionType;
	if (mappedFlow.sequence[0].expect && sessionData.npType === "BAP") {
		console.log("Requesting for flow permission");
		return await requestForFlowPermission(action, sessionData.subscriberUrl);
	}
	return true;
}

function ProgressBar({ percent }: { percent: number }) {
	return (
		<div className="w-full bg-gray-200 rounded-full h-2">
			<div
				className="h-2 rounded-full transition-width duration-300"
				style={{
					width: `${percent}%`,
					backgroundImage: "linear-gradient(to right, #38bdf8, #0369a1)", // Gradient from sky-500 to sky-700
				}}
			></div>
		</div>
	);
}

function getPercent(mappedFlow: FlowMap) {
	const totalSteps = mappedFlow.sequence.length;
	if (totalSteps === 0) return 0;
	const completedSteps = mappedFlow.sequence.filter(
		(step) => step.status === "COMPLETE"
	).length;
	return (completedSteps / totalSteps) * 100;
}
