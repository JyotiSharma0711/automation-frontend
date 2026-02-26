import { useState, useEffect, useRef } from "react";
import { LuHistory } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import axios, { AxiosResponse, AxiosError } from "axios";
import { toast } from "react-toastify";

import RenderFlows from "@components/FlowShared/render-flows";
import { ReportPage } from "@components/FlowShared/report";
import { FormGuide, GetRequestEndpoint } from "@components/FlowShared/guides";
import InitialFlowForm from "@components/FlowShared/initial-form";
import NotFound from "@components/ui/not-found";
import { useSession } from "@context/context";
import { putCacheData } from "@utils/request-utils";
import { trackEvent } from "@utils/analytics";
import { useWorkbenchFlows } from "@hooks/useWorkbenchFlow";
// import { sessionIdSupport } from "@utils/localStorageManager";
import { ROUTES } from "@constants/routes";
import { Domain, DomainVersion } from "@/pages/schema-validation/types";
import { Flow } from "@/types/flow-types";
import { sessionIdSupport } from "@/utils/localStorageManager";
import {
    PreviousSessionItem,
    PreviousSessionsPanel,
} from "@/pages/scenario/components/previous-sessions-panel";

type DomainVersionWithUsecase = DomainVersion & {
    usecase: string[];
};

interface ScenarioFormData {
    domain: string;
    version: string;
    usecaseId: string;
    subscriberUrl: string;
    npType: string;
    env: string;
}

interface SessionResponse {
    sessionId: string;
    flowConfigs?: Record<string, Flow>;
    subscriberUrl: string;
    activeStep: number;
}

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
        domain: Domain[];
        version: DomainVersionWithUsecase[];
        usecase: string[];
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
    const { sessionId: contextSessionId } = useSession();
    const navigate = useNavigate();

    const [existingSessions, setExistingSessions] = useState<PreviousSessionItem[]>([]);

    const createAndOpenSession = async (data: ScenarioFormData, newTab = true) => {
        try {
            data = {
                ...data,
                subscriberUrl: data?.subscriberUrl?.replace(/\/+$/, ""),
            };
            const response = await axios.post<{ sessionId: string }>(
                `${import.meta.env.VITE_BACKEND_URL}/sessions`,
                {
                    ...data,
                    difficulty_cache: {
                        stopAfterFirstNack: true,
                        timeValidations: true,
                        protocolValidations: true,
                        useGateway: true,
                        headerValidaton: true,
                    },
                }
            );
            const sessionID = response.data.sessionId;
            sessionIdSupport.setScenarioSession(response.data.sessionId);
            // Open flow session in new tab
            const currentUrl = window.location.origin;
            const newTabUrl = `${currentUrl}/flow-testing?sessionId=${sessionID}&subscriberUrl=${encodeURIComponent(data.subscriberUrl)}&role=${data.npType}`;
            if (newTab) {
                window.open(newTabUrl, "_blank");
            } else {
                window.location.href = newTabUrl;
            }
        } catch (e) {
            toast.error("Error while creating session");
            console.error("error while sending response", e);
        }
    };

    const onSubmit = async (data: ScenarioFormData) => {
        try {
            if (
                data.subscriberUrl.trim() === "https://testing" ||
                data.subscriberUrl.trim() === "http://testing"
            ) {
                const dataCopy = JSON.parse(JSON.stringify(data)) as ScenarioFormData;
                dataCopy.npType = "BPP";
                dataCopy.subscriberUrl = GetRequestEndpoint(data.domain, data.version, "BAP");
                await createAndOpenSession(dataCopy);
                dataCopy.npType = "BAP";
                dataCopy.subscriberUrl = GetRequestEndpoint(data.domain, data.version, "BPP");
                await createAndOpenSession(dataCopy);
                return;
            }
            await createAndOpenSession(data, false);
        } catch (err) {
            console.error("Error in onSubmit: ", err);
        }
    };
    const fetchFlows = async (data: ScenarioFormData) => {
        try {
            const response = await axios.get<{ data: { flows: Flow[] } }>(
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
        } catch (e) {
            console.error("error while fetching flows", e);
        }
    };

    const onSubmitHandler = async (data: ScenarioFormData) => {
        trackEvent({
            category: "SCHEMA_VALIDATION-FORM",
            action: "Form submitted",
        });
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
        } catch (e) {
            console.error("error while fetching form field data", e);
        }
    };

    useEffect(() => {
        fetchFormFieldData();
        const storedSessions = localStorage.getItem("flowTestingSessions");
        if (storedSessions) {
            setExistingSessions(JSON.parse(storedSessions));
        }
    }, []);

    function fetchSessionData(sessId: string) {
        axios
            .get<SessionResponse>(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
                params: {
                    session_id: sessId,
                },
            })
            .then((response: AxiosResponse<SessionResponse>) => {
                if (response.data.flowConfigs) {
                    setFlows(Object.values(response.data.flowConfigs) as Flow[]);
                }
                setSubscriberUrl(response.data.subscriberUrl);
                setSession(sessId);

                setFlowStepNum(response.data.activeStep);
            })
            .catch((e: AxiosError) => {
                console.error("Error while fetching session: ", e);
            });
    }

    const newSession = () => {
        // formData.current = {
        //   domain: "",
        //   version: "",
        //   usecaseId: "",
        //   subscriberUrl: "",
        //   npType: "BAP",
        //   env: "STAGING",
        // };

        setIsFormSubmitted(false);
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
                        <div className="sm:w-[60%] p-2 rounded-sm border bg-white">
                            <div className="rounded-2xl border border-sky-100 bg-white overflow-hidden">
                                <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-sky-500">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <h1 className="font-semibold text-white text-base leading-tight">
                                                    Create a new Session
                                                </h1>
                                                <p className="text-sky-200 text-xs mt-0.5">
                                                    Fill the details to begin flow testing.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate(ROUTES.HISTORY)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-md font-medium transition-colors"
                                        >
                                            <LuHistory className="w-4 h-4 text-white" />
                                            <span>Past Reports</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="px-4 py-4 bg-slate-50/40">
                                    <InitialFlowForm
                                        formData={formData}
                                        onSubmitHandler={onSubmitHandler}
                                        dynamicList={dynamicList}
                                        setDyanmicValue={setDyanmicValue}
                                        dynamicValue={dynamicValue}
                                        setDynamicList={setDynamicList}
                                    />
                                </div>
                            </div>
                            <PreviousSessionsPanel
                                sessions={existingSessions}
                                onSessionsChange={setExistingSessions}
                                onOpenSession={(selectedSession) =>
                                    openSessionInNewTab(
                                        selectedSession.sessionId,
                                        selectedSession.subscriberUrl,
                                        selectedSession.role
                                    )
                                }
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
                return <ReportPage sessionId={session} report={report} setStep={setFlowStepNum} />;
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

function openSessionInNewTab(sessionId: string, subscriberUrl: string, role: string) {
    const currentUrl = window.location.origin;
    const newTabUrl = `${currentUrl}/flow-testing?sessionId=${sessionId}&subscriberUrl=${encodeURIComponent(subscriberUrl)}&role=${role}`;
    window.open(newTabUrl, "_blank");
}
