import { useState } from "react";
import { useFormState } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Card } from "@components/Shadcn/Card";
import { Button } from "@components/Shadcn/Button";
import { ComboBox } from "@components/Shadcn/ComboBox";
import { ConfirmDialog } from "@components/Shadcn/Dialog";
import { FieldGroup } from "@components/Shadcn/TextField/field";
import { TextField } from "@components/Shadcn/TextField";
import { ROUTES } from "@constants/routes";
import { ENV_OPTIONS, PROFILE_PAGE_COPY } from "@pages/user-profile/constants";
import { DomainVersionUsecaseFields } from "@pages/scenario/DomainVersionUsecaseFields";
import { OrganisationField } from "@pages/scenario/OrganisationField";
import type { INewConfigFormProps, ScenarioPreferences } from "@pages/user-profile/types";

export const NewConfigForm = ({
    control,
    register: _register,
    errors: _errors,
    watch,
    handleSubmit,
    onSubmit,
    editingKey,
    isSaving,
    savedPrefs,
    domainOptions,
    versionOptions,
    usecaseOptions,
    handleDomainChange,
    handleVersionChange,
    onCancelEdit,
}: INewConfigFormProps) => {
    const navigate = useNavigate();
    const copy = PROFILE_PAGE_COPY.configs;
    const { isDirty } = useFormState({ control });
    const [isNavConfirmOpen, setIsNavConfirmOpen] = useState(false);

    const requestPastReportNav = () => {
        if (isDirty || editingKey) {
            setIsNavConfirmOpen(true);
            return;
        }
        navigate(ROUTES.PROFILE_PAST_REPORTS);
    };

    return (
        <Card title={copy.formTitle} description={copy.formDescription}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {editingKey ? (
                    <p className="text-body-2 text-text-secondary">
                        Editing:{" "}
                        <span className="font-semibold text-brand-normal">{editingKey}</span>
                    </p>
                ) : null}
                <FieldGroup>
                    {!editingKey ? (
                        <TextField
                            control={control}
                            name="configName"
                            label="Config Name"
                            required
                            placeholder="e.g. my-test-config"
                            rules={{
                                validate: (value: string) =>
                                    !savedPrefs[value.trim()] ||
                                    "A configuration with this name already exists, choose a different name",
                            }}
                        />
                    ) : null}
                    <OrganisationField control={control} name="orgId" />
                    <TextField
                        control={control}
                        name="subscriberUrl"
                        label="Enter Subscriber Url"
                        required
                        placeholder="https://example.com"
                        rules={{
                            pattern: {
                                value: /^https?:\/\/.*/i,
                                message: "URL must start with http:// or https://",
                            },
                        }}
                    />
                    <DomainVersionUsecaseFields<ScenarioPreferences>
                        control={control}
                        domainOptions={domainOptions}
                        versionOptions={versionOptions}
                        usecaseOptions={usecaseOptions}
                        watchedDomain={watch("domain")}
                        watchedVersion={watch("version")}
                        onDomainChange={handleDomainChange}
                        onVersionChange={handleVersionChange}
                    />
                    <ComboBox
                        control={control}
                        name="npType"
                        label="Select App Type"
                        options={["BAP", "BPP"]}
                        placeholder="App Type"
                        required
                    />
                    <ComboBox
                        control={control}
                        name="env"
                        label="Select Environment"
                        options={ENV_OPTIONS}
                        placeholder="Select environment"
                        required
                    />
                </FieldGroup>
                <div className="pt-4 flex items-center gap-3 flex-wrap">
                    <Button type="submit" disabled={isSaving}>
                        {editingKey ? "Update" : "Submit"}
                    </Button>
                    <Button type="button" variant="outline" onClick={requestPastReportNav}>
                        Past Report
                    </Button>
                    {editingKey ? (
                        <Button variant="ghost" onClick={onCancelEdit}>
                            Cancel
                        </Button>
                    ) : null}
                </div>
            </form>

            <ConfirmDialog
                open={isNavConfirmOpen}
                onOpenChange={setIsNavConfirmOpen}
                title="Discard unsaved changes?"
                description="Navigating to Past Reports will discard your unsaved changes to this config. This action cannot be undone."
                confirmText="Discard"
                cancelText="Keep editing"
                danger
                onConfirm={() => {
                    setIsNavConfirmOpen(false);
                    navigate(ROUTES.PROFILE_PAST_REPORTS);
                }}
            />
        </Card>
    );
};

export default NewConfigForm;
