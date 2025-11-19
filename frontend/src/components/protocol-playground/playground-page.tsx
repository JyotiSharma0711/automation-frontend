import { useContext, useEffect, useState } from "react";
import { PlaygroundContext } from "./context/playground-context";
import Popup from "../ui/pop-up/pop-up";
import { PlaygroundRightTabType } from "./types";
import { LeftSideView } from "./ui/LeftSideView";
import { RightSideView } from "./ui/RightSideView";
import { useConfigOperations } from "./hooks/use-config";
import { PlaygroundHeader } from "./ui/playground-upper/playground-header";
import { useModalHandlers } from "./hooks/use-modal";
import { usePlaygroundActions } from "./hooks/use-playground-actions";
import FullPageLoader from "../ui/mini-components/fullpage-loader";
import { ActionTimeline } from "./ui/playground-upper/merged-sequcence";
import ViewOnlyPlaygroundPage from "./view-only-page";

// ===== MAIN COMPONENT =====
export default function PlaygroundPage() {
	const playgroundContext = useContext(PlaygroundContext);

	const { activeApi, setActiveApi } = playgroundContext;

	const {
		exportConfig,
		importConfig,
		clearConfig,
		runConfig,
		runCurrentConfig,
		createFlowSession,
	} = useConfigOperations();

	const handleBack = () => {
		playgroundContext.setCurrentConfig(undefined);
	};
	const { addAction, deleteAction, updateAction } = usePlaygroundActions();
	const { popupOpen, openModal, closeModal, popupContent } =
		playgroundContext.useModal;
	const modalHandlers = useModalHandlers({
		activeApi,
		setActiveApi,
		openModal,
		closeModal,
		addAction,
		deleteAction,
		updateAction,
		clearConfig,
		config: playgroundContext.config,
	});

	const [activeRightTab, setActiveRightTab] =
		useState<PlaygroundRightTabType>("session");

	const isTransactionViewerActive = activeRightTab === "transaction";
	const leftPanelWidth = isTransactionViewerActive ? "w-[30%]" : "w-1/2";
	const rightPanelWidth = isTransactionViewerActive ? "w-[70%]" : "w-1/2";

	const [devMode, setDevMode] = useState<boolean>(true);
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const devMode: string | null = urlParams.get("devMode");
		console.log("Dev mode:", devMode);
		if (devMode && devMode === "false") {
			console.log("Dev mode is disabled");
			setDevMode(false);
		}
	}, []);

	if (!devMode) {
		return (
			<div>
				<ViewOnlyPlaygroundPage />;
				<Popup isOpen={popupOpen} onClose={closeModal}>
					{popupContent}
				</Popup>
				{playgroundContext.loading && <FullPageLoader />}
			</div>
		);
	}

	return (
		<div className="w-full h-screen min-h-screen flex flex-col">
			<div>
				<PlaygroundHeader
					domain={playgroundContext.config?.meta.domain || "N/A"}
					version={playgroundContext.config?.meta.version || "N/A"}
					flowId={playgroundContext.config?.meta.flowId || "N/A"}
					onExport={exportConfig}
					onImport={importConfig}
					onClear={modalHandlers.showDeleteConfirmation}
					onRun={async () => {
						await runConfig();
					}}
					onCreateFlowSession={createFlowSession}
					onRunCurrent={async () => {
						await runCurrentConfig();
					}}
					onBack={handleBack}
				/>
				<ActionTimeline
					steps={playgroundContext.config?.steps || []}
					transactionHistory={
						playgroundContext.config?.transaction_history || []
					}
					activeApi={activeApi}
					onApiSelect={setActiveApi}
					onAddAction={modalHandlers.showAddAction}
					onEditAction={modalHandlers.showEditAction}
					onDeleteAction={modalHandlers.deleteAction}
					onAddBefore={modalHandlers.addActionBefore}
					onAddAfter={modalHandlers.addActionAfter}
				/>
			</div>
			<div className="flex gap-4 h-full mt-1 max-h-[82vh]">
				<LeftSideView width={leftPanelWidth} activeApi={activeApi} />
				<RightSideView
					width={rightPanelWidth}
					activeRightTab={activeRightTab}
					setActiveRightTab={setActiveRightTab}
					activeApi={activeApi}
				/>
			</div>
			<Popup isOpen={popupOpen} onClose={closeModal}>
				{popupContent}
			</Popup>
			{playgroundContext.loading && <FullPageLoader />}
		</div>
	);
}
