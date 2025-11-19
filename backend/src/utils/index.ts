import { getSessionService } from "../services/sessionService";
import { getUser, createUser } from "../services/dbService"; 
import logger from "@ondc/automation-logger";

export const buildMockBaseURL = async (url: string, sessionId: string) => {
	const sessionData = await getSessionService(sessionId);

	let mockUrl = process.env.MOCK_SERVICE as string;
	const usecase = sessionData.usecaseId;
	if (usecase === "PLAYGROUND-FLOW") {
		return `${mockUrl}/playground/${url}`;
	}
	if (mockUrl.includes("localhost")) {
		logger.info("Mock service is running in localhost");
		const newUrl = `${mockUrl}/${sessionData.domain}/${url}`;
		return newUrl;
	}
	const generatedURL = `${mockUrl}/${sessionData.domain}/${sessionData.version}/${url}`;

	logger.info("generated mock url: " + generatedURL);
	console.log("generated mock url: " + generatedURL);
	return generatedURL;
};
export interface CreateUserPayload {
  githubId: string;
  participantId: string;
}

export const getOrCreateUser = async (userData: CreateUserPayload) => {
  try {
    // Try to fetch existing user by GitHub ID
    const existingUser = await getUser(userData);

    if (existingUser) {
      logger?.info?.(`User found for GitHub ID: ${userData.githubId}`);
      return existingUser;
    }
  } catch (e: any) {
    // Log but don't throw yet — the error may mean "not found"
    logger?.error?.(
      `User not found for GitHub ID: ${userData.githubId}, creating new user.`
    );
  }

  try {
    // Create user if not found
    const newUser = await createUser(userData);
    logger?.info?.(`User created successfully: ${userData.githubId}`);
    return newUser;
  } catch (error: any) {
    logger?.error?.("Error creating user", { userData, error });
    throw new Error("Error creating or fetching user");
  }
};
