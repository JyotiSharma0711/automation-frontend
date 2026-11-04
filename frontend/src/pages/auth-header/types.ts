export type TabType = "overview" | "snippets" | "header-playground";

export interface TabConfig {
    id: TabType;
    label: string;
    icon: React.ReactNode;
}
