import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ROUTES } from "@constants/routes";
import {
    useLazyGetScenarioFormDataQuery,
    useLazyGetScenarioPreferencesQuery,
    useSaveScenarioPreferenceMutation,
    useDeleteScenarioPreferenceMutation,
} from "@store/api";
import { IDomain } from "@pages/schema-validation/types";
import type {
    IDomainVersionWithUsecase,
    ScenarioPreferences,
    ScenarioPreferencesAPI,
} from "@pages/user-profile/types";

const EMPTY_PREFERENCES: ScenarioPreferences = {
    configName: "",
    subscriberUrl: "",
    domain: "",
    version: "",
    usecaseId: "",
    npType: "BAP",
    env: "PRE-PRODUCTION",
    orgId: "",
};

const toAPI = (p: ScenarioPreferences): ScenarioPreferencesAPI => ({
    subscriber_url: p.subscriberUrl,
    domain: p.domain,
    version: p.version,
    usecase_id: p.usecaseId,
    np_type: p.npType,
    env: p.env,
    org_id: p.orgId || undefined,
});

const fromAPI = (p: ScenarioPreferencesAPI, configName: string): ScenarioPreferences => ({
    configName,
    subscriberUrl: p.subscriber_url,
    domain: p.domain,
    version: p.version,
    usecaseId: p.usecase_id ?? "",
    npType: p.np_type,
    env: p.env,
    orgId: p.org_id ?? "",
});

export const useScenarioPreferences = () => {
    const navigate = useNavigate();

    const {
        control,
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<ScenarioPreferences>({ defaultValues: EMPTY_PREFERENCES, mode: "onBlur" });

    const [domains, setDomains] = useState<IDomain[]>([]);
    const [savedPrefs, setSavedPrefs] = useState<Record<string, ScenarioPreferences>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);

    const allDomainsRef = useRef<IDomain[]>([]);
    const [triggerGetScenarioFormData] = useLazyGetScenarioFormDataQuery();
    const [triggerGetScenarioPreferences] = useLazyGetScenarioPreferencesQuery();
    const [saveScenarioPreference] = useSaveScenarioPreferenceMutation();
    const [deleteScenarioPreference] = useDeleteScenarioPreferenceMutation();

    const watchedDomain = watch("domain");
    const watchedVersion = watch("version");

    const domainOptions = useMemo(() => domains.map((d) => d.key), [domains]);

    const versionOptions = useMemo(() => {
        const domain = domains.find((d) => d.key === watchedDomain);
        return (
            (domain?.version as IDomainVersionWithUsecase[] | undefined)?.map((v) => v.key) ?? []
        );
    }, [domains, watchedDomain]);

    const usecaseOptions = useMemo(() => {
        const domain = domains.find((d) => d.key === watchedDomain);
        const versions = (domain?.version as IDomainVersionWithUsecase[] | undefined) ?? [];
        const version = versions.find((v) => v.key === watchedVersion);
        return version?.usecase ?? [];
    }, [domains, watchedDomain, watchedVersion]);

    const fetchDomainData = useCallback(async () => {
        try {
            const result = await triggerGetScenarioFormData();
            const fetchedDomains: IDomain[] = result.data?.domain || [];
            allDomainsRef.current = fetchedDomains;
            setDomains(fetchedDomains);
        } catch (e) {
            console.error("Error fetching scenario form data", e);
            toast.error("Failed to load domain options");
        }
    }, [triggerGetScenarioFormData]);

    const fetchSavedPreferences = useCallback(async () => {
        try {
            const raw = await triggerGetScenarioPreferences().unwrap();
            if (!raw) {
                setSavedPrefs({});
                return;
            }
            const mapped: Record<string, ScenarioPreferences> = {};
            Object.entries(raw).forEach(([key, val]) => {
                mapped[key] = fromAPI(val as ScenarioPreferencesAPI, key);
            });
            setSavedPrefs(mapped);
        } catch {
            setSavedPrefs({});
        }
    }, [triggerGetScenarioPreferences]);

    useEffect(() => {
        Promise.all([fetchDomainData(), fetchSavedPreferences()]).finally(() =>
            setIsFetching(false)
        );
    }, [fetchDomainData, fetchSavedPreferences]);

    const handleDomainChange = () => {
        setValue("version", "");
        setValue("usecaseId", "");
    };

    const handleVersionChange = () => {
        setValue("usecaseId", "");
    };

    const handleEdit = (key: string) => {
        const config = savedPrefs[key];
        setEditingKey(key);
        reset({
            configName: key,
            subscriberUrl: config.subscriberUrl,
            domain: config.domain,
            version: config.version,
            usecaseId: config.usecaseId,
            npType: config.npType,
            env: config.env,
            orgId: config.orgId,
        });
    };

    const handleCancelEdit = () => {
        setEditingKey(null);
        reset(EMPTY_PREFERENCES);
    };

    const onSubmit = async (data: ScenarioPreferences) => {
        const { domain, version, usecaseId, npType, env, orgId } = data;
        if (!domain || !version || !usecaseId || !npType) {
            toast.error("Please select domain, version, use case and app type");
            return;
        }
        const configKey = editingKey ?? data.configName.trim();
        const payload = toAPI({
            configName: configKey,
            subscriberUrl: data.subscriberUrl,
            domain,
            version,
            usecaseId,
            npType,
            env,
            orgId,
        });

        setIsSaving(true);
        try {
            await saveScenarioPreference({ configKey, payload }).unwrap();
            const nextPrefs = {
                ...savedPrefs,
                [configKey]: {
                    configName: configKey,
                    subscriberUrl: data.subscriberUrl,
                    domain,
                    version,
                    usecaseId,
                    npType,
                    env,
                    orgId,
                },
            };
            setSavedPrefs(nextPrefs);
            toast.success(editingKey ? "Configuration updated" : "Configuration saved");
            setEditingKey(null);
            reset(EMPTY_PREFERENCES);
        } catch (e) {
            console.error("Error saving preferences", e);
            toast.error("Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (configKey: string) => {
        setIsDeleting(true);
        try {
            await deleteScenarioPreference(configKey).unwrap();
            const nextPrefs = { ...savedPrefs };
            delete nextPrefs[configKey];
            setSavedPrefs(nextPrefs);
            if (editingKey === configKey) handleCancelEdit();
            toast.success("Configuration deleted");
            setPendingDeleteKey(null);
        } catch (e) {
            console.error("Error deleting preference", e);
            toast.error("Failed to delete configuration");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLaunch = (configKey: string) => {
        navigate(`${ROUTES.SCENARIO}?config=${encodeURIComponent(configKey)}`);
    };

    const confirmDelete = (configKey: string) => {
        setPendingDeleteKey(configKey);
    };

    const closeConfirmDelete = () => {
        if (isDeleting) return;
        setPendingDeleteKey(null);
    };

    const confirmDeleteAction = () => {
        if (!pendingDeleteKey || isDeleting) return;
        void handleDelete(pendingDeleteKey);
    };

    return {
        control,
        register,
        errors,
        watch,
        setValue,
        handleSubmit,
        domainOptions,
        versionOptions,
        usecaseOptions,
        handleDomainChange,
        handleVersionChange,
        savedPrefs,
        isSaving,
        isDeleting,
        isFetching,
        editingKey,
        handleEdit,
        handleCancelEdit,
        onSubmit,
        confirmDelete,
        pendingDeleteKey,
        closeConfirmDelete,
        confirmDeleteAction,
        handleLaunch,
        allDomainsRef,
    };
};
