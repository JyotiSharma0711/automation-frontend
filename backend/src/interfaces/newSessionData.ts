import { Flow } from "./flowConfigData";

export type TransactionId = string;
export type FlowId = string;
export type PayloadId = string;

export type SessionDifficulty = {
    sensitiveTTL: boolean;
    useGateway: boolean;
    stopAfterFirstNack: boolean;
    protocolValidations: boolean;
    timeValidations: boolean;
    headerValidaton: boolean;
    encryptionValidation?: boolean;
    useCare?: boolean;
    useTunnelForFIS?: boolean;
    useGzip: boolean;
};

export type Expectation = {
    sessionId: string;
    flowId: string;
    expectedAction?: string;
    expireAt: string;
};

export interface ApiData {
    action: string;
    payloadId: string;
    messageId: string;
    response: any;
    timestamp: string;
}

export interface TransactionCache {
    sessionId?: string;
    flowId?: string;
    latestAction: string;
    latestTimestamp: string;
    type: "default" | "manual";
    messageIds: string[];
    apiList: ApiData[];
}

export interface SubscriberCache {
    activeSessions: Expectation[];
}

export interface SessionCache {
    // against session_id
    transactionIds: string[];
    flowMap: Record<FlowId, TransactionId | undefined>;
    npType: "BAP" | "BPP";
    domain: string;
    version: string;
    subscriberId?: string;
    subscriberUrl: string;
    usecaseId: string;
    env: "STAGING" | "PRE-PRODUCTION" | "LOGGED-IN";
    sessionDifficulty: SessionDifficulty;
    flowConfigs: Record<FlowId, Flow>;
    activeFlow: null | string;
    activeStep: number;
    userId?: string;
    /** NP Portal organisation the session is run for (Login via ONDC only). */
    orgId?: string;
}
