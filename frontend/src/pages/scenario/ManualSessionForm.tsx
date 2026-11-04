import { Button } from "@components/Shadcn/Button";
import { FieldGroup } from "@components/Shadcn/TextField/field";
import { ComboBox } from "@components/Shadcn/ComboBox";
import { TextField } from "@components/Shadcn/TextField";
import { DomainVersionUsecaseFields } from "@pages/scenario/DomainVersionUsecaseFields";
import { trackSchemaValidationForm } from "@pages/scenario/helpers";
import { SessionFormActions } from "@pages/scenario/SessionFormActions";
import { OrganisationField } from "@pages/scenario/OrganisationField";
import { IManualSessionFormProps } from "@pages/scenario/types";
import { getScenarioDomainLabel } from "@pages/scenario/constants";

export const ManualSessionForm = ({
    domains,
    hasSavedPrefs,
    isSubmitting,
    control,
    handleSubmit,
    watch,
    versionOptions,
    usecaseOptions,
    // configOptions,
    onFormSubmit,
    onBackToSavedConfigs,
    onDomainChange,
    onVersionChange,
    // onConfigChange,
}: IManualSessionFormProps) => {
    const watchedDomain = watch("domain");
    const watchedVersion = watch("version");

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            {hasSavedPrefs && (
                <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0"
                    onClick={onBackToSavedConfigs}
                >
                    ← Back to saved configs
                </Button>
            )}

            <FieldGroup>
                {/* {isLoggedIn ? (
                    <>
                        <ComboBox
                            control={control}
                            name="config"
                            label="Select Configured Domain"
                            options={configOptions}
                            placeholder="Select a configuration"
                            required
                            onValueChange={onConfigChange}
                        />
                        <DomainVersionUsecaseFields
                            control={control}
                            versionOptions={versionOptions}
                            usecaseOptions={usecaseOptions}
                            watchedDomain={watchedDomain}
                            watchedVersion={watchedVersion}
                            onVersionChange={onVersionChange}
                        />
                    </>
                ) : ( */}
                <>
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
                        onValueChange={(value) =>
                            trackSchemaValidationForm("Added subscriber url", value)
                        }
                    />
                    <DomainVersionUsecaseFields
                        control={control}
                        versionOptions={versionOptions}
                        usecaseOptions={usecaseOptions}
                        watchedDomain={watchedDomain}
                        watchedVersion={watchedVersion}
                        domainOptions={domains.map((d) => ({
                            value: d.key,
                            label: getScenarioDomainLabel(d.key),
                        }))}
                        onDomainChange={onDomainChange}
                        onVersionChange={onVersionChange}
                    />
                    <ComboBox
                        control={control}
                        name="npType"
                        label="Select Your Role"
                        options={[
                            { label: "Buyer App (BAP)", value: "BAP" },
                            { label: "Seller App (BPP)", value: "BPP" },
                        ]}
                        placeholder="Select your role"
                        required
                        onValueChange={(value) => trackSchemaValidationForm("Added np type", value)}
                    />
                    <ComboBox
                        control={control}
                        name="env"
                        label="Select Environment"
                        options={["PRE-PRODUCTION"]}
                        placeholder="Select environment"
                        required
                        onValueChange={(value) =>
                            trackSchemaValidationForm("Added environment", value)
                        }
                    />
                </>
                {/* )} */}
            </FieldGroup>

            <SessionFormActions isSubmitting={isSubmitting} />
        </form>
    );
};
