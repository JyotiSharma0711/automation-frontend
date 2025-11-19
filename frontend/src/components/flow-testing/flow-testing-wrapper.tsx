import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import RenderFlows from "./render-flows";
import { Flow } from "../../types/flow-types";

export default function FlowTestingWrapper() {
	const [searchParams] = useSearchParams();
	const [flows, setFlows] = useState<Flow[]>([]);
	const [loading, setLoading] = useState(true);
	// const [_, setReport] = useState("");
	// const [__, setFlowStepNum] = useState(1);

	const sessionId = searchParams.get("sessionId");
	const subscriberUrl = searchParams.get("subscriberUrl");
	const role = searchParams.get("role");

	const fetchSessionData = useCallback(async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/sessions`,
				{
					params: {
						session_id: sessionId,
					},
				}
			);

			if (response.data.flowConfigs) {
				setFlows(Object.values(response.data.flowConfigs));
			} else {
				toast.error("No flow configurations found in session");
			}
		} catch (error: any) {
			console.error("Error fetching session data:", error);
			toast.error("Failed to load session data");
		} finally {
			setLoading(false);
		}
	}, [sessionId]);

	useEffect(() => {
		if (!sessionId || !subscriberUrl || !role) {
			toast.error("Missing required parameters for flow testing");
			setLoading(false);
			return;
		}

		// Fetch session data to get flows
		fetchSessionData();
	}, [sessionId, subscriberUrl, role, fetchSessionData]);

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600 mx-auto mb-4"></div>
					<h2 className="text-xl font-semibold text-gray-800 mb-2">
						Loading Flow Session
					</h2>
					<p className="text-gray-600">
						Fetching session data for flow testing...
					</p>
				</div>
			</div>
		);
	}

	if (!sessionId || !subscriberUrl || !role) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-500 mb-4">
						<svg
							className="w-16 h-16 mx-auto"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-gray-800 mb-2">
						Invalid Flow Session
					</h2>
					<p className="text-gray-600">
						Missing required parameters. Please create a new flow session from
						the playground.
					</p>
				</div>
			</div>
		);
	}

	if (flows.length === 0) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-amber-500 mb-4">
						<svg
							className="w-16 h-16 mx-auto"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-gray-800 mb-2">
						No Flows Found
					</h2>
					<p className="text-gray-600">
						No flow configurations found for this session.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="p-4">
				<RenderFlows
					flows={flows}
					subUrl={decodeURIComponent(subscriberUrl)}
					sessionId={sessionId}
					// setStep={setFlowStepNum}
					// setReport={setReport}
				/>
			</div>
		</div>
	);
}
