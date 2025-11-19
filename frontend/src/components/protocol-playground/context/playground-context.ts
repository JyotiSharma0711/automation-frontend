import {
	ExecutionResult,
	MockPlaygroundConfigType,
} from "@ondc/automation-mock-runner";
import { Context, createContext } from "react";
import { WorkbenchFlowType } from "../../../hooks/useWorkbenchFlow";
import { SavedConfigMetadata } from "../utils/config-storage";
interface PlaygroundContextProps {
	config: MockPlaygroundConfigType | undefined;
	setCurrentConfig: (config: MockPlaygroundConfigType | undefined) => void;
	dirtyConfig: boolean;
	setDirtyConfig: React.Dispatch<React.SetStateAction<boolean>>;
	currentState: "editing" | "running";
	setCurrentState: React.Dispatch<React.SetStateAction<"editing" | "running">>;
	updateStepMock: (stepId: string, property: string, value: string) => void;
	activeApi: string | undefined;
	setActiveApi: React.Dispatch<React.SetStateAction<string | undefined>>;
	activeTerminalData: ExecutionResult[];
	setActiveTerminalData: React.Dispatch<
		React.SetStateAction<ExecutionResult[]>
	>;
	updateTransactionHistory: (
		actionId: string,
		newPayload: any,
		savedInfo?: any
	) => void;

	resetTransactionHistory: (actionId?: string) => void;

	useModal: {
		popupOpen: boolean;
		popupContent: JSX.Element | null;
		openModal: (content: JSX.Element) => void;
		closeModal: () => void;
	};
	loading: boolean;
	setLoading: React.Dispatch<React.SetStateAction<boolean>>;
	workbenchFlow: WorkbenchFlowType;

	// Config management methods
	loadSavedConfig: (configId: string) => boolean;
	getSavedConfigs: () => SavedConfigMetadata[];
	deleteSavedConfig: (configId: string) => boolean;
	loadConfigFromGist: (gistUrl: string) => Promise<boolean>;
}
export const PlaygroundContext: Context<PlaygroundContextProps> =
	createContext<PlaygroundContextProps>({} as PlaygroundContextProps);
