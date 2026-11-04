import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@hooks/useAuth";
import { DEFAULT_VALUES } from "@pages/scenario/constants";
import {
    IDomainVersionWithUsecase,
    INewSessionFormProps,
    INewSessionFormValues,
} from "@pages/scenario/types";
import { trackSchemaValidationForm } from "@pages/scenario/helpers";
import { useOrganisationOptions } from "@pages/scenario/OrganisationField";

export function useNewSessionForm({
    domains,
    savedPreferences = {},
    initialSavedConfigKey = "",
    onSubmit,
}: INewSessionFormProps) {
    const { user } = useAuth();

    const savedConfigKeys = Object.keys(savedPreferences);
    const hasSavedPrefs = savedConfigKeys.length > 0;

    const [showManualForm, setShowManualForm] = useState(!hasSavedPrefs);
    const [selectedSavedConfigKey, setSelectedSavedConfigKey] = useState(initialSavedConfigKey);
    const [savedUsecaseId, setSavedUsecaseId] = useState(
        initialSavedConfigKey ? (savedPreferences[initialSavedConfigKey]?.usecaseId ?? "") : ""
    );

    const isLoggedIn = !!user?.githubId;

    const orgOptions = useOrganisationOptions();
    const [chosenOrgId, setChosenOrgId] = useState("");

    const {
        control,
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<INewSessionFormValues>({ defaultValues: DEFAULT_VALUES, mode: "onBlur" });

    const watchedDomain = watch("domain");
    const watchedVersion = watch("version");

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

    // const configOptions = useMemo(
    //     () =>
    //         subscriberData?.mappings?.map(
    //             (mapping) => `${mapping.domain} - ${mapping.type} - ${mapping.uri}`
    //         ) ?? [],
    //     [subscriberData]
    // );

    useEffect(() => {
        if (!initialSavedConfigKey) return;
        const pref = savedPreferences[initialSavedConfigKey];
        if (!pref) return;
        setSelectedSavedConfigKey(initialSavedConfigKey);
        setSavedUsecaseId(pref.usecaseId ?? "");
    }, [initialSavedConfigKey, savedPreferences]);

    // Only force the saved-config view when the URL config key changes —
    // never when savedPreferences merely gets a new object identity, and
    // never after the user has already chosen "Fill manually".
    useEffect(() => {
        if (initialSavedConfigKey) {
            setShowManualForm(false);
        }
    }, [initialSavedConfigKey]);

    const handleDomainChange = (domain: string) => {
        setValue("version", "");
        setValue("usecaseId", "");
        trackSchemaValidationForm("Added domain", domain);
    };

    const handleVersionChange = (version: string) => {
        setValue("usecaseId", "");
        trackSchemaValidationForm("Added version", version);
    };

    const handleConfigChange = (config: string) => {
        const [domain] = config.split(" - ");
        setValue("domain", domain);
        setValue("version", "");
        setValue("usecaseId", "");
    };

    const handleFormSubmit = async (data: INewSessionFormValues) => {
        if (isLoggedIn && data.config) {
            const [domain, type, uri] = data.config.split(" - ");
            await onSubmit({
                domain,
                npType: type,
                subscriberUrl: uri,
                version: data.version,
                usecaseId: data.usecaseId,
                env: "LOGGED-IN",
            });
            return;
        }
        await onSubmit(data);
    };

    const selectedSavedConfig = selectedSavedConfigKey
        ? savedPreferences[selectedSavedConfigKey]
        : undefined;

    // The organisation for a saved config is fixed to the one saved with it (if
    // the user still belongs to it). Older configs saved without one take the
    // user's pick, else their only organisation.
    const isMemberOf = (orgId?: string) => !!orgId && orgOptions.some((o) => o.value === orgId);
    const isSavedOrgLocked = isMemberOf(selectedSavedConfig?.orgId);
    const savedOrgId = isSavedOrgLocked
        ? selectedSavedConfig!.orgId!
        : isMemberOf(chosenOrgId)
          ? chosenOrgId
          : orgOptions.length === 1
            ? orgOptions[0].value
            : "";

    const handleSavedConfigSubmit = async () => {
        const cfg = savedPreferences[selectedSavedConfigKey];
        if (!cfg || !savedUsecaseId) return;
        if (orgOptions.length > 0 && !savedOrgId) return;
        await onSubmit({ ...cfg, usecaseId: savedUsecaseId, orgId: savedOrgId || undefined });
    };

    const savedConfigUsecaseOptions = useMemo(() => {
        if (!selectedSavedConfig) return [];
        const domainData = domains.find((d) => d.key === selectedSavedConfig.domain);
        const versionData = (domainData?.version as IDomainVersionWithUsecase[] | undefined)?.find(
            (v) => v.key === selectedSavedConfig.version
        );
        return versionData?.usecase ?? [];
    }, [domains, selectedSavedConfig]);

    const handleConfigKeyChange = (key: string) => {
        setSelectedSavedConfigKey(key);
        setSavedUsecaseId(savedPreferences[key]?.usecaseId ?? "");
        setChosenOrgId("");
    };

    return {
        showSavedConfigView: hasSavedPrefs && !showManualForm,
        savedConfigProps: {
            savedConfigKeys,
            selectedSavedConfigKey,
            selectedSavedConfig,
            savedUsecaseId,
            savedConfigUsecaseOptions,
            savedOrgId,
            isSavedOrgLocked,
            onConfigKeyChange: handleConfigKeyChange,
            onUsecaseChange: setSavedUsecaseId,
            onOrgChange: setChosenOrgId,
            onSubmit: handleSavedConfigSubmit,
            onFillManually: () => setShowManualForm(true),
        },
        manualFormProps: {
            domains,
            hasSavedPrefs,
            isLoggedIn,
            control,
            register,
            errors,
            handleSubmit,
            watch,
            versionOptions,
            usecaseOptions,
            // configOptions,
            onFormSubmit: handleFormSubmit,
            onBackToSavedConfigs: () => setShowManualForm(false),
            onDomainChange: handleDomainChange,
            onVersionChange: handleVersionChange,
            onConfigChange: handleConfigChange,
        },
    };
}
