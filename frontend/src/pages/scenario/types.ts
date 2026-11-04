import { ReactNode } from "react";
import {
    Control,
    FieldErrors,
    FieldValues,
    UseFormHandleSubmit,
    UseFormRegister,
    UseFormWatch,
} from "react-hook-form";
import { IDomain, IDomainVersion } from "@pages/schema-validation/types";
import { Flow } from "@/types/flow-types";
import type { ComboBoxOptionInput } from "@components/Shadcn/ComboBox/combo-box-options";

export type INewSessionFormValues = IScenarioFormData & {
    config?: string;
};

export type INewSessionFormProps = {
    domains: IDomain[];
    savedPreferences?: Record<string, IScenarioFormData>;
    initialSavedConfigKey?: string;
    isSubmitting?: boolean;
    onSubmit: (data: IScenarioFormData) => Promise<void>;
};

export type ISavedConfigPanelProps = {
    savedConfigKeys: string[];
    selectedSavedConfigKey: string;
    selectedSavedConfig?: IScenarioFormData;
    savedUsecaseId: string;
    savedConfigUsecaseOptions: string[];
    savedOrgId: string;
    isSavedOrgLocked: boolean;
    isSubmitting: boolean;
    onConfigKeyChange: (key: string) => void;
    onUsecaseChange: (usecaseId: string) => void;
    onOrgChange: (orgId: string) => void;
    onSubmit: () => void;
    onFillManually: () => void;
};

export type IManualSessionFormProps = {
    domains: IDomain[];
    hasSavedPrefs: boolean;
    isLoggedIn: boolean;
    isSubmitting: boolean;
    control: Control<INewSessionFormValues>;
    register: UseFormRegister<INewSessionFormValues>;
    errors: FieldErrors<INewSessionFormValues>;
    handleSubmit: UseFormHandleSubmit<INewSessionFormValues>;
    watch: UseFormWatch<INewSessionFormValues>;
    versionOptions: string[];
    usecaseOptions: string[];
    // configOptions: string[];
    onFormSubmit: (data: INewSessionFormValues) => Promise<void>;
    onBackToSavedConfigs: () => void;
    onDomainChange: (domain: string) => void;
    onVersionChange: (version: string) => void;
    onConfigChange: (config: string) => void;
};

export type IDomainVersionWithUsecase = IDomainVersion & {
    usecase: string[];
};

export interface IScenarioFormData {
    domain: string;
    version: string;
    usecaseId: string;
    subscriberUrl: string;
    npType: string;
    env: string;
    /** NP Portal organisation the session is for; only set for ONDC logins. */
    orgId?: string;
}

export interface ISessionResponse {
    sessionId: string;
    flowConfigs?: Record<string, Flow>;
    subscriberUrl: string;
    activeStep: number;
}

export type ISavedPrefAPI = {
    subscriber_url: string;
    domain: string;
    version: string;
    usecase_id: string;
    np_type: string;
    env: string;
    org_id?: string;
};

export type ILocalSessionHistoryCardProps = {
    sessionId: string;
    subscriberUrl: string;
    role: string;
    onOpen: () => void;
};

export type IPreviousSessionItem = {
    sessionId: string;
    subscriberUrl: string;
    role: string;
    timestamp: string;
    expiresAt: string;
};

export type IPreviousSessionsPanelProps = {
    sessions: IPreviousSessionItem[];
    onOpenSession: (session: IPreviousSessionItem) => void;
    onSessionsChange?: (sessions: IPreviousSessionItem[]) => void;
};

export type ILocationSessionHistoryProps = {
    sessions: IPreviousSessionItem[];
    onOpenSession: (session: IPreviousSessionItem) => void;
    onSessionsChange?: (sessions: IPreviousSessionItem[]) => void;
    sessionsPerPage?: number;
};

export type IDomainVersionUsecaseFields = Pick<
    IScenarioFormData,
    "domain" | "version" | "usecaseId"
> &
    FieldValues;

export type IDomainVersionUsecaseFieldsProps<
    T extends IDomainVersionUsecaseFields = INewSessionFormValues,
> = {
    control: Control<T>;
    versionOptions: string[];
    usecaseOptions: string[];
    watchedDomain: string;
    watchedVersion: string;
    onDomainChange?: (domain: string) => void;
    onVersionChange: (version: string) => void;
    domainOptions?: ComboBoxOptionInput[];
};

export type ISessionFormActionsProps = {
    isSubmitting: boolean;
    submitType?: "submit" | "button";
    submitDisabled?: boolean;
    onSubmit?: () => void;
    extraActions?: ReactNode;
    className?: string;
};
