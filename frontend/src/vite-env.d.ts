/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ENVIRONMENT?: string;
    readonly VITE_BACKEND_URL?: string;
    readonly VITE_DEVELOPER_GUIDE_BACKEND_URL?: string;
    readonly VITE_BASE_URL?: string;
    readonly VITE_BAP_URL?: string;
    readonly VITE_BPP_URL?: string;
    readonly VITE_LOAD_TEST_BACKEND_URL?: string;
    readonly VITE_DB_SERVICE_API_KEY?: string;
    readonly VITE_CHATBOT_MCP_BASE_URL?: string;
    readonly VITE_FRONTENT_URL?: string;
    readonly VITE_ENABLE_DEV_GUIDE?: string;
    readonly VITE_ONDC_PORTAL_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
