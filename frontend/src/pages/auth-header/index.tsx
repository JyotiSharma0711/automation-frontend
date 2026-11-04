import { useState, useMemo } from "react";
import { FaBook, FaCode, FaPlay } from "react-icons/fa";
import Header from "@pages/auth-header/Header";
import Tabs from "@pages/auth-header/Tabs";
import Tab from "@pages/auth-header/Tab";
import { TabType, TabConfig } from "@pages/auth-header/types";

const AuthHeader = () => {
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    const tabs: TabConfig[] = useMemo(
        () => [
            { id: "overview", label: "Overview", icon: <FaBook /> },
            { id: "snippets", label: "Code Snippets", icon: <FaCode /> },
            { id: "header-playground", label: "Header Playground", icon: <FaPlay /> },
        ],
        []
    );

    return (
        <div className="min-h-screen bg-white dark:bg-surface-page">
            <Header
                tabs={
                    <Tabs
                        tabs={tabs}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        layout="hero"
                    />
                }
            />
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
                <Tab activeTab={activeTab} />
            </div>
        </div>
    );
};

export default AuthHeader;
