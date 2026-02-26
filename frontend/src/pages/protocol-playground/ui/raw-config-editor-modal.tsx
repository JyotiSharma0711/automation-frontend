import { Editor, Monaco } from "@monaco-editor/react";
import { DarkSkyBlueTheme } from "@pages/protocol-playground/ui/editor-themes";

type RawConfigEditorModalProps = {
    isOpen: boolean;
    value: string;
    error: string | null;
    onChange: (value: string) => void;
    onSave: () => void;
    onClose: () => void;
};

export const RawConfigEditorModal = ({
    isOpen,
    value,
    error,
    onChange,
    onSave,
    onClose,
}: RawConfigEditorModalProps) => {
    if (!isOpen) return null;

    const handleEditorWillMount = (monaco: Monaco) => {
        monaco.editor.defineTheme("dark-skyblue", DarkSkyBlueTheme);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/70">
            <div className="h-full w-full bg-white flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h2 className="text-lg font-semibold">Edit Raw Configuration JSON</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Close
                        </button>
                        <button
                            onClick={onSave}
                            className="px-4 py-2 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700"
                        >
                            Save
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                        {error}
                    </div>
                )}
                <div className="flex-1 p-4 pt-3 overflow-hidden">
                    <Editor
                        theme="dark-skyblue"
                        beforeMount={handleEditorWillMount}
                        height="100%"
                        language="json"
                        value={value}
                        onChange={(nextValue) => onChange(nextValue || "")}
                        options={{
                            fontSize: 14,
                            lineNumbers: "on",
                            automaticLayout: true,
                            formatOnPaste: true,
                            formatOnType: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
