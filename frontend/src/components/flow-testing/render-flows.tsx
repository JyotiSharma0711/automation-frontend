import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flow, MetadataField } from "../../types/flow-types";
import InfoCard from "../ui/info-card";
import DifficultyCards from "../ui/difficulty-cards";
import axios from "axios";
import { toast } from "react-toastify";
import { ApiData, SessionCache } from "../../types/session-types";
import {
	getCompletePayload,
	getReport,
	getTransactionData,
} from "../../utils/request-utils";
import { Accordion } from "./flow-state-viewer/complete-flow";
import { useSession } from "../../context/context";
import Loader from "../ui/mini-components/loader";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import Tabs from "../ui/mini-components/tabs";
import { SessionContext } from "../../context/context";
import CircularProgress from "../ui/circular-cooldown";
import Modal from "../modal";
import {
	HiOutlineDocumentReport,
	HiOutlinePlusCircle,
	HiEye,
} from "react-icons/hi";
import jp from "jsonpath";
import FlowHelperTab from "./helper-tab";
import { GetRequestEndpoint } from "./guides";
import { BiSend, BiServer } from "react-icons/bi";
import { trackEvent } from "../../utils/analytics";
import FilterFlowsMenu from "./filter-flows";

function extractMetadataFromFlows(
	flows: Flow[]
): Record<string, MetadataField[]> {
	const flowMetadataMap: Record<string, MetadataField[]> = {};

	flows.forEach((flow) => {
		const flowMetadata: MetadataField[] = [];

		// Extract metadata from each sequence step (API call)
		flow.sequence.forEach((step, stepIndex) => {
			console.log(
				`\n  🔧 API Call ${stepIndex + 1}: ${step.key} (${step.type})`
			);

			// Look for meta-data array (with hyphen) in the sequence object
			const metadataArray = step["meta-data"] || step.metadata;

			if (
				metadataArray &&
				Array.isArray(metadataArray) &&
				metadataArray.length > 0
			) {
				metadataArray.forEach((meta, metaIndex) => {
					console.log(
						`    ${metaIndex + 1}. ${
							meta.description?.name ||
							// || meta?.name
							"Unknown"
						} (${
							meta.description?.code ||
							//    meta.code ||
							"Unknown"
						})`
					);
				});
				flowMetadata.push(...metadataArray);
			} else {
				console.log(`  ❌ No metadata array found for API call ${step.key}`);
			}
		});

		// Store metadata for this specific flow
		flowMetadataMap[flow.id] = flowMetadata;
	});

	return flowMetadataMap;
}

// Function to extract metadata for a specific flow by flow name
function extractMetadataByFlowName(
	flowMetadataMap: Record<string, MetadataField[]>,
	flowName: string
): MetadataField[] {
	const flowMetadata = flowMetadataMap[flowName] || [];

	return flowMetadata;
}

// Function to extract values from payload using metadata
function extractMetadataValues(payload: any, metadataFields: MetadataField[]) {
	const extractedData: Record<string, any> = {};

	metadataFields.forEach((meta) => {
		try {
			const result = jp.query(payload[0], meta.path);

			const value = result.length > 0 ? result[0] : null;

			// Filter out empty, null, undefined values and show "Data not available at this moment"
			const displayValue =
				value === null ||
				value === undefined ||
				value === "" ||
				(typeof value === "string" && value.trim() === "") ||
				(Array.isArray(value) && value.length === 0) ||
				(typeof value === "object" &&
					value !== null &&
					Object.keys(value).length === 0)
					? "Data not available"
					: value;

			extractedData[meta.description.name] = {
				value: displayValue,
			};
		} catch (error: any) {
			extractedData[meta.description.name] = {
				name: meta.description.name,
				value: "Data not available",
				errorMessage: error.message,
			};
		}
	});

	return extractedData;
}

function RenderFlows({
	flows,
	subUrl,
	sessionId,
	// setStep,
	// setReport,
	newSession,
}: {
	flows: Flow[];
	subUrl: string;
	sessionId: string;
	newSession?: () => void;
	// setStep: React.Dispatch<React.SetStateAction<number>>;
	// setReport: React.Dispatch<React.SetStateAction<string>>;
}) {
	const [activeFlow, setActiveFlow] = useState<string | null>(null);
	const activeFlowRef = useRef<string | null>(activeFlow);
	const [cacheSessionData, setCacheSessionData] = useState<SessionCache | null>(
		null
	);
	const [sideView, setSideView] = useState<any>({});
	const [difficultyCache, setDifficultyCache] = useState<any>({});
	const [isFlowStopped, setIsFlowStopped] = useState<boolean>(false);
	const [selectedTab, setSelectedTab] = useState<
		"Request" | "Response" | "Metadata" | "Guide"
	>("Request");
	const [requestData, setRequestData] = useState({});
	const [responseData, setResponseData] = useState({});
	const [metadata, setMetadata] = useState({});
	console.log("metadata", metadata);
	const apiCallFailCount = useRef(0);
	const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
	const navigate = useNavigate();
	const { setSessionId } = useSession();
	const pollingRef = useRef<any>(null);
	const timeoutRef = useRef<any>(null);
	const [isPolling, setIsPolling] = useState(false);
	const [gotReport, setGotReport] = useState(false);
	const [flowTags, setFlowTags] = useState<string[]>([])
	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const [activeCallClickedToggle, setActiveCallClickedToggle] = useState<boolean>(false)

	const startPolling = () => {
		if (isPolling) return; // Prevent multiple starts
		setIsPolling(true);

		const POLL_INTERVAL = 5000; // 5 seconds
		const TIMEOUT = 90000; // 90 seconds
		let stopped = false;

		const stopPolling = (message?: string) => {
			stopped = true;
			if (pollingRef.current) clearTimeout(pollingRef.current);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			setIsPolling(false);
			if (message) console.log("message: ", message);
		};

		const poll = async () => {
			if (stopped) return;

			try {
				const result = await getReport(sessionId);
				if (result?.data) {
					stopPolling("✅ Report ready!");
					toast.info("Report Generated");
					setGotReport(true);
					return;
				}
				console.log("⏳ Still processing...");
			} catch (err) {
				console.error("Polling error:", err);
			}

			pollingRef.current = setTimeout(poll, POLL_INTERVAL);
		};

		// Start first poll
		poll();

		// Set timeout to stop polling after 90s
		timeoutRef.current = setTimeout(() => {
			toast.error("Something went wrong while fetching the report.");
			stopPolling("⏱️ Timed out after 90 seconds");
		}, TIMEOUT);
	};

	useEffect(() => {
		fetchSessionData();
	}, [subUrl]);

	useEffect(() => {
	const allTags = new Set(
		Object.values(flows)
		  .flatMap(cfg => cfg.tags ?? [])
	  );
	  const tagsArray = [...allTags];
	  setFlowTags(tagsArray)
	}, [flows])

	useEffect(() => {
		if (sideView?.payloadId) {
			test();
		} else {
			setRequestData(sideView || {});
			setResponseData(sideView || {});
			setMetadata({});
		}

		extractMetadataFromFlows(flows);
	}, [sideView, flows, activeFlow]);

	const test = async () => {
		try {
			// ✅ Fetch payload
			const data = await getCompletePayload([sideView.payloadId]);

			const requestPayload = data?.[0]?.req || {};
			let responsePayload: any = {};

			// ✅ Extract response payload safely
			if (sideView?.response?.res?.[0]?.response) {
				responsePayload = sideView.response.res[0].response;
			} else if (sideView?.response) {
				responsePayload = sideView.response;
			}

			setRequestData(requestPayload);
			setResponseData(responsePayload);

			// ✅ Extract metadata if flows are available
			handleMetadataExtraction(requestPayload);
		} catch (error) {
			const requestPayload = sideView?.request || {};
			let responsePayload: any = {};

			if (sideView?.response?.res?.[0]?.response) {
				responsePayload = sideView.response.res[0].response;
			} else if (sideView?.response) {
				responsePayload = sideView.response;
			}

			setRequestData(requestPayload);
			setResponseData(responsePayload);

			// ✅ Extract metadata from fallback
			handleMetadataExtraction(requestPayload);
		}
	};

	/**
	 * Helper function to handle metadata extraction from flows
	 */
	const handleMetadataExtraction = (
		requestPayload: Record<string, any>
		// responsePayload: Record<string, any>
	) => {
		if (!flows || flows.length === 0) {
			setMetadata({});
			return;
		}

		const flowMetadataMap = extractMetadataFromFlows(flows);

		if (!Object.keys(flowMetadataMap).length) {
			setMetadata({});
			return;
		}

		// Use active flow if available, otherwise use first flow or all flows combined
		let metadataToUse: MetadataField[] = [];

		if (activeFlow && flowMetadataMap[activeFlow]) {
			metadataToUse = extractMetadataByFlowName(flowMetadataMap, activeFlow);
		} else {
			// Combine metadata from all flows if no specific flow is active
			metadataToUse = Object.values(flowMetadataMap).flat();
		}

		if (requestPayload && Object.keys(requestPayload).length > 0) {
			const Metadata = extractMetadataValues(requestPayload, metadataToUse);
			setMetadata(Metadata);
		} else {
			setMetadata({});
		}
	};

	// Update the ref whenever activeFlow changes
	useEffect(() => {
		activeFlowRef.current = activeFlow;
	}, [activeFlow]);

	// Extract metadata whenever flows are provided
	useEffect(() => {
		if (flows && flows.length > 0) {
			handleMetadataExtraction(requestData);
		} else {
			setMetadata({});
		}
	}, [flows, requestData, responseData]);

	function fetchSessionData() {
		axios
			.get(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
				params: {
					session_id: sessionId,
				},
			})
			.then((response: any) => {
				const filteredData = Object.entries(response.data)
					.filter(([_, value]) => typeof value === "string")
					.reduce((acc: any, [key, value]) => {
						acc[key] = value;
						return acc;
					}, {});
				delete filteredData["active_session_id"];
				setDifficultyCache(response.data.sessionDifficulty);
				setCacheSessionData(response.data);
				apiCallFailCount.current = 0; // Reset fail count on successful fetch
			})
			.catch((e: any) => {
				console.error("Error while fetching session: ", e);
				apiCallFailCount.current = apiCallFailCount.current + 1;
			});
	}

	async function generateReport() {
		const body: any = {};
		console.log("cachedData", cacheSessionData);
		if (!cacheSessionData) {
			toast.error("Error while generating report");
			return;
		}
		let apiList: ApiData[] | undefined = undefined;

		for (const flow in cacheSessionData.flowMap) {
			const transactionId = cacheSessionData.flowMap[flow];
			if (!transactionId) continue;
			const transData = await getTransactionData(transactionId, subUrl);
			if (!transData) continue;
			apiList = transData.apiList;

			body[flow] = (apiList || []).map((data) => {
				return data.payloadId;
			});
		}

		axios
			.post(`${import.meta.env.VITE_BACKEND_URL}/flow/report`, body, {
				params: {
					sessionId: sessionId,
				},
			})
			.then((response: any) => {
				console.log("generating report")
				// setReport(response.data.data);
				// setStep(2);
				if(response?.data?.data?.html) {
					toast.info("Report Generated");

					const decodedHtml = response.data.data.html
					const blob = new Blob([decodedHtml], {
						type: "text/html",
					});
					const url = URL.createObjectURL(blob);

					// Open in a new tab
					window.open(url, "_blank");

					// Optional: cleanup after a short delay
					setTimeout(() => URL.revokeObjectURL(url), 5000);
				} else {
					toast.info(
						"Generating report. It can take upto 90 sec."
					);
					startPolling();
				}
			})
			.catch((e) => {
				console.error(e);
				toast.error("Error while generating report");
			});
	}

	let filteredFlows: any = [];

	if (selectedTags.length) {
    filteredFlows = Object.entries(flows)
      .filter(([_key, cfg]) => cfg.tags?.some((t) => selectedTags.includes(t)))
      .map(([_, cfg]) => cfg);
  } else {
    filteredFlows = flows;
  }

	const handleClearFlow = () => {
		setRequestData({});
		setResponseData({});
		setMetadata({});
		fetchSessionData();
	};

	return (
		<SessionContext.Provider
			// @ts-ignore
			value={{
				sessionId,
				activeFlowId: activeFlow,
				sessionData: cacheSessionData,
				selectedTab: selectedTab,
				setRequestData: setRequestData,
				setResponseData: setResponseData,
				setSideView: setSideView,
				setMetadata: setMetadata,
				setActiveCallClickedToggle: setActiveCallClickedToggle,
				activeCallClickedToggle: activeCallClickedToggle
			}}
		>
			<Modal
				isOpen={isErrorModalOpen}
				onClose={() => {
					navigate("/home");
					setIsErrorModalOpen(false);
				}}
			>
				<h1 className="text-lg font-semibold text-gray-800">Alert</h1>
				<p className="text-sm text-gray-600">Sesson has expired.</p>
				<p className="text-sm text-gray-600">Check support to raise a query.</p>
			</Modal>
			<div className="w-full min-h-screen flex flex-col flex-1">
				<div className="space-y-2 pt-4 pr-4 pl-4">
					{cacheSessionData ? (
						<div className="flex gap-2 flex-col">
							<InfoCard
								title="Info"
								data={{
									sessionId: sessionId,
									subscriberUrl: subUrl,
									activeFlow: activeFlow || "N/A",
									subscriberType: cacheSessionData.npType,
									domain: cacheSessionData.domain,
									version: cacheSessionData.version,
									env: cacheSessionData.env,
									use_case: cacheSessionData.usecaseId,
								}}
								children={
									<div className="w-full flex justify-between">
										<CircularProgress
											duration={5}
											id="flow-cool-down"
											loop={true}
											onComplete={async () => {
												if (apiCallFailCount.current < 5) {
													fetchSessionData();
												} else if (
													apiCallFailCount.current >= 5 &&
													!isErrorModalOpen
												) {
													setIsErrorModalOpen(true);
													console.log("not calling the api");
												}
											}}
											// invisible={true}
											sqSize={16}
											strokeWidth={2}
										/>
										<div className="flex justify-end gap-2">
											<div className="flex justify-end">
												{newSession && (
													<button
														className="bg-sky-600 text-white text-sm flex px-2 py-2 rounded hover:bg-sky-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														onClick={async () => {
															setSessionId("");
															newSession();
														}}
													>
														<HiOutlinePlusCircle className="text-lg m2-1" />
														New Session
													</button>
												)}
											</div>
											<div className="flex justify-end">
												<button
													className="bg-sky-600 text-white text-sm flex px-2 py-2 rounded hover:bg-sky-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
													onClick={async () => {
														trackEvent({
															category: "SCENARIO_TESTING-FLOWS",
															action: "Generate report",
														});
														await generateReport();
													}}
													disabled={!isFlowStopped}
												>
													<HiOutlineDocumentReport className="text-lg m2-1" />
													Generate Report
												</button>
											</div>
											<div className="flex justify-end">
												<button
													className="bg-sky-600 text-white text-sm flex px-2 py-2 rounded hover:bg-sky-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
													onClick={async () => {
														const response = await getReport(sessionId);
														console.log("response", response);
														const base64html = response.data;
														const cleanedData = base64html.split("base64,")[1];
														try {
															// Decode Base64 → HTML string
															const decodedHtml = decodeURIComponent(
																escape(atob(cleanedData))
															);

															// Create a new Blob and URL
															const blob = new Blob([decodedHtml], {
																type: "text/html",
															});
															const url = URL.createObjectURL(blob);

															// Open in a new tab
															window.open(url, "_blank");

															// Optional: cleanup after a short delay
															setTimeout(() => URL.revokeObjectURL(url), 5000);
														} catch (error) {
															console.error(
																"Failed to decode or open Base64 HTML:",
																error
															);
														}
													}}
													disabled={!gotReport}
												>
													<HiEye className="text-lg m2-1" />
													View Report
												</button>
											</div>
										</div>
									</div>
								}
							/>
							<DifficultyCards
								difficulty_cache={difficultyCache}
								sessionId={sessionId}
							/>
							<div className="bg-gray-50 rounded-lg border border-sky-200 p-4">
								<h2 className="text-base font-semibold text-sky-700 mb-3 flex items-center gap-2">
									<div className="w-1 h-5 bg-sky-700 rounded-full"></div>
									Endpoints
								</h2>

								<div className="space-y-3">
									{/* Send endpoint */}
									<div className="flex items-start gap-3">
										<div className="mt-0.5">
											<BiSend className="w-4 h-4 text-sky-600" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-medium text-gray-600 mb-1">
												Send your calls to:
											</p>
											<code className="block px-3 py-2 bg-white border border-sky-200 rounded text-xs text-sky-700 font-mono break-all">
												{GetRequestEndpoint(
													cacheSessionData.domain,
													cacheSessionData.version,
													cacheSessionData.npType
												)}
												/<span className="text-amber-600">&lt;action&gt;</span>
											</code>
										</div>
									</div>

									{/* Receive endpoint */}
									<div className="flex items-start gap-3">
										<div className="mt-0.5">
											<BiServer className="w-4 h-4 text-sky-600" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-medium text-gray-600 mb-1">
												You will receive calls at:
											</p>
											<code className="block px-3 py-2 bg-white border border-sky-200 rounded text-xs text-sky-700 font-mono break-all">
												{subUrl}/
												<span className="text-amber-600">&lt;action&gt;</span>
											</code>
										</div>
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="bg-white rounded-lg shadow-sm border border-sky-100 p-6">
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
								{/* Content skeleton */}
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<div className="h-3 rounded skeleton"></div>
										<div className="h-3 rounded w-4/5 skeleton"></div>
									</div>
									<div className="space-y-2">
										<div className="h-3 rounded skeleton"></div>
										<div className="h-3 rounded w-3/5 skeleton"></div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Main Content Area */}
				<div className="flex flex-1 w-full">
					{/* Left Column - Main Content */}
					<div className="w-full sm:w-[60%] overflow-y-auto p-4">
						<FilterFlowsMenu flowTags={flowTags} setSelectedTags={setSelectedTags} selectedTags={selectedTags}/>
						<div className="mb-8 bg-gray-100 p-4 rounded-md border flex-1">
							{filteredFlows.map((flow: any) => (
								<Accordion
									key={flow.id}
									flow={flow}
									activeFlow={activeFlow}
									sessionId={sessionId}
									setActiveFlow={setActiveFlow}
									sessionCache={cacheSessionData}
									setSideView={setSideView}
									subUrl={subUrl}
									onFlowStop={() => setIsFlowStopped(true)}
									onFlowClear={() => handleClearFlow()}
								/>
							))}
						</div>
					</div>

					{/* Right Column - Sticky Request & Response */}
					<div className="w-full sm:w-[40%] p-4">
						{/* Sticky Container */}
						<div className=" bg-gray-100 rounded-md shadow-md border sticky top-20">
							{/* <h2 className="m-1 text-lg font-semibold">Request & Response</h2> */}
							<Tabs
								className="mt-4 ml-2"
								options={[
									{ key: "Request", label: "Request" },
									{ key: "Response", label: "Response" },
									{
										key: "Metadata",
										label: (
											<div className="flex items-center gap-1.5">
												<span>Metadata</span>
												<span
													className="inline-flex items-center px-1 py-0.5 min-w-[2rem] justify-center rounded-full text-[10px] font-medium bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border border-yellow-300 shadow-sm"
													role="status"
													aria-label="Beta release"
												>
													Beta
												</span>
											</div>
										),
									},
									{
										key: "Guide",
										label: "Guide",
									},
								]}
								onSelectOption={(value: string) => {
									setSelectedTab(value as "Request" | "Response" | "Metadata");
								}}
								defaultTab="Request"
							/>

							<div className="p-2">
								{cacheSessionData ? (
									<div
										className="rounded-md overflow-auto"
										style={{ maxHeight: "500px" }} // Adjust maxHeight as needed
									>
										{selectedTab === "Metadata" ? (
											<div className="bg-gray-800 rounded-lg p-4">
												{Object.keys(metadata).length > 0 ? (
													<table className="w-full text-sm border-collapse">
														<thead>
															<tr className="border-b border-gray-700">
																<th className="text-left py-2 px-3 text-gray-300 font-medium">
																	Field Name
																</th>
																<th className="text-left py-2 px-3 text-gray-300 font-medium">
																	Value
																</th>
															</tr>
														</thead>
														<tbody>
															{Object.entries(metadata).map(
																([key, data]: [string, any], index) => (
																	<tr
																		key={index}
																		className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
																	>
																		<td className="py-2 px-3 text-gray-400">
																			{key}
																		</td>
																		<td className="py-2 px-3 text-gray-200 whitespace-pre-wrap break-words">
																			{typeof data.value === "object" &&
																			data.value !== null
																				? JSON.stringify(data.value, null, 2)
																				: String(data.value)}
																		</td>
																	</tr>
																)
															)}
														</tbody>
													</table>
												) : (
													<div className="text-center py-8">
														<p className="text-gray-400 mb-3">
															No metadata available
														</p>
													</div>
												)}
											</div>
										) : (
											<JsonView
												value={
													selectedTab === "Request"
														? requestData
														: selectedTab === "Response"
															? responseData
															: {}
												}
												style={githubDarkTheme}
												className="rounded-md"
												displayDataTypes={false}
											/>
										)}
									</div>
								) : (
									<Loader />
								)}
								{selectedTab === "Guide" && (
									<FlowHelperTab
										domain={cacheSessionData?.domain}
										version={cacheSessionData?.version}
										npType={cacheSessionData?.npType}
									/>
								)}
							</div>
							{/* helper guide section */}
						</div>
					</div>
				</div>
			</div>
		</SessionContext.Provider>
	);
}

export default RenderFlows;
