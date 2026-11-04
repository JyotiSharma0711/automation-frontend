import { type ReactNode } from "react";
import { Navigate, Route, Routes as RouterRoutes } from "react-router-dom";
import SchemaValidationPage from "@pages/schema-validation";
import SellerOnboarding from "@pages/seller-onboarding";
import UserProfile from "@pages/user-profile";
import ConfigsSection from "@pages/user-profile/ConfigsSection";
import PastReportsSection from "@pages/user-profile/PastReportsSection";
import ActivityHistorySection from "@pages/user-profile/ActivityHistorySection";
import McpKeySection from "@pages/user-profile/McpKeySection";
import AccountSection from "@pages/user-profile/AccountSection";
import HistoryPage from "@pages/history";
import ProtocolPlayGround from "@pages/protocol-playground";
// import DBBackOffice from "@pages/db-back-office";
import FlowTestingWrapper from "@pages/flow-testing";
import McpSessionPage from "@pages/mcp-session";
import TrackPage from "@pages/track";
import NotFoundPage from "@components/NotFound";
import ScenarioPage from "@pages/scenario";
import HomePage from "@pages/home";
import SupportPage from "@pages/support";
// import SellerLoadTesting from "@pages/seller-load-testing";
// import AuthHeader from "@pages/auth-header";
import FrameworkHealthPage from "@pages/framework-health";
import { ROUTES } from "@constants/routes";
import DeveloperGuideFlowPage from "@pages/developer-guide/DeveloperGuideFlowPage";
import DeveloperGuideShell from "@pages/developer-guide/layout/DeveloperGuideShell";
import DeveloperGuideGettingStartedContent from "@pages/developer-guide/layout/DeveloperGuideGettingStartedContent";
import DeveloperGuideAuthToolsContent from "@pages/developer-guide/layout/DeveloperGuideAuthToolsContent";
import DeveloperGuideGeneralContent from "@pages/developer-guide/layout/DeveloperGuideGeneralContent";
import DeveloperGuideDomainsContent from "@pages/developer-guide/layout/DeveloperGuideDomainsContent";
import DeveloperGuideDocContent from "@pages/developer-guide/layout/DeveloperGuideDocContent";
import ValidationsPage from "@pages/developer-guide/ValidationsPage";
import { isDevGuideEnabled } from "@/types/environment";
import DashboardShell from "@pages/business-dashboard/shell";
import BusinessOverview from "@pages/business-dashboard/pages/overview";
import BusinessSessions from "@pages/business-dashboard/pages/sessions";
import BusinessParticipants from "@pages/business-dashboard/pages/participants";
import BusinessReports from "@pages/business-dashboard/pages/reports";
import BusinessExport from "@pages/business-dashboard/pages/export";
import PageReveal from "./page-reveal";

const page = (children: ReactNode) => <PageReveal>{children}</PageReveal>;

const Routes = () => (
    <RouterRoutes>
        <Route path={ROUTES.HOME} element={page(<HomePage />)} />
        <Route path={ROUTES.SUPPORT} element={page(<SupportPage />)} />
        <Route path={ROUTES.SCHEMA} element={page(<SchemaValidationPage />)} />
        {/*  Scenario Page Route  is the go to flow testing page with np form*/}
        <Route path={ROUTES.SCENARIO} element={page(<ScenarioPage />)} />
        {/* ROUTES.FLOW_TESTING is for Flow testing through URL parameters not via scenario testing page */}
        <Route path={ROUTES.FLOW_TESTING} element={page(<FlowTestingWrapper />)} />
        {/* Read-only viewer for a session on an ondc-mcp engine. Reached only
            by the link that engine hands out, so it has no nav entry — and
            unguarded like FLOW_TESTING, because the token in the link is what
            authorises the reader against their own engine, not against us. */}
        <Route path={ROUTES.MCP_SESSION} element={page(<McpSessionPage />)} />
        {/* Public live ride map. Reached only by the link the provider puts in
            message.tracking.url on on_track, so it has no nav entry — and it is
            unguarded on purpose: the link is what a rider is given, and holding
            it is what lets them watch. Renders without workbench chrome. */}
        <Route path={ROUTES.TRACK} element={page(<TrackPage />)} />
        <Route path={ROUTES.PROFILE} element={<UserProfile />}>
            <Route index element={page(<ConfigsSection />)} />
            <Route path="past-reports" element={page(<PastReportsSection />)} />
            <Route path="history" element={page(<ActivityHistorySection />)} />
            <Route path="mcp-key" element={page(<McpKeySection />)} />
            <Route path="account" element={page(<AccountSection />)} />
        </Route>
        <Route path={ROUTES.SELLER_ONBOARDING} element={page(<SellerOnboarding />)} />
        <Route path={ROUTES.PLAYGROUND} element={page(<ProtocolPlayGround />)} />
        <Route path={ROUTES.HISTORY} element={page(<HistoryPage />)} />
        {/* <Route path={ROUTES.DB_BACK_OFFICE} element={page(<DBBackOffice />)} /> */}
        {/* <Route path={ROUTES.AUTH_HEADER} element={page(<AuthHeader />)} /> */}
        {/* <Route path={ROUTES.SELLER_LOAD_TESTING} element={page(<SellerLoadTesting />)} /> */}
        {/* <Route path={ROUTES.FRAMEWORK_HEALTH} element={page(<FrameworkHealthPage />)} /> */}
        <Route path={ROUTES.LIVE_HEALTHCHECK_STATUS} element={page(<FrameworkHealthPage />)} />
        {/* Business dashboard. The shell owns its data providers and its own
            shared-password gate; the backend enforces the session regardless. */}
        <Route path={ROUTES.BUSINESS} element={<DashboardShell />}>
            <Route index element={<BusinessOverview />} />
            <Route path="sessions" element={<BusinessSessions />} />
            <Route path="participants" element={<BusinessParticipants />} />
            <Route path="reports" element={<BusinessReports />} />
            <Route path="export" element={<BusinessExport />} />
        </Route>
        {isDevGuideEnabled ? (
            <>
                <Route path={ROUTES.DEVELOPER_GUIDE} element={<DeveloperGuideShell />}>
                    <Route
                        index
                        element={
                            <Navigate
                                to={`${ROUTES.DEVELOPER_GUIDE_GETTING_STARTED}#understanding-ondc`}
                                replace
                            />
                        }
                    />
                    <Route
                        path="getting-started"
                        element={page(<DeveloperGuideGettingStartedContent />)}
                    />
                    <Route path="general" element={page(<DeveloperGuideGeneralContent />)} />
                    <Route path="domains" element={page(<DeveloperGuideDomainsContent />)} />
                    <Route path="auth-tools" element={page(<DeveloperGuideAuthToolsContent />)} />
                    <Route path="docs/:slug" element={page(<DeveloperGuideDocContent />)} />
                    <Route
                        path=":domain/:version/:useCase"
                        element={page(<DeveloperGuideFlowPage />)}
                    />
                </Route>
                <Route
                    path={ROUTES.DEVELOPER_GUIDE_VALIDATIONS}
                    element={page(<ValidationsPage />)}
                />
            </>
        ) : null}
        <Route path="*" element={page(<NotFoundPage />)} />
    </RouterRoutes>
);

export default Routes;
