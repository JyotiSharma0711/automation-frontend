import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";
import { TagBadge } from "@pages/user-profile/components/TagBadge";
import { CONFIG_DISPLAY_NAME_MAP } from "@pages/user-profile/constants";
import { formatEnvLabel } from "@pages/user-profile/utils/formatEnvLabel";
import type { IConfigCardProps } from "@pages/user-profile/types";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useClipboard } from "@hooks/useClipboard";
import { useOrganisationOptions } from "@pages/scenario/OrganisationField";

export const ConfigCard = ({
    configKey,
    config,
    isEditing,
    flowDescription,
    onEdit,
    onDelete,
    onLaunch,
}: IConfigCardProps) => {
    const { copyToClipboard } = useClipboard();
    const orgOptions = useOrganisationOptions();
    const displayTitle = CONFIG_DISPLAY_NAME_MAP[configKey] ?? configKey;

    return (
        <div
            className={cn(
                "flex flex-col rounded-xl border px-4 py-2 mt-3 transition-all",
                isEditing
                    ? "border-brand-light-active bg-brand-light/40 ring-1 ring-brand-light dark:bg-surface-muted dark:border-brand-normal/30"
                    : "border-n-30 bg-brand-light/40 hover:border-n-40 dark:border-border-default dark:bg-surface-muted dark:hover:border-border-default"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-body-1 font-semibold text-text-primary leading-snug truncate">
                        {displayTitle}
                    </p>
                    {flowDescription ? (
                        <p className="text-caption-2 font-semibold text-text-secondary py-1 mt-0.5">
                            {flowDescription}
                        </p>
                    ) : null}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Button
                        type="button"
                        onClick={() => onEdit(configKey)}
                        className="inline-flex items-center justify-center size-8 rounded-full bg-brand-light text-brand-normal hover:bg-brand-light-hover transition-colors"
                        aria-label="Edit configuration"
                    >
                        <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                        type="button"
                        onClick={() => onDelete(configKey)}
                        className="inline-flex items-center justify-center size-8 rounded-full bg-error-50 text-error-500 hover:bg-error-50/80 transition-colors"
                        aria-label="Delete configuration"
                    >
                        <TrashIcon className="size-5" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1 min-w-0">
                <a
                    href={config.subscriberUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-caption-1 rounded-md text-brand-normal bg-brand-light font-semibold hover:underline p-1 dark:bg-surface-elevated dark:text-brand-light"
                    title={config.subscriberUrl}
                >
                    {config.subscriberUrl}
                </a>
                <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => void copyToClipboard(config.subscriberUrl)}
                    className="shrink-0 transition-colors text-brand-normal"
                >
                    <ClipboardDocumentIcon className="size-4 text-brand-normal hover:text-brand-light" />
                </Button>
            </div>

            {config.orgId ? (
                <p className="mt-1 truncate text-caption-1 text-text-secondary">
                    <span className="font-semibold text-text-primary">Organisation:</span>{" "}
                    {orgOptions.find((o) => o.value === config.orgId)?.label ?? config.orgId}
                </p>
            ) : null}

            <div className="flex flex-wrap gap-1.5 mt-3">
                <TagBadge label={config.domain} variant="domain" />
                <TagBadge label={formatEnvLabel(config.env)} variant="env" />
                <TagBadge label={`v${config.version}`} variant="version" />
                <TagBadge label={config.npType} variant="npType" />
            </div>

            <div className="mt-4 flex items-center">
                <Button size="sm" onClick={() => onLaunch(configKey)}>
                    Launch Test
                </Button>
            </div>
        </div>
    );
};
