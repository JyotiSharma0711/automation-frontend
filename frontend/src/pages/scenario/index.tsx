import { useState, useEffect, useLayoutEffect, useMemo, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import RenderFlows from "@components/DomainFlowRunner/RenderFlows";
import Alert from "@components/Shadcn/Alert";
import Card from "@components/Shadcn/Card";
import Accordion from "@components/Shadcn/Accordion";
import { ReportPage } from "@pages/scenario/ReportPage";
import { GetRequestEndpoint } from "@components/DomainFlowRunner/utils/get-request-endpoint";
import { useSession } from "@hooks/useSession";
import { trackEvent } from "@utils/analytics";
import { useWorkbenchFlows } from "@hooks/useWorkbenchFlow";
import { IDomain } from "@pages/schema-validation/types";
import { Flow } from "@/types/flow-types";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    pruneExpiredSessions,
    setSessions,
    type IFlowTestingSessionEntry,
} from "@store/slices/sessionHistorySlice";
import { setScenarioSession } from "@store/slices/supportSessionSlice";
import { PreviousSessionsPanel } from "@pages/scenario/PreviousSessionPanel";
import { IPreviousSessionItem } from "@pages/scenario/types";
import {
    useLazyGetScenarioFormDataQuery,
    useLazyGetScenarioPreferencesQuery,
    useCreateSessionMutation,
    usePutCacheDataMutation,
    useLazyGetSessionByIdQuery,
} from "@store/api";
import { useAuth } from "@hooks/useAuth";
import { useGitHubLogin } from "@hooks/useGitHubLogin";
import { IScenarioFormData, ISessionResponse, ISavedPrefAPI } from "@pages/scenario/types";
import { openSessionInNewTab } from "@pages/scenario/helpers";
import NewSessionForm from "@pages/scenario/NewSessionForm";
import { LoginGate } from "@pages/scenario/LoginGate";
import Spinner from "@components/Shadcn/Spinner";
import { SCENARIO_GUIDE_STEPS, SCENARIO_TIP_BANNER_MESSAGE } from "@pages/scenario/constants";
import { Button } from "@components/Shadcn/Button";
import { ROUTES } from "@constants/routes";

const Scenario = () => {
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
    } = useWorkbenchFlows();
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const [domains, setDomains] = useState<IDomain[]>([]);
    const { sessionId: contextSessionId } = useSession();
    const { user, token, isAuthLoading } = useAuth();
    const { startLogin, isLoginRedirecting } = useGitHubLogin();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dispatch = useAppDispatch();

    const storedSessions = useAppSelector((state) => state.sessionHistory.sessions);
    const existingSessions = useMemo<IPreviousSessionItem[]>(
        () =>
            [...storedSessions].sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ),
        [storedSessions]
    );
    const setExistingSessions = (sessions: IFlowTestingSessionEntry[]) =>
        dispatch(setSessions(sessions));
    const [isInitializing, setIsInitializing] = useState(true);
    const [isTipVisible, setIsTipVisible] = useState(true);
    const [savedPreferences, setSavedPreferences] = useState<Record<string, IScenarioFormData>>({});
    const initialSavedConfigKey = searchParams.get("config") ?? "";
    const [triggerGetScenarioFormData] = useLazyGetScenarioFormDataQuery();
    const [triggerGetScenarioPreferences] = useLazyGetScenarioPreferencesQuery();
    const [createSession] = useCreateSessionMutation();
    const [putCacheData] = usePutCacheDataMutation();
    const [triggerGetSessionById] = useLazyGetSessionByIdQuery();

    const createAndOpenSession = async (data: IScenarioFormData, newTab = true) => {
        try {
            data = {
                ...data,
                subscriberUrl: data?.subscriberUrl?.replace(/\/+$/, ""),
            };

            const response = await createSession({
                ...data,
                orgId: data.orgId || undefined,
                userId: user?.username,
                difficulty_cache: {
                    stopAfterFirstNack: true,
                    timeValidations: true,
                    protocolValidations: true,
                    useGateway: true,
                    headerValidaton: true,
                },
            }).unwrap();
            const sessionID = response.sessionId;
            dispatch(setScenarioSession(response.sessionId));
            const currentUrl = window.location.origin;
            const newTabUrl = `${currentUrl}/flow-testing?sessionId=${sessionID}&subscriberUrl=${encodeURIComponent(data.subscriberUrl)}&role=${data.npType}`;
            if (newTab) {
                const newWindow = window.open(newTabUrl, "_blank");
                if (!newWindow) {
                    toast.error(
                        "Your browser blocked the popup. Please allow popups for this site and try again."
                    );
                }
            } else {
                window.location.href = newTabUrl;
            }
        } catch (e) {
            toast.error("Error while creating session");
            console.error("error while sending response", e);
        }
    };

    const onSubmit = async (data: IScenarioFormData) => {
        try {
            if (
                data.subscriberUrl.trim() === "https://testing" ||
                data.subscriberUrl.trim() === "http://testing"
            ) {
                const dataCopy = JSON.parse(JSON.stringify(data)) as IScenarioFormData;
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

    const onSubmitHandler = async (data: IScenarioFormData) => {
        trackEvent({
            category: "SCHEMA_VALIDATION-FORM",
            action: "Form submitted",
        });
        setIsFormSubmitted(true);
        await onSubmit(data);
        setIsFormSubmitted(false);
    };

    useEffect(() => {
        dispatch(pruneExpiredSessions());

        let cancelled = false;

        const initFormData = async () => {
            setIsInitializing(true);
            try {
                try {
                    const result = await triggerGetScenarioFormData();
                    if (cancelled) return;
                    setDomains(result.data?.domain || []);
                } catch (e) {
                    console.error("error while fetching form field data", e);
                    if (!cancelled) setDomains([]);
                }

                if (!token) {
                    if (!cancelled) setSavedPreferences({});
                    return;
                }

                try {
                    // unwrap() rejects on error; avoids applying stale cache data after logout
                    const raw = (await triggerGetScenarioPreferences().unwrap()) as
                        | Record<string, ISavedPrefAPI>
                        | undefined;
                    if (cancelled) return;
                    if (!raw) {
                        setSavedPreferences({});
                        return;
                    }

                    const mapped: Record<string, IScenarioFormData> = {};
                    Object.entries(raw).forEach(([key, val]) => {
                        mapped[key] = {
                            subscriberUrl: val.subscriber_url,
                            domain: val.domain,
                            version: val.version,
                            usecaseId: val.usecase_id,
                            npType: val.np_type,
                            env: val.env,
                            orgId: val.org_id,
                        };
                    });
                    setSavedPreferences(mapped);
                } catch {
                    console.warn("Could not fetch saved preferences, possibly not logged in");
                    if (!cancelled) setSavedPreferences({});
                }
            } finally {
                if (!cancelled) setIsInitializing(false);
            }
        };

        void initFormData();
        return () => {
            cancelled = true;
        };
    }, [token, dispatch, triggerGetScenarioFormData, triggerGetScenarioPreferences]);

    const fetchSessionData = (sessId: string) => {
        triggerGetSessionById({ sessionId: sessId })
            .unwrap()
            .then((data) => {
                const response = data as unknown as ISessionResponse;
                if (response.flowConfigs) {
                    setFlows(Object.values(response.flowConfigs) as Flow[]);
                }
                setSubscriberUrl(response.subscriberUrl);
                setSession(sessId);

                const step = response.activeStep;
                setFlowStepNum(step === 0 || step === 1 || step === 2 ? step : 0);
            })
            .catch((e: unknown) => {
                console.error("Error while fetching session: ", e);
            });
    };

    const newSession = () => {
        setIsFormSubmitted(false);
        setFlowStepNum(0);
    };

    const handleCreateConfigClick = () => {
        if (user) {
            navigate(ROUTES.PROFILE);
            return;
        }

        startLogin(ROUTES.PROFILE);
    };

    useEffect(() => {
        if (contextSessionId && !isFormSubmitted) {
            fetchSessionData(contextSessionId);
        }
    }, [contextSessionId, isFormSubmitted]);

    useEffect(() => {
        if (session) {
            putCacheData({ data: { activeStep: flowStepNum }, sessionId: session });
        }
    }, [flowStepNum, session]);

    // Open at the top on refresh so the tip alert is in view: the browser's native
    // scroll restoration fires after mount and would re-scroll to the old position,
    // so disable it while this page is mounted. On unmount, reset to the browser
    // default ("auto") rather than a captured previous value — after a refresh here
    // the entry is already "manual", and restoring that would leak manual mode to
    // every other page in the tab.
    useLayoutEffect(() => {
        if (!("scrollRestoration" in window.history)) {
            return;
        }
        window.history.scrollRestoration = "manual";
        window.scrollTo({ top: 0, left: 0 });
        return () => {
            window.history.scrollRestoration = "auto";
        };
    }, []);

    // Render via a switch expression (not a nested component) so parent
    // re-renders — e.g. isFormSubmitted toggling — don't remount the form
    // and wipe local state like showManualForm.
    let body: ReactNode;
    switch (flowStepNum) {
        case 1:
            body = !flows ? (
                <Spinner />
            ) : (
                <RenderFlows
                    flows={flows}
                    subUrl={subscriberUrl}
                    sessionId={session}
                    newSession={newSession}
                />
            );
            break;
        case 2:
            body = !session ? (
                <Spinner />
            ) : (
                <ReportPage sessionId={session} report={report} setStep={setFlowStepNum} />
            );
            break;
        case 0:
        default:
            body = (
                <div className="flex w-full flex-col gap-6">
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(280px,2fr)_minmax(0,3fr)]">
                        <Accordion title="Scenario Testing" steps={SCENARIO_GUIDE_STEPS} />

                        <Card
                            title="Create a new Session"
                            description="Fill the details to begin flow testing."
                            headerAction={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCreateConfigClick}
                                    isLoading={isLoginRedirecting}
                                    disabled={isInitializing || isLoginRedirecting}
                                >
                                    Create profile config
                                </Button>
                            }
                        >
                            {isInitializing ? (
                                <div className="flex items-center justify-center">
                                    <Spinner />
                                </div>
                            ) : (
                                <LoginGate
                                    isLoggedOut={!user && !isAuthLoading}
                                    isLoginRedirecting={isLoginRedirecting}
                                    onLogin={() => startLogin(ROUTES.SCENARIO)}
                                >
                                    <NewSessionForm
                                        domains={domains}
                                        savedPreferences={savedPreferences}
                                        initialSavedConfigKey={initialSavedConfigKey}
                                        isSubmitting={isFormSubmitted}
                                        onSubmit={onSubmitHandler}
                                    />
                                </LoginGate>
                            )}
                        </Card>
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
            );
    }

    return (
        <div className="w-full">
            <div className="mx-auto px-5 sm:px-8 md:px-10 lg:px-15 xl:px-20 py-6">
                {isTipVisible && (
                    <Alert
                        variant="warning"
                        message={SCENARIO_TIP_BANNER_MESSAGE}
                        onClose={() => setIsTipVisible(false)}
                        className="mb-6"
                    />
                )}
                {body}
            </div>
        </div>
    );
};

export default Scenario;
