import type {
    Control,
    FieldErrors,
    UseFormHandleSubmit,
    UseFormRegister,
    UseFormWatch,
} from "react-hook-form";
import type { IDomain } from "@pages/schema-validation/types";
import type { IPastReport } from "@/types/apiShared/userProfile";
export interface IProfileCounts {
    configs: number;
    pastReports: number;
    history: number;
}

export type ProfileCountKey = "configs" | "pastReports" | "history";

export interface IProfileNavItem {
    label: string;
    to: string;
    countKey?: ProfileCountKey;
}

export interface IProfileSidebarProps {
    username?: string;
    avatarUrl?: string;
    counts: IProfileCounts;
}

export interface IProfilePageHeaderProps {
    title: string;
    subtitle: string;
    badgeCount?: number;
}

export type TagBadgeVariant = "domain" | "version" | "npType" | "usecase" | "env";

export interface ITagBadgeProps {
    label: string;
    variant: TagBadgeVariant;
}

export interface IProgressBarProps {
    label: string;
    pct: number;
}

export interface ScenarioPreferences {
    configName: string;
    subscriberUrl: string;
    domain: string;
    version: string;
    usecaseId: string;
    npType: string;
    env: string;
    orgId: string;
}

export interface ScenarioPreferencesAPI {
    subscriber_url: string;
    domain: string;
    version: string;
    usecase_id: string;
    np_type: string;
    env: string;
    org_id?: string;
}

export type IDomainVersionWithUsecase = {
    key: string;
    usecase: string[];
};

export interface IConfigCardProps {
    configKey: string;
    config: ScenarioPreferences;
    isEditing: boolean;
    flowDescription?: string;
    onEdit: (key: string) => void;
    onDelete: (key: string) => void;
    onLaunch: (key: string) => void;
}

export interface IUseConfigFlowDescriptionsResult {
    descriptions: Record<string, string | undefined>;
    isLoading: boolean;
}

export type { FlowCategorySummary, FlowSummary, IPastReport } from "@/types/apiShared/userProfile";

export interface IPastReportCardProps {
    report: IPastReport;
    isViewing: boolean;
    onView: (testId: string) => void;
    flowDescription?: string;
}

export type FlowStatus = "PASS" | "FAIL" | "RUN" | "NOT_RUN";

export interface IFlowRow {
    id: string;
    name: string;
    type: string;
    status: FlowStatus;
}

export interface FlowSummaryEntry {
    total: number;
    completed: number;
}

export interface SessionFlow {
    id: string;
    status: "PENDING" | "COMPLETED";
    payloads?: string[];
}

export interface Session {
    sessionId: string;
    reportExists: boolean;
    createdAt: string;
    domain?: string;
    version?: string;
    usecaseId?: string;
    userId?: string | null;
    flows?: SessionFlow[];
    flowSummary?: Record<string, FlowSummaryEntry> | null;
    flowMap?: Record<string, "PASS" | "FAIL"> | null;
}

export interface IHistorySessionAccordionItemProps {
    session: Session;
    isExpanded: boolean;
    onViewReport: (sessionId: string) => void;
    viewingId: string | null;
    subscriberUrl: string;
    npType: string;
}

export interface IHistorySessionHeaderProps {
    session: Session;
    lastRunText: string;
    reportablePct: number;
    mandatoryPct: number;
    optionalPct: number;
    isResumeDisabled: boolean;
    hasPayloads: boolean;
    downloadingLogs: boolean;
    onResume: (e: React.MouseEvent) => void;
    onDownloadLogs: (e: React.MouseEvent) => void;
}

export interface IActivityHistoryAccordionProps {
    sessions: Session[];
    expandedId: string | undefined;
    onExpandedChange: (value: string | undefined) => void;
    onViewReport: (sessionId: string) => void;
    viewingId: string | null;
    subscriberUrl: string;
    npType: string;
}

export interface ISessionFlowsTableProps {
    flowRows: IFlowRow[];
    reportExists: boolean;
    sessionId: string;
    viewingId: string | null;
    onViewReport: (sessionId: string) => void;
}

export interface IHistoryFilterComboBoxProps {
    items: string[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    className?: string;
}

export interface IHistorySubscriberComboBoxProps {
    items: string[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    className?: string;
    onEnter?: () => void;
}

export interface IScenarioFormRegister {
    register: UseFormRegister<ScenarioPreferences>;
    errors: FieldErrors<ScenarioPreferences>;
}

export interface INewConfigFormProps {
    control: Control<ScenarioPreferences>;
    register: UseFormRegister<ScenarioPreferences>;
    errors: FieldErrors<ScenarioPreferences>;
    watch: UseFormWatch<ScenarioPreferences>;
    handleSubmit: UseFormHandleSubmit<ScenarioPreferences>;
    onSubmit: (data: ScenarioPreferences) => Promise<void>;
    editingKey: string | null;
    isSaving: boolean;
    savedPrefs: Record<string, ScenarioPreferences>;
    domainOptions: string[];
    versionOptions: string[];
    usecaseOptions: string[];
    handleDomainChange: () => void;
    handleVersionChange: () => void;
    onCancelEdit: () => void;
}

export interface IScenarioTestConfigSectionProps {
    configs: Record<string, ScenarioPreferences>;
    editingKey: string | null;
    onEdit: (key: string) => void;
    onDelete: (key: string) => void;
    onLaunch: (key: string) => void;
}

export interface IScenarioPreferencesFormState {
    domains: IDomain[];
    savedPrefs: Record<string, ScenarioPreferences>;
    isSaving: boolean;
    isDeleting: boolean;
    isFetching: boolean;
    editingKey: string | null;
}

export interface IMcpConsentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isSubmitting: boolean;
    /** The server has moved past the consent version this build bundles. */
    isConsentStale: boolean;
}

export interface IMcpKeyRevealDialogProps {
    /** The plaintext key. Non-null only while the reveal is open. */
    keyValue: string | null;
    expiresAt: string | null;
    onDone: () => void;
}
