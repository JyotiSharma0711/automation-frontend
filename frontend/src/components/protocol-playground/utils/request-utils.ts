import {
	convertToFlowConfig,
	MockPlaygroundConfigType,
	createOptimizedMockConfig,
} from "@ondc/automation-mock-runner";
import { SessionCache } from "../../../types/session-types";
import axios from "axios";
import { toast } from "react-toastify";

export async function createFlowSessionWithPlayground(
	config: MockPlaygroundConfigType,
	subscriberUrl: string,
	type: "BAP" | "BPP"
): Promise<string | undefined> {
	try {
		const flowConfig = convertToFlowConfig(config);
		const newSession: SessionCache = {
			transactionIds: [],
			flowMap: {},
			subscriberUrl: subscriberUrl,
			npType: type,
			domain: config.meta.domain,
			version: config.meta.version,
			usecaseId: "PLAYGROUND-FLOW",
			env: "LOGGED-IN",
			sessionDifficulty: {
				sensitiveTTL: false,
				useGateway: false,
				stopAfterFirstNack: false,
				protocolValidations: true,
				timeValidations: true,
				headerValidaton: true,
				useGzip: false,
			},
			flowConfigs: {
				[flowConfig.id]: flowConfig,
			},
			activeFlow: null,
		};
		const backendUrl = import.meta.env.VITE_BACKEND_URL;
		const finalUrl = `${backendUrl}/sessions/playground`;
		const body = {
			sessionData: newSession,
			playgroundConfig: await createOptimizedMockConfig(config),
		};
		const res = await axios.post(finalUrl, body);
		return res.data.sessionId;
	} catch (err) {
		toast.error("Error creating playground session");
		console.error("Error creating playground session:", err);
		return undefined;
	}
}
