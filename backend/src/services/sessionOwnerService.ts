import axios from "axios";
import logger from "@ondc/automation-logger";

export interface SessionOwner {
	userId?: string;
	orgId?: string;
}

/** Thrown when the user asks for an organisation they are not a member of. */
export class OrganisationNotAllowedError extends Error {
	constructor() {
		super("You are not a member of this organisation");
		this.name = "OrganisationNotAllowedError";
	}
}

/**
 * Works out who a new session belongs to.
 *
 * With a login token, the login service says who the user is and which NP Portal
 * organisations they belong to. The organisation picked in the form is kept only
 * if it is one of them; with no pick, a user with exactly one organisation gets
 * that one. Without a token (or if the login service cannot be reached) the
 * session keeps the userId the website sent, as before, and has no organisation.
 * orgId is always set (even to undefined) so an unchecked orgId in the request
 * body can never get through.
 */
export const resolveSessionOwner = async (
	authorization: string | undefined,
	bodyUserId: string | undefined,
	bodyOrgId: string | undefined,
	loggerMeta: any,
): Promise<SessionOwner> => {
	const loginService = process.env.DEVELOPER_GUIDE_SERVICE;
	if (!authorization || !loginService) {
		return { userId: bodyUserId, orgId: undefined };
	}
	let user: any;
	try {
		const response = await axios.get(`${loginService}/auth/api/me`, {
			headers: { Authorization: authorization },
			timeout: 5000,
		});
		user = response.data?.user;
	} catch (e: any) {
		logger.info(
			`Could not confirm the session owner with the login service (status ${e?.response?.status ?? "none"})`,
			loggerMeta,
		);
	}
	if (!user?.username) {
		return { userId: bodyUserId, orgId: undefined };
	}

	const memberOf: string[] = (user.organisations ?? [])
		.map((o: any) => o?.organisationId)
		.filter(Boolean);
	if (bodyOrgId) {
		if (!memberOf.includes(bodyOrgId)) {
			throw new OrganisationNotAllowedError();
		}
		return { userId: user.username, orgId: bodyOrgId };
	}
	return {
		userId: user.username,
		orgId: memberOf.length === 1 ? memberOf[0] : undefined,
	};
};
