import { useContext, useState, useMemo, useEffect } from "react";
import { PlaygroundContext } from "../context/playground-context";
import { Editor, Monaco } from "@monaco-editor/react";
import { PLAYGROUND_LEFT_TABS, PLAYGROUND_LEFT_TABS_FORM } from "../types";
import { DarkSkyBlueTheme } from "./editor-themes";
import MockRunner, { CodeValidator, getFunctionSchema } from "@ondc/automation-mock-runner";
import { CodeStatistics } from "./extras/statistics";

// import { CodeStatistics } from "@ondc/automation-mock-runner"
export function LeftSideView(props: { width: string; activeApi?: string }) {
    const { width, activeApi } = props;
    const playgroundContext = useContext(PlaygroundContext);

    const stepData = playgroundContext.config?.steps.find((f) => f.action_id === activeApi);

    const isForm = stepData?.api === "dynamic_form";

    const tabs = isForm ? PLAYGROUND_LEFT_TABS_FORM : PLAYGROUND_LEFT_TABS;

    const [activeLeftTab, setActiveLeftTab] = useState<string>(tabs[0].id);
    useEffect(() => {
        if (!tabs.some((tab) => tab.id === activeLeftTab)) {
            setActiveLeftTab(tabs[0].id);
        }
    }, [tabs, activeLeftTab]);

    const activeTabConfig = useMemo(
        () => tabs.find((tab) => tab.id === activeLeftTab) ?? tabs[0],
        [tabs, activeLeftTab]
    );

    // Get the current editor content
    const getEditorContent = () => {
        if (!stepData) return "";
        const value = stepData.mock[activeTabConfig.property];
        if (typeof value === "string") {
            return MockRunner.decodeBase64(value);
        }
        return typeof value === "string" ? value : JSON.stringify(value, null, 2);
    };

    // Calculate statistics and validation for JavaScript code
    const codeAnalysis = useMemo(() => {
        // Only calculate stats for JavaScript/code tabs, not JSON or HTML
        if (activeTabConfig.language !== "javascript") {
            return null;
        }

        const content = getEditorContent();
        if (!content || content.trim() === "") {
            return null;
        }

        try {
            // Get statistics
            const statistics = CodeValidator.getCodeStatistics(content);

            // Get validation warnings (if we have a schema for this property)
            let validation = null;
            const baseProperty = activeTabConfig.property;
            if (
                baseProperty === "generate" ||
                baseProperty === "validate" ||
                baseProperty === "requirements"
            ) {
                const property =
                    baseProperty === "requirements" ? "meetsRequirements" : baseProperty;
                const schema = getFunctionSchema(property);
                if (schema) {
                    validation = CodeValidator.validate(content, schema);
                }
            }

            return {
                statistics,
                validation,
            };
        } catch (error) {
            console.error("Error analyzing code:", error);
            return null;
        }
    }, [activeLeftTab, stepData, activeApi]);

    // Handle editor changes
    const handleEditorChange = (value: string | undefined) => {
        if (!value || !stepData || !playgroundContext.updateStepMock) return;
        playgroundContext.updateStepMock(stepData.action_id, activeTabConfig.property, value);
    };

    const handleEditorWillMount = (monaco: Monaco) => {
        monaco.editor.defineTheme("dark-skyblue", DarkSkyBlueTheme);
    };

    return (
        <div
            className={`border rounded-md ${width} flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
        >
            {/* Header with Tabs */}
            <div className="flex border-b bg-gray-50 items-center h-8">
                <div className="ml-auto flex overflow-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveLeftTab(tab.id)}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeLeftTab === tab.id
                                    ? "bg-white border-b-2 border-sky-500 text-sky-600"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            {/* Statistics & Warnings Footer - Only show for JavaScript code */}
            {codeAnalysis && (
                <div className="px-4 py-2">
                    <CodeStatistics
                        statistics={codeAnalysis.statistics}
                        validation={codeAnalysis.validation}
                    />
                </div>
            )}
            {/* Editor - takes remaining space */}
            <div className="flex-1 p-2 overflow-hidden">
                <Editor
                    key={`${activeApi}-${activeTabConfig.id}-${activeTabConfig.language}`}
                    path={`${activeApi ?? "no-api"}-${activeTabConfig.id}.${
                        activeTabConfig.language === "javascript" ? "js" : activeTabConfig.language
                    }`}
                    theme="dark-skyblue"
                    beforeMount={handleEditorWillMount}
                    height="100%"
                    language={activeTabConfig.language}
                    value={getEditorContent()}
                    onChange={handleEditorChange}
                    options={{
                        padding: { top: 16, bottom: 16 },
                        fontSize: 16,
                        lineNumbers: "on",
                        scrollBeyondLastLine: true,
                        automaticLayout: true,
                        formatOnPaste: true,
                        formatOnType: true,
                    }}
                />
            </div>
        </div>
    );
}
