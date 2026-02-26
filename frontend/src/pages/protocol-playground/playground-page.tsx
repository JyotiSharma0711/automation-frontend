import { useContext, useEffect, useState } from "react";

import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import Popup from "@components/ui/pop-up/pop-up";
import { PlaygroundRightTabType } from "@pages/protocol-playground/types";
import { LeftSideView } from "@pages/protocol-playground/ui/LeftSideView";
import { RightSideView } from "@pages/protocol-playground/ui/RightSideView";
import { useConfigOperations } from "@pages/protocol-playground/hooks/use-config";
import { PlaygroundHeader } from "@pages/protocol-playground/ui/playground-upper/playground-header";
import { useModalHandlers } from "@pages/protocol-playground/hooks/use-modal";
import { usePlaygroundActions } from "@pages/protocol-playground/hooks/use-playground-actions";
import FullPageLoader from "@components/ui/mini-components/fullpage-loader";
import { ActionTimeline } from "@pages/protocol-playground/ui/playground-upper/merged-sequcence";
import ViewOnlyPlaygroundPage from "@pages/protocol-playground/view-only-page";
import { FaEdit } from "react-icons/fa";
import MockRunner, { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { toast } from "react-toastify";
import { RawConfigEditorModal } from "@pages/protocol-playground/ui/raw-config-editor-modal";

const PlaygroundPage = () => {
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
    const { popupOpen, openModal, closeModal, popupContent } = playgroundContext.useModal;
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

    const [activeRightTab, setActiveRightTab] = useState<PlaygroundRightTabType>("session");
    const [isRawEditorOpen, setIsRawEditorOpen] = useState(false);
    const [rawConfigValue, setRawConfigValue] = useState("");
    const [rawConfigError, setRawConfigError] = useState<string | null>(null);

    const isTransactionViewerActive = activeRightTab === "transaction";
    const leftPanelWidth = isTransactionViewerActive ? "w-[30%]" : "w-1/2";
    const rightPanelWidth = isTransactionViewerActive ? "w-[70%]" : "w-1/2";

    const [devMode, setDevMode] = useState<boolean>(true);
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const devMode: string | null = urlParams.get("devMode");

        if (devMode && devMode === "false") {
            setDevMode(false);
        }
    }, []);

    const openRawEditor = () => {
        if (!playgroundContext.config) {
            toast.error("No configuration available to edit");
            return;
        }
        setRawConfigValue(JSON.stringify(playgroundContext.config, null, 2));
        setRawConfigError(null);
        setIsRawEditorOpen(true);
    };

    const closeRawEditor = () => {
        setIsRawEditorOpen(false);
        setRawConfigError(null);
    };

    const handleSaveRawConfig = () => {
        try {
            const parsedConfig = JSON.parse(rawConfigValue) as MockPlaygroundConfigType;
            const validConfig = new MockRunner(parsedConfig).validateConfig();
            if (!validConfig.success) {
                const validationError = `Invalid configuration: ${validConfig.errors?.join(", ")}`;
                setRawConfigError(validationError);
                toast.error(validationError);
                return;
            }
            playgroundContext.setCurrentConfig(parsedConfig);
            setIsRawEditorOpen(false);
            setRawConfigError(null);
            toast.success("Raw configuration updated successfully");
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Invalid JSON in raw editor";
            setRawConfigError(errorMessage);
            toast.error(errorMessage);
        }
    };

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
                    transactionHistory={playgroundContext.config?.transaction_history || []}
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
            <div className="flex justify-start gap-4 ml-2 mt-2 mb-2">
                <button
                    onClick={openRawEditor}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg text-white border border-gray-100 hover:bg-gray-900 hover:scale-105 transition-transform shadow-sm"
                >
                    <FaEdit size={16} />
                    <span className="font-semibold text-sm">Edit raw</span>
                </button>
            </div>
            <RawConfigEditorModal
                isOpen={isRawEditorOpen}
                value={rawConfigValue}
                error={rawConfigError}
                onChange={(value) => {
                    setRawConfigValue(value);
                    if (rawConfigError) setRawConfigError(null);
                }}
                onSave={handleSaveRawConfig}
                onClose={closeRawEditor}
            />
            <Popup isOpen={popupOpen} onClose={closeModal}>
                {popupContent}
            </Popup>
            {playgroundContext.loading && <FullPageLoader />}
        </div>
    );
};

export default PlaygroundPage;
