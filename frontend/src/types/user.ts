export interface IUser {
    githubId: string;
    participantId: string;
    avatarUrl?: string;
    /** Stable key for sessions and reports: GitHub login, or the ONDC user ID for ONDC logins. */
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    authProvider?: string;
    organisationId?: string;
    organisationName?: string;
    /** ONDC logins only: what NP Portal sent at the last login. */
    ondcUserId?: number;
    ondcStatus?: number;
    organisations?: IUserOrganisation[];
    lastLoginAt?: string;
}

export interface IUserOrganisation {
    organisationId: string;
    organisationName: string;
    networkStatus: string;
    participantId?: string;
    npType: string;
    isRepresentative: boolean;
    status: number;
    subscriberIds: string[];
}

/** Name to show people: first + last name when known, else the username. */
export const getUserDisplayName = (user?: IUser): string | undefined => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return fullName || user?.username;
};
