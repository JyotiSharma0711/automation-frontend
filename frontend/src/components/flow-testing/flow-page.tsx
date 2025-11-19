import { useState, useEffect, useRef } from "react";
import axios from "axios";
import RenderFlows from "./render-flows";
import { toast } from "react-toastify";
import { ReportPage } from "./report";
import { FormGuide } from "./guides";
import InitialFlowForm from "./initial-form";
import NotFound from "../ui/not-found";
import { useSession } from "../../context/context";
import { putCacheData } from "../../utils/request-utils";
import { trackEvent } from "../../utils/analytics";
import { useWorkbenchFlows } from "../../hooks/useWorkbenchFlow";
import { LuHistory } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export default function FlowContent() {
	const {
		flowStepNum,
		setFlowStepNum,
		session,
		setSession,
		subscriberUrl,
		setSubscriberUrl,
		flows,
		setFlows,
		report,
		// setReport,
	} = useWorkbenchFlows();
	const [isFormSubmitted, setIsFormSubmitted] = useState(false);
	const [dynamicList, setDynamicList] = useState<{
		domain: any[];
		version: any[];
		usecase: any[];
	}>({
		domain: [],
		version: [],
		usecase: [],
	});
	const [dynamicValue, setDyanmicValue] = useState({
		domain: "",
		version: "",
		usecaseId: "",
		subscriberUrl: "",
		npType: "BAP",
		env: "STAGING",
	});
	const formData = useRef({
		domain: "",
		version: "",
		usecaseId: "",
		subscriberUrl: "",
		npType: "BAP",
		env: "STAGING",
	});
	const {
		sessionId: contextSessionId,
		setSessionId,
	} = useSession();
	const navigate = useNavigate();

	const onSubmit = async (data: any) => {
		try {
			console.log("data", data);
			data = {
				...data,
				subscriberUrl: data?.subscriberUrl?.replace(/\/+$/, ""),
			};
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/sessions`,
				{
					...data,
					difficulty_cache: {
						stopAfterFirstNack: true,
						timeValidations: true,
						protocolValidations: true,
						useGateway: true,
						headerValidaton: true,
						totalDifficulty: 100,
					},
				}
			);
			setSubscriberUrl(data.subscriberUrl);
			console.log("response", response.data);
			const localData =
				JSON.parse(localStorage.getItem("sessionIdForSupport") as string) || {};
			localStorage.setItem(
				"sessionIdForSupport",
				JSON.stringify({
					scenarioSession: response.data.sessionId,
					...localData,
				})
			);
			setSession(response.data.sessionId);
			setSessionId(response.data.sessionId);
			setFlowStepNum(1);
		} catch (e) {
			toast.error("Error while creating session");
			console.error("error while sending response", e);
		}
	};
	const fetchFlows = async (data: any) => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/config/flows`,
				{
					params: {
						domain: data.domain,
						version: data.version,
						usecase: data.usecaseId,
						options: ["WORKBENCH"],
					},
				}
			);
			setFlows(response.data.data.flows);
			console.log("flows", response.data);
		} catch (e) {
			console.log("error while fetching flows", e);
		}
	};

  const onSubmitHandler = async (data: any) => {
    trackEvent({
      category: "SCHEMA_VALIDATION-FORM",
      action: "Form submitted",
    })
    setIsFormSubmitted(true);
    await fetchFlows(data);
    await onSubmit(data);
  };

	const fetchFormFieldData = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/config/senarioFormData`
			);
			setDynamicList((prev) => {
				return { ...prev, domain: response.data.domain || [] };
			});
			console.log("form field data", response.data);
		} catch (e) {
			console.log("error while fetching form field data", e);
		}
	};

	useEffect(() => {
		fetchFormFieldData();
	}, []);

	function fetchSessionData(sessId: string) {
		console.log("get got working");
		axios
			.get(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
				params: {
					session_id: sessId,
				},
			})
			.then((response: any) => {
				console.log("get got working???");
				if (response.data.flowConfigs) {
					setFlows(Object.values(response.data.flowConfigs));
				}
				setSubscriberUrl(response.data.subscriberUrl);
				setSession(sessId);
				console.log("Setting strep get got", response.data.activeStep);
				setFlowStepNum(response.data.activeStep);
			})
			.catch((e: any) => {
				console.error("Error while fetching session: ", e);
			});
	}

	const newSession = () => {
		formData.current = {
			domain: "",
			version: "",
			usecaseId: "",
			subscriberUrl: "",
			npType: "BAP",
			env: "STAGING",
		};
		setFlowStepNum(0);
	};

	useEffect(() => {
		if (contextSessionId && !isFormSubmitted) {
			fetchSessionData(contextSessionId);
		}
	}, [contextSessionId, isFormSubmitted]);

	// useEffect(() => {
	// 	setFlowStepNum(0);
	// 	setIsFormSubmitted(false);
	// }, [type]);

	useEffect(() => {
		if (session) {
			putCacheData({ activeStep: flowStepNum }, session);
		}
	}, [flowStepNum, session]);

	const Body = () => {
		switch (flowStepNum) {
			case 0:
				return (
					<div className="flex flex-1 w-full">
						<div className="sm:w-[60%] p-2 bg-white rounded-sm border">
							<div className="mb-4">
							<div className="flex items-center justify-between">
								{/* Left side: heading + optional beta tag */}
								<div className="flex items-center gap-2">
									<h1 className="text-lg font-semibold mb-2">
									{"Scenario testing"}
									</h1>
								</div>

								<button
								onClick={() => navigate("/history")}
								className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition shadow-sm"
								>
									<LuHistory className="w-6 h-6 text-white" />
									<span className="font-medium text-lg">Past Sessions</span>
								</button>

								</div>
								<p className="text-gray-600 text-sm">
									Please fill in the details below to begin flow testing.
								</p>
							</div>
							<InitialFlowForm
								formData={formData}
								onSubmitHandler={onSubmitHandler}
								dynamicList={dynamicList}
								setDyanmicValue={setDyanmicValue}
								dynamicValue={dynamicValue}
								setDynamicList={setDynamicList}
							/>
						</div>
						<div className="w-full sm:w-[40%] ml-1">
							<FormGuide />
						</div>
					</div>
				);
			case 1:
				if (!flows) return <h1>Loading...</h1>;
				return (
					<RenderFlows
						flows={flows}
						subUrl={subscriberUrl}
						sessionId={session}
						// setStep={setFlowStepNum}
						// setReport={setReport}
						newSession={newSession}
					/>
				);
			case 2:
				if (!session) return <h1>Loading...</h1>;
				return (
					<ReportPage
						sessionId={session}
						report={report}
						setStep={setFlowStepNum}
					/>
				);
			default:
				return <NotFound />;
		}
	};
	return (
		<>
			<div className="w-full items-center">
				<div className="p-2 mt-2">
					<Body />
				</div>
			</div>
		</>
	);
}
