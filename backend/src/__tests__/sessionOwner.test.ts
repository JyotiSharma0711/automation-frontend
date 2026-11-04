/**
 * The session owner (userId, orgId) is checked with the login service when the
 * request carries a login token, so a session can only be filed under an
 * organisation the user really belongs to.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("axios", () => ({ default: { get: (...args: unknown[]) => get(...args) } }));

const { resolveSessionOwner, OrganisationNotAllowedError } = await import(
	"../services/sessionOwnerService"
);

const ondcUser = (...orgIds: string[]) => ({
	data: {
		ok: true,
		user: {
			username: "25716",
			organisations: orgIds.map((organisationId) => ({ organisationId })),
		},
	},
});

describe("resolveSessionOwner", () => {
	beforeEach(() => {
		get.mockReset();
		process.env.DEVELOPER_GUIDE_SERVICE = "http://login-service";
	});

	it("keeps the body userId and sets no organisation without a token", async () => {
		const owner = await resolveSessionOwner(undefined, "someone", "11899", {});

		expect(owner).toEqual({ userId: "someone" });
		expect(get).not.toHaveBeenCalled();
	});

	it("always overrides an orgId sent in the request body", async () => {
		const owner = await resolveSessionOwner(undefined, "someone", "faked-org", {});
		const body = { userId: "someone", orgId: "faked-org" };

		expect("orgId" in owner).toBe(true);
		expect({ ...body, ...owner }.orgId).toBeUndefined();
	});

	it("keeps the picked organisation when the user belongs to it", async () => {
		get.mockResolvedValue(ondcUser("11899", "99001"));

		const owner = await resolveSessionOwner("Bearer good", "faked", "99001", {});

		expect(owner).toEqual({ userId: "25716", orgId: "99001" });
		expect(get).toHaveBeenCalledWith("http://login-service/auth/api/me", {
			headers: { Authorization: "Bearer good" },
			timeout: 5000,
		});
	});

	it("refuses an organisation the user does not belong to", async () => {
		get.mockResolvedValue(ondcUser("11899"));

		await expect(
			resolveSessionOwner("Bearer good", undefined, "12345", {}),
		).rejects.toBeInstanceOf(OrganisationNotAllowedError);
	});

	it("uses the only organisation when none was picked", async () => {
		get.mockResolvedValue(ondcUser("11899"));

		expect(await resolveSessionOwner("Bearer good", undefined, undefined, {})).toEqual({
			userId: "25716",
			orgId: "11899",
		});
	});

	it("leaves the organisation unset when none was picked out of several", async () => {
		get.mockResolvedValue(ondcUser("11899", "99001"));

		expect(await resolveSessionOwner("Bearer good", undefined, "", {})).toEqual({
			userId: "25716",
			orgId: undefined,
		});
	});

	it("leaves the organisation unset for a GitHub login", async () => {
		get.mockResolvedValue({ data: { ok: true, user: { username: "octocat" } } });

		expect(await resolveSessionOwner("Bearer gh", undefined, undefined, {})).toEqual({
			userId: "octocat",
			orgId: undefined,
		});
		await expect(
			resolveSessionOwner("Bearer gh", undefined, "11899", {}),
		).rejects.toBeInstanceOf(OrganisationNotAllowedError);
	});

	it("falls back to the body userId when the token is rejected or the service is down", async () => {
		get.mockRejectedValueOnce({ response: { status: 401 } });
		expect(await resolveSessionOwner("Bearer expired", "someone", "11899", {})).toEqual({
			userId: "someone",
		});

		get.mockRejectedValueOnce(new Error("ECONNREFUSED"));
		expect(await resolveSessionOwner("Bearer good", "someone", undefined, {})).toEqual({
			userId: "someone",
		});
	});
});
