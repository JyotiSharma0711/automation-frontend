import IconButton from "../../../../components/ui/mini-components/icon-button";
import { FaDownload, FaUpload, FaArrowLeft } from "react-icons/fa";
import { GrRedo } from "react-icons/gr";
import { IoMdSkipForward, IoMdTrash } from "react-icons/io";
import { TbAutomaticGearboxFilled } from "react-icons/tb";

// components/playground/PlaygroundHeader.tsx
interface PlaygroundHeaderProps {
    domain?: string;
    version?: string;
    flowId?: string;
    onExport: () => void;
    onImport: () => void;
    onClear: () => void;
    onRun: () => void;
    onRunCurrent: () => void;
    onCreateFlowSession: () => void;
    onBack: () => void;
}

export const PlaygroundHeader = ({
    domain,
    version,
    flowId,
    onExport,
    onImport,
    onClear,
    onRun,
    onRunCurrent,
    onCreateFlowSession,
    onBack,
}: PlaygroundHeaderProps) => (
    <div className="h-16 flex items-center justify-between px-6 bg-gradient-to-r from-white to-sky-50 border-b border-sky-100 shadow-sm">
        <div className="flex items-center gap-6">
            <IconButton
                icon={<FaArrowLeft size={16} />}
                label="Back to Starter"
                onClick={onBack}
                color="gray"
            />
            <div className="flex items-center gap-3">
                <span className="text-xl font-bold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
                    PLAYGROUND MODE
                </span>
            </div>

            <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                    <span className="text-gray-500">Domain:</span>
                    <span className="font-semibold text-gray-800">{domain}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                    <span className="text-gray-500">Version:</span>
                    <span className="font-semibold text-gray-800">{version}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                    <span className="text-gray-500">Flow ID:</span>
                    <span className="font-semibold text-gray-800">{flowId}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <IconButton
                icon={<TbAutomaticGearboxFilled size={16} />}
                label="Create live session"
                onClick={onCreateFlowSession}
                color="sky"
            />
            <IconButton
                icon={<FaDownload size={16} />}
                label="Download"
                onClick={onExport}
                color="sky"
            />
            <IconButton
                icon={<FaUpload size={16} />}
                label="Upload"
                onClick={onImport}
                color="sky"
            />
            <IconButton
                icon={<IoMdTrash size={16} />}
                label="Clear"
                onClick={onClear}
                color="red"
            />
            <IconButton
                icon={<GrRedo size={18} />}
                label="Run current"
                onClick={onRunCurrent}
                color="green"
            />
            <IconButton
                icon={<IoMdSkipForward size={18} />}
                label="Run in sequence"
                onClick={onRun}
                color="orange"
            />
        </div>
    </div>
);
