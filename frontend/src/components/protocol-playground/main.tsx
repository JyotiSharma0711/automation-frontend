import { useEffect, useState, useCallback } from "react";
import { PlaygroundContext } from "./context/playground-context";

import GetPlaygroundComponent from "./starter-page";
import { usePlaygroundModals } from "./hooks/use-playground-modal";

import { toast } from "react-toastify";
import MockRunner, {
	ExecutionResult,
	MockPlaygroundConfigType,
} from "@ondc/automation-mock-runner";
import { useWorkbenchFlows } from "../../hooks/useWorkbenchFlow";
import RenderFlows from "../flow-testing/render-flows";
import {
	saveConfig,
	loadConfig,
	getSavedConfigsMetadata,
	deleteConfig,
	SavedConfigMetadata,
	saveGistConfig,
} from "./utils/config-storage";
import { fetchGistData, getFirstGistFile } from "./utils/fetch-gist";

export default function ProtocolPlayGround() {
	const [playgroundState, setPlaygroundState] = useState<
		MockPlaygroundConfigType | undefined
	>(undefined);
	const [currentState, setCurrentState] = useState<"editing" | "running">(
		"editing"
	);
	const [loading, setLoading] = useState(false);
	const [activeApi, setActiveApi] = useState<string | undefined>(undefined);
	const [activeTerminalData, setActiveTerminalData] = useState<
		ExecutionResult[]
	>([]);
	const [dirtyConfig, setDirtyConfig] = useState(true);

	// Auto-save function
	const autoSaveConfig = useCallback((config: MockPlaygroundConfigType) => {
		if (config && config.meta) {
			const { domain, version, flowId } = config.meta;
			// Auto-save to the new storage system
			saveConfig(domain, version, flowId, config);
		}
	}, []);

	function setCurrentConfig(config: MockPlaygroundConfigType | undefined) {
		if (!config) {
			localStorage.removeItem("playgroundConfig");
			setPlaygroundState(undefined);
			return;
		}
		setPlaygroundState(config);
		localStorage.setItem("playgroundConfig", JSON.stringify(config));

		// Auto-save whenever config is set/updated
		autoSaveConfig(config);
	}

	const updateStepMock = (stepId: string, property: string, value: string) => {
		const current = playgroundState;
		if (!current) return;
		if (
			property === "generate" ||
			property === "validate" ||
			property === "requirements"
		) {
			value = MockRunner.encodeBase64(value);
		} else {
			try {
				value = JSON.parse(value);
			} catch (e) {
				console.error("Invalid JSON value:", e);
				return;
			}
		}
		const newSteps = current.steps.map((step) => {
			if (step.action_id === stepId) {
				return {
					...step,
					mock: {
						...step.mock,
						[property]: value,
					},
				};
			}
			return step;
		});
		const newConfig = {
			...current,
			steps: newSteps,
		};
		setCurrentConfig(newConfig);
	};

	const updateTransactionHistory = (
		actionId: string,
		newPayload: any,
		savedInfo?: any
	) => {
		const current = playgroundState;
		if (!current) return;
		const historyEntry = {
			action_id: actionId,
			payload: newPayload,
			saved_info: savedInfo || {},
		};
		current.transaction_history.push(historyEntry);
		setCurrentConfig({ ...current });
	};

	// Reset transaction history (optionally from a specific action ID)
	const resetTransactionHistory = (actionId?: string) => {
		const current = playgroundState;
		if (!current) return;
		if (actionId === undefined) {
			current.transaction_history = [];
		} else {
			const index = current.transaction_history.findIndex(
				(entry) => entry.action_id === actionId
			);
			if (index === -1) {
				toast.error("Action ID not found in transaction history");
				return;
			}
			current.transaction_history = current.transaction_history.slice(0, index);
		}
		setCurrentConfig({ ...current });
	};

	// Config management functions

	const loadSavedConfig = (configId: string): boolean => {
		const savedConfig = loadConfig(configId);
		if (savedConfig) {
			setCurrentConfig(savedConfig.config);
			toast.success(
				`Loaded config: ${savedConfig.domain}_${savedConfig.version}_${savedConfig.flowId}`
			);
			return true;
		} else {
			toast.error("Failed to load config");
			return false;
		}
	};

	const getSavedConfigs = (): SavedConfigMetadata[] => {
		return getSavedConfigsMetadata();
	};

	const deleteSavedConfig = (configId: string): boolean => {
		const success = deleteConfig(configId);
		if (success) {
			toast.success("Config deleted successfully");
		} else {
			toast.error("Failed to delete config");
		}
		return success;
	};

	const loadConfigFromGist = useCallback(
		async (gistUrl: string): Promise<boolean> => {
			try {
				const gistResult = await fetchGistData(gistUrl);
				if (!gistResult.success || !gistResult.data) {
					toast.error(gistResult.error || "Failed to fetch gist");
					return false;
				}

				const firstFile = getFirstGistFile(gistResult.data);
				if (!firstFile) {
					toast.error("No files found in gist");
					return false;
				}

				const config = JSON.parse(firstFile.content);
				const isValid = new MockRunner(config).validateConfig();
				if (!isValid.success) {
					toast.error(
						`Invalid config in gist: ${isValid.errors?.join(", ") || ""}`
					);
					return false;
				}
				// Always create a new config instead of replacing current
				// Save gist config with gist_ prefix (will overwrite if same gist URL)
				const saveSuccess = saveGistConfig(gistUrl, config);
				if (saveSuccess) {
					toast.success(
						`Config loaded and saved from gist: ${config.meta.domain}_${config.meta.version}_${config.meta.flowId}`
					);
				}

				// Set as current config
				setCurrentConfig(config);
				return true;
			} catch (error) {
				toast.error(
					"Failed to parse config from gist check console for details"
				);
				console.error("Gist loading error:", error);
				return false;
			}
		},
		[]
	);

	// Check for gist parameter in URL on component mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const gistParam = urlParams.get("gist");

		if (gistParam) {
			loadConfigFromGist(gistParam);
			// Remove the gist parameter from URL after loading
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete("gist");
			window.history.replaceState({}, "", newUrl.toString());
		} else {
			// try to load from local storage only if no gist parameter
			const savedConfig = localStorage.getItem("playgroundConfig");
			if (savedConfig) {
				try {
					const parsedConfig = JSON.parse(savedConfig);
					setPlaygroundState(parsedConfig);
				} catch (e) {
					console.error("Failed to parse saved config:", e);
				}
			}
		}
	}, [loadConfigFromGist]);

	// Auto-save whenever playgroundState changes
	useEffect(() => {
		if (playgroundState) {
			autoSaveConfig(playgroundState);
		}
	}, [playgroundState, autoSaveConfig]);

	const workbenchFlow = useWorkbenchFlows();

	// const Body = () => {
	// 	switch (workbenchFlow.flowStepNum) {
	// 		case 0:
	// 			return <GetPlaygroundComponent />;
	// 		case 1:
	// 			return (
	// 				<RenderFlows
	// 					flows={workbenchFlow.flows}
	// 					subUrl={workbenchFlow.subscriberUrl}
	// 					sessionId={workbenchFlow.session}
	// 					type={"SCENARIO"}
	// 					setStep={workbenchFlow.setFlowStepNum}
	// 					setReport={workbenchFlow.setReport}
	// 				/>
	// 			);
	// 	}
	// };

	return (
		<PlaygroundContext.Provider
			value={{
				config: playgroundState,
				setCurrentConfig: setCurrentConfig,
				currentState,
				setCurrentState,
				dirtyConfig,
				setDirtyConfig,
				updateStepMock,
				activeApi,
				setActiveApi,
				activeTerminalData,
				setActiveTerminalData,
				useModal: usePlaygroundModals(),
				updateTransactionHistory,
				resetTransactionHistory,
				loading,
				setLoading,
				workbenchFlow,
				loadSavedConfig,
				getSavedConfigs,
				deleteSavedConfig,
				loadConfigFromGist,
			}}
		>
			<div className="mt-2 w-full min-h-screen flex flex-1 flex-col">
				<Body workbenchFlow={workbenchFlow} />
			</div>
		</PlaygroundContext.Provider>
	);
}

const Body = ({
	workbenchFlow,
}: {
	workbenchFlow: ReturnType<typeof useWorkbenchFlows>;
}) => {
	switch (workbenchFlow.flowStepNum) {
		case 0:
			return <GetPlaygroundComponent />;
		case 1:
			return (
				<RenderFlows
					flows={workbenchFlow.flows}
					subUrl={workbenchFlow.subscriberUrl}
					sessionId={workbenchFlow.session}
					// setStep={workbenchFlow.setFlowStepNum}
					// setReport={workbenchFlow.setReport}
				/>
			);
		default:
			return null;
	}
};
