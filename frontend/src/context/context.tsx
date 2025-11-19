import {
	createContext,
	ReactNode,
	useContext,
	useState,
	Dispatch,
	SetStateAction,
} from "react";
import { SessionCache } from "../types/session-types";

interface SessionContextProps {
	sessionId: string;
	setSessionId: Dispatch<SetStateAction<string>>;
	activeFlowId: string | null;
	setActiveFlowId?: Dispatch<SetStateAction<string | null>>;
	sessionData: SessionCache | null | undefined;
	setSessionData?: Dispatch<SetStateAction<SessionCache | null>>;
	selectedTab: "Request" | "Response" | "Metadata" | "Guide";
	setSelectedTab?: Dispatch<
		SetStateAction<"Request" | "Response" | "Metadata" | "Guide">
	>;
	requestData: any;
	setRequestData: Dispatch<SetStateAction<any>>;
	responseData: any;
	setResponseData: Dispatch<SetStateAction<any>>;
	sideView: any;
	setSideView: React.Dispatch<React.SetStateAction<any>>;
	metadata: any;
	setMetadata: React.Dispatch<React.SetStateAction<any>>;
	setActiveCallClickedToggle: React.Dispatch<React.SetStateAction<boolean>>;
	activeCallClickedToggle: boolean,
}

export const SessionContext = createContext<SessionContextProps | undefined>(
	undefined
);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
	const [sessionId, setSessionId] = useState<string>("");
	const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
	const [sessionData, setSessionData] = useState<SessionCache | null>(null);
	const [selectedTab, setSelectedTab] = useState<
		"Request" | "Response" | "Metadata" | "Guide"
	>("Request");
	const [requestData, setRequestData] = useState<any>(null);
	const [responseData, setResponseData] = useState<any>(null);
	const [activeCallClickedToggle, setActiveCallClickedToggle] = useState<boolean>(false)
	const [sideView, setSideView] = useState<any>(null);
	const [metadata, setMetadata] = useState<any>(null);

	return (
		<SessionContext.Provider
			value={{
				sessionId,
				setSessionId,
				activeFlowId,
				setActiveFlowId,
				sessionData,
				setSessionData,
				selectedTab,
				setSelectedTab,
				requestData,
				setRequestData,
				setActiveCallClickedToggle,
				activeCallClickedToggle,
				responseData,
				setResponseData,
				sideView, // 👈 optional if you also want to read it
				setSideView, // 👈 fixes missing prop
				metadata, // 👈 optional
				setMetadata,
			}}
		>
			{children}
		</SessionContext.Provider>
	);
};

export const useSession = () => {
	const ctx = useContext(SessionContext);
	if (!ctx) throw new Error("useSession must be used inside SessionProvider");
	return ctx;
};
