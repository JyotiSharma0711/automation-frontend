import { Lock } from "lucide-react";
import { Alert } from "@components/Shadcn/Alert";
import { Card } from "@components/Shadcn/Card";
import Spinner from "@components/Shadcn/Spinner";
import { useAuth } from "@hooks/useAuth";
import { ProfilePageHeader } from "@pages/user-profile/ProfilePageHeader";
import { TagBadge } from "@pages/user-profile/components/TagBadge";
import { PROFILE_PAGE_COPY } from "@pages/user-profile/constants";
import { getUserDisplayName, type IUserOrganisation } from "@/types/user";

const copy = PROFILE_PAGE_COPY.account;

const formatLoginTime = (value?: string) =>
    value
        ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : "—";

const DetailRow = ({ label, value }: { label: string; value?: string | number }) => (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <span className="text-caption-1 text-text-secondary">{label}</span>
        <span className="min-w-0 break-all text-body-2 font-medium text-text-primary sm:text-right">
            {value === undefined || value === "" ? "—" : value}
        </span>
    </div>
);

const OrganisationCard = ({ org }: { org: IUserOrganisation }) => (
    <div className="rounded-lg border border-border-default p-4">
        <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-body-1 font-semibold text-text-primary">
                {org.organisationName || org.organisationId}
            </h3>
            {org.npType ? <TagBadge label={org.npType} variant="npType" /> : null}
            {org.isRepresentative ? <TagBadge label="Representative" variant="version" /> : null}
        </div>
        <div className="divide-y divide-border-default">
            <DetailRow label="Organisation ID" value={org.organisationId} />
            <DetailRow label="Participant ID" value={org.participantId} />
        </div>
        <p className="mt-3 text-caption-1 text-text-secondary">
            Subscriber IDs ({org.subscriberIds.length})
        </p>
        {org.subscriberIds.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
                {org.subscriberIds.map((id) => (
                    <li
                        key={id}
                        className="max-w-full break-all rounded-md bg-surface-muted px-2 py-1 font-mono text-caption-1 text-text-primary"
                    >
                        {id}
                    </li>
                ))}
            </ul>
        ) : (
            <p className="mt-1 text-body-2 text-text-primary">—</p>
        )}
    </div>
);

const AccountSection = () => {
    const { user, isAuthLoading } = useAuth();

    if (isAuthLoading && !user) {
        return (
            <div className="flex justify-center py-12">
                <Spinner className="size-8" />
            </div>
        );
    }

    const isOndc = user?.authProvider === "ondc";
    const organisations = user?.organisations ?? [];

    return (
        <div className="min-w-0 flex-1 min-h-full py-6">
            <ProfilePageHeader title={copy.title} subtitle={copy.subtitle} />

            {!isOndc ? (
                <Alert variant="info" message={copy.githubNote} />
            ) : (
                <div className="flex flex-col gap-6">
                    <p className="flex items-center gap-2 text-caption-1 text-text-secondary">
                        <Lock className="size-4 shrink-0" aria-hidden="true" />
                        {copy.readOnlyNote}
                    </p>

                    <Card title={copy.detailsTitle}>
                        <div className="divide-y divide-border-default">
                            <DetailRow label="Name" value={getUserDisplayName(user)} />
                            <DetailRow label="Email" value={user?.email} />
                            <DetailRow label="ONDC user ID" value={user?.ondcUserId} />
                            <DetailRow
                                label="Last login"
                                value={formatLoginTime(user?.lastLoginAt)}
                            />
                        </div>
                    </Card>

                    <Card title={copy.organisationsTitle} badgeCount={organisations.length}>
                        {organisations.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {organisations.map((org) => (
                                    <OrganisationCard key={org.organisationId} org={org} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-body-2 text-text-secondary">
                                {copy.noOrganisations}
                            </p>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AccountSection;
