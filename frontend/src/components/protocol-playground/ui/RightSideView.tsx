import { Editor, OnMount } from "@monaco-editor/react";
import { PLAYGROUND_RIGHT_TABS, PlaygroundRightTabType } from "../types";
import { useContext, useEffect, useRef, useState } from "react";
import { PlaygroundContext } from "../context/playground-context";
import SessionDataTab from "./session-data-tab";
import { ExecutionResults } from "./extras/terminal";
import OutputPayloadViewer from "./extras/output-payload-viewer";
import MockRunner from "@ondc/automation-mock-runner";
import { editorUtils } from "../utils/editor-utils";
import { mockRunnerExtensions } from "../utils/mock-runner-extentions";

export function RightSideView(props: {
	width: string;
	activeRightTab: PlaygroundRightTabType;
	setActiveRightTab: (tab: PlaygroundRightTabType) => void;
	activeApi: string | undefined;
}) {
	const { width, activeRightTab, setActiveRightTab } = props;

	return (
		<div
			className={`border rounded-md ${width} flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
		>
			<div className="flex border-b bg-gray-50 items-center h-8">
				{PLAYGROUND_RIGHT_TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveRightTab(tab.id)}
						className={`px-4 py-2 font-medium transition-colors ${
							activeRightTab === tab.id
								? "bg-white border-b-2 border-sky-500 text-sky-600"
								: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>
			<div className="flex-1 p-4 overflow-auto max-h-[82vh]">
				<GetRightSideContent
					tabId={activeRightTab}
					actionId={props.activeApi}
				/>
			</div>
		</div>
	);
}

function GetRightSideContent({
	tabId,
	actionId,
}: {
	tabId: string;
	actionId: string | undefined;
}) {
	const playgroundContext = useContext(PlaygroundContext);
	const [sessionData, setSessionData] = useState<any>({});
	// const [savedMeta, setSaveMeta] = useState<any>({});
	const savedMetaRef = useRef<any>({}); // Add this ref

	useEffect(() => {
		const meta = mockRunnerExtensions.getSaveDataMeta(
			playgroundContext.activeApi,
			playgroundContext.config
		);
		// setSaveMeta(meta);
		savedMetaRef.current = meta; // Update ref whenever savedMeta changes
		console.log("updated savedMeta", meta);

		getSessionData().then((data) => setSessionData(data));
	}, [playgroundContext.config, playgroundContext.activeApi]);

	const index =
		playgroundContext.config?.steps.findIndex(
			(step) => step.action_id === actionId
		) ?? 0;
	const activePayload =
		playgroundContext.config?.transaction_history.find(
			(f) => f.action_id === actionId
		)?.payload || undefined;

	const getSessionData = async () => {
		try {
			if (!playgroundContext.config) {
				return JSON.stringify(
					{
						error: "No configuration available",
						timestamp: new Date().toISOString(),
					},
					null,
					2
				);
			}

			const mockRunner = new MockRunner(playgroundContext.config as any);
			const sessionData = await mockRunner.getSessionDataUpToStep(index);
			console.log("Session Data:", sessionData);
			return JSON.stringify(sessionData, null, 2);
		} catch (error: any) {
			const errorInfo = {
				error: "Failed to generate session data",
				message: error?.message || "Unknown error occurred",
				type: error?.name || "Error",
				step: index,
				actionId: actionId,
				timestamp: new Date().toISOString(),
			};

			try {
				return JSON.stringify(errorInfo, null, 2);
			} catch (stringifyError) {
				// Fallback if even error serialization fails
				return JSON.stringify(
					{
						error: "Critical error - unable to serialize data",
						originalError: String(error),
						timestamp: new Date().toISOString(),
					},
					null,
					2
				);
			}
		}
	};

	const handleOnMount: OnMount = (editor, monaco) => {
		console.log("✅ Editor mounted successfully");
		const modelUri = editor.getModel()?.uri.toString();
		// check if hover provider is already registered
		if ((window as any).__jsonHoverProviderDisposable) {
			console.log("♻️ Disposing existing JSON hover provider");
			(window as any).__jsonHoverProviderDisposable.dispose();
		}

		const disposable = monaco.languages.registerHoverProvider("json", {
			provideHover: (model, position) => {
				if (modelUri !== model.uri.toString()) {
					return null;
				}

				try {
					console.log("config", playgroundContext);

					const word = model.getWordAtPosition(position);
					if (!word) return null;
					const jsonText = model.getValue();
					const jsonPath = editorUtils.getJsonPath(
						jsonText,
						position.lineNumber,
						position.column
					);
					const firstKey = jsonPath.split(".")[1].split("[")[0];
					// Use ref instead of state
					const currentSavedMeta = savedMetaRef.current;
					if (
						!currentSavedMeta ||
						!firstKey ||
						!(firstKey in currentSavedMeta)
					) {
						console.log("❌ No metadata for:", firstKey, currentSavedMeta);
						return null;
					}
					const metaInfo = currentSavedMeta[firstKey];
					return {
						range: new monaco.Range(
							position.lineNumber,
							word.startColumn,
							position.lineNumber,
							word.endColumn
						),
						contents: [
							{ value: `last modified at: **${metaInfo.actionId}**` },
							{ value: `**from:** \`${metaInfo.path}\`` },
							{ value: `ref: sessionData[${firstKey}]` },
						],
					};
				} catch (e) {
					console.error("Error in hover provider:", e);
					return null;
				}
			},
		});

		// Save the disposable globally (or in React ref)
		(window as any).__jsonHoverProviderDisposable = disposable;
	};

	switch (tabId) {
		case "session":
			return (
				<Editor
					key={`${actionId}-${tabId}`}
					theme="dark-skyblue"
					onMount={handleOnMount}
					height="100%"
					language="json"
					value={sessionData}
					options={{
						padding: { top: 16, bottom: 16 },
						fontSize: 16,
						lineNumbers: "on",
						scrollBeyondLastLine: true,
						automaticLayout: true,
						formatOnPaste: true,
						formatOnType: true,
						readOnly: true,
					}}
				/>
			);
		case "transaction":
			return <SessionDataTab />;
		case "terminal":
			return (
				<ExecutionResults results={playgroundContext.activeTerminalData} />
			);
		case "output_payload":
			return (
				<OutputPayloadViewer payload={activePayload} actionId={actionId} />
			);
	}
	return <></>;
}
