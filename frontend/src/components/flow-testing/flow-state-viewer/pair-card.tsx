import { PairedStep } from "./mapped-flow";
import { MappedStep } from "../../../types/flow-state-type";
import CustomTooltip from "../../ui/mini-components/tooltip";
import { MdSyncAlt } from "react-icons/md";
import { useSession } from "../../../context/context";
import FlippableWrapper from "../../ui/flippable-div";
import { getCompletePayload } from "../../../utils/request-utils";

export default function PairedCard({
	pairedStep,
	flowId,
}: {
	pairedStep: PairedStep;
	flowId: string;
}) {
	const { first, second } = pairedStep;
	return (
		<div className="flex flex-col sm:flex-row sm:items-stretch space-y-2 sm:space-y-0 sm:space-x-4 bg-white p-2 rounded-lg">
			{/* First Step */}
			<div className="flex-1">
				<StepDisplay step={first} flowId={flowId} />
			</div>

			{/* Separator Icon */}
			{second && (
				<div className="flex justify-center items-center">
					{/* <div className="p-2 rounded-full bg-slate-100 shadow-md border"> */}
					<MdSyncAlt className={`text-3xl font-bold text-slate-500`} />
					{/* </div> */}
				</div>
			)}

			{/* Second Step */}
			{second && (
				<div className="flex-1">
					<StepDisplay step={second} flowId={flowId} />
				</div>
			)}
		</div>
	);
}

function StepDisplay({ step, flowId }: { step: MappedStep; flowId: string }) {
	const { activeFlowId, setRequestData, setResponseData, activeCallClickedToggle, setActiveCallClickedToggle } = useSession();

	const onClickFunc = async () => {
		if(step.status === "INPUT-REQUIRED") {
			setActiveCallClickedToggle(!activeCallClickedToggle)
		}

		if (step.status !== "COMPLETE") {
			// setRequestData(step);
			// setResponseData(step);
			setRequestData({ info: "Step not complete" });
			setResponseData({ info: "Step not complete" });
			return;
		}
		if (step.payloads?.entryType === "FORM") {
			setRequestData({ info: step.payloads });
			setResponseData({ info: step.payloads });
			return;
		}
		const payloadIds = step.payloads?.payloads.map((p) => p.payloadId) ?? [];
		const payloads = await getCompletePayload(payloadIds);
		setRequestData(payloads.map((p: any) => p.req));
		setResponseData(payloads.map((p: any) => p.res.response));
	};

	const status =
		step.status === "COMPLETE"
			? (step.payloads?.subStatus ?? "ERROR")
			: step.status;
	const statusStyles = getStatusStyles(status);
	if (step.missedStep) {
		statusStyles.card =
			"border-purple-200  bg-gradient-to-br from-purple-50 to-purple-100 shadow-md shadow-purple-200";
	}
	if (
		flowId !== activeFlowId &&
		["LISTENING", "RESPONDING", "INPUT-REQUIRED"].includes(status)
	) {
		statusStyles.messageText = "INACTIVE";
	}
	const apiCount = getCount(step);
	return (
		// <CustomTooltip content={step.description ?? ""}>
		<FlippableWrapper flipTrigger={step.status}>
			<button
				className={`${statusStyles?.card} w-full h-full rounded-lg p-3 border shadow-sm hover:shadow-lg transition-all duration-200`}
				onClick={onClickFunc}
			>
				<div className="w-full flex flex-col space-y-1">
					{/* Header */}
					<div className="flex justify-between items-center">
						<h1 className="text-md font-semibold text-gray-800 flex">
							{step.missedStep ? "" : `${step.index + 1}: `}
							{step.actionType}
							{step.label && (
								<span className="text-md font-normal text-gray-500 ml-2 ">
									({step.label})
								</span>
							)}
						</h1>
						<div className="flex items-center gap-2">
							{step.unsolicited && (
								<div className="bg-white text-gray-700 text-sm font-semibold border rounded-full px-3 py-1">
									unsolicited
								</div>
							)}
							<CustomTooltip content={step.description ?? ""}>
								<div className="bg-white text-gray-700 text-sm font-semibold border rounded-full px-3 py-1 hover:shadow-md">
									info
								</div>
							</CustomTooltip>
						</div>
					</div>
					{/* Status Indicator */}
					<div className="flex items-center space-x-2">
						{statusStyles?.messageText && (
							<span
								className={`${statusStyles.messageBg} text-white text-sm border font-sm rounded-full px-3 py-1 flex`}
							>
								{statusStyles?.messageText}
								{["LISTENING", "RESPONDING", "INPUT-REQUIRED"].includes(
									status
								) &&
									flowId === activeFlowId && (
										<div className="w-4 h-4 border-2 border-t-2 border-t-yellow-800 border-white rounded-full animate-spin-slow ml-2"></div>
									)}
							</span>
						)}
						{step.missedStep && (
							<span
								className={`bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm border font-sm rounded-full px-3 py-1 flex`}
							>
								out-of-sequence
							</span>
						)}
						{/* API Count */}
						{apiCount > 0 && (
							<div
								className={`${getCountStyles(apiCount)} text-sm font-semibold rounded-full px-3 py-1`}
							>
								<span className="text-black">count: </span>
								{apiCount}
							</div>
						)}

						{/* Timestamp (if available) */}
						{step.payloads?.timestamp && (
							<div className="bg-white text-gray-700 text-sm font-semibold border rounded-full px-3 py-1">
								{new Date(step.payloads.timestamp).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
									second: "2-digit",
									hour12: true,
								})}
							</div>
						)}
					</div>
				</div>
			</button>
		</FlippableWrapper>
		// </CustomTooltip>
	);
}

function getStatusStyles(
	status:
		| "ERROR"
		| "SUCCESS"
		| "LISTENING"
		| "RESPONDING"
		| "INPUT-REQUIRED"
		| "WAITING"
		| "PROCESSING"
		| "WAITING-SUBMISSION"
) {
	switch (status) {
		case "SUCCESS":
			return {
				card: "border-green-300 bg-green-100 shadow-md shadow-green-200",
				messageText: "ACK",
				messageBg: "bg-gradient-to-r from-green-600 to-green-500 text-white",
			};

		case "ERROR":
			return {
				card: "border-red-300 bg-red-100 shadow-md shadow-red-200",
				messageText: "NACK",
				messageBg: "bg-gradient-to-r from-red-600 to-red-500 text-white",
			};

		case "RESPONDING":
			return {
				card: "border-blue-300 bg-gradient-to-br from-blue-50 to-blue-200 shadow-md shadow-blue-200",
				messageText: "SENDING",
				messageBg: "bg-gradient-to-r from-blue-600 to-blue-400 text-white",
			};
		case "INPUT-REQUIRED":
			return {
				card: "border-sky-300 bg-gradient-to-br from-sky-50 to-sky-200 shadow-md shadow-sky-200",
				messageText: "SENDING",
				messageBg: "bg-gradient-to-r from-sky-600 to-sky-400 text-white",
			};

		case "LISTENING":
			return {
				card: "border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-200 shadow-md shadow-yellow-200",
				messageText: "WAITING",
				messageBg: "bg-gradient-to-r from-yellow-600 to-yellow-500 text-white",
			};

		case "WAITING":
			return {
				card: "border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-md shadow-slate-200",
				messageBg: "bg-slate-400 text-white",
			};
		case "PROCESSING":
			return {
				card: "border-purple-300 bg-gradient-to-br from-purple-50 to-purple-200 shadow-md shadow-purple-200",
				messageText: "PROCESSING",
				messageBg: "bg-gradient-to-r from-purple-600 to-purple-500 text-white",
			};
		case "WAITING-SUBMISSION":
			return {
				card: "border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-200 shadow-md shadow-indigo-200",
				messageText: "WAITING-SUBMISSION",
				messageBg: "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white",
			};
	}
}

function getCount(step: MappedStep) {
	if (step.payloads?.entryType === "FORM") {
		return 0;
	}
	return step.status === "COMPLETE" ? (step.payloads?.payloads.length ?? 0) : 0;
}

function getCountStyles(count: number) {
	if (count === 1) {
		return "bg-white text-black border border-gray-200";
	} else if (count <= 3) {
		return "bg-white text-blue-600 border border-gray-200";
	} else if (count <= 6) {
		return "bg-white text-blue-700 border border-gray-200";
	} else if (count <= 10) {
		return "bg-white text-indigo-800 border border-gray-200";
	} else {
		return "bg-white text-violet-900 border border-gray-200 animate-pulse";
	}
}
