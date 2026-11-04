import Overview from "@pages/auth-header/overview";
import CodeSnippets from "@pages/auth-header/code-snippets";
import AuthHeaderPlayground from "@pages/auth-header/header-playground";
import { TabType } from "@pages/auth-header/types";

const Tab = ({ activeTab }: { activeTab: TabType }) => {
    const renderTabContent = () => {
        switch (activeTab) {
            case "overview":
                return <Overview />;
            case "snippets":
                return <CodeSnippets />;
            case "header-playground":
                return <AuthHeaderPlayground />;
            default:
                return null;
        }
    };

    return (
        <div
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="min-h-[600px]"
        >
            {renderTabContent()}
        </div>
    );
};

export default Tab;
