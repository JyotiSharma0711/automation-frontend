import { RedisService } from "@ondc/ondc-automation-cache-lib";
import { SessionCache, SubscriberCache } from "../interfaces/newSessionData";
import { saveLog } from "../utils/console";
import axios from "../utils/axios";
import logger from "@ondc/automation-logger";
import { upsertSessionInDb } from "./dbService";
const SESSION_EXPIRY = 3600 * 24 * 4; // 48 hour
const EXPECTATION_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const createSessionService = async (
  sessionId: string,
  data: SessionCache,
  loggerMeta: any,
) => {
  const { npType, domain, version, subscriberUrl, env, usecaseId } = data;

  logger.info(
    `[createSessionService] userId received: ${data.userId ?? "NOT PROVIDED"}`,
    loggerMeta,
  );

  const flowResponse = await axios.get(
    `${process.env.CONFIG_SERVICE as string}/ui/flow`,
    {
      params: {
        domain: domain,
        version: version,
        usecase: usecaseId,
      },
    },
  );
  const flows = flowResponse.data.data.flows;
  const map: Record<string, any> = {};
  for (const flow of flows) {
    map[flow.id] = flow;
  }

  let finalCache: SessionCache = {
    transactionIds: [],
    flowMap: {},
    npType,
    domain,
    version,
    subscriberUrl,
    env,
    usecaseId: usecaseId,
    sessionDifficulty: {
      sensitiveTTL: true,
      useGateway: false,
      stopAfterFirstNack: true,
      protocolValidations: true,
      timeValidations: true,
      headerValidaton: true,
      useGzip: false,
    },
    flowConfigs: map,
    activeFlow: null,
    activeStep: 0,
  };

  try {
    await RedisService.setKey(
      sessionId,
      JSON.stringify(finalCache),
      SESSION_EXPIRY,
    );

    upsertSessionInDb(sessionId, {
      userId: data.userId,
      orgId: data.orgId,
      npType,
      npId: subscriberUrl,
      usecaseId: usecaseId,
      domain,
      version,
    }).catch((e) => logger.error("DB session upsert failed", loggerMeta, e));

    logger.info("Session created successfully", loggerMeta, finalCache);
    return "Session created successfully";
  } catch (e: any) {
    logger.error("Error creating session", loggerMeta, e);
    throw new Error("Error creating session");
  }
};

export const createSessionWithCompleteData = async (
  sessionId: string,
  sessionData: SessionCache,
  loggerMeta: any,
) => {
  await RedisService.setKey(
    sessionId,
    JSON.stringify(sessionData),
    SESSION_EXPIRY,
  );
  logger.info("Playground Session created successfully", loggerMeta);
  return "Playground Session created successfully";
};

export const setMockSession = async (
  sessionId: string,
  playgroundConfig: any,
  loggerMeta: any,
) => {
  logger.info(
    `Setting playground config for session ${sessionId} as PLAYGROUND_${sessionId}`,
    loggerMeta,
  );
  await RedisService.setKey(
    "PLAYGROUND_" + sessionId,
    JSON.stringify(playgroundConfig),
    SESSION_EXPIRY,
  );
  return "Playground config set successfully";
};

export const getSessionService = async (sessionId: string) => {
  try {
    const sessionData = await RedisService.getKey(sessionId);
    if (!sessionData) {
      throw new Error("Session not found");
    }
    return JSON.parse(sessionData) as SessionCache;
  } catch (e: any) {
    logger.error("Error fetching session", e);
    throw new Error("Error fetching session");
  }
};

export const updateSessionService = async (
  sessionId: string,
  data: Partial<SessionCache>,
  loggerMeta: any,
) => {
  const {
    subscriberId,
    npType,
    domain,
    subscriberUrl,
    env,
    sessionDifficulty,
    activeFlow,
    activeStep,
  } = data;

  try {
    // Retrieve the session data from Redis
    const sessionData = await RedisService.getKey(sessionId);

    if (!sessionData) {
      throw new Error("Session not found");
    }

    const session: SessionCache = JSON.parse(sessionData);

    // Update session data fields
    if (subscriberId) session.subscriberId = subscriberId;
    if (subscriberUrl) session.subscriberUrl = subscriberUrl;
    if (npType) session.npType = npType;
    if (domain) session.domain = domain;
    if (sessionDifficulty) session.sessionDifficulty = sessionDifficulty;
    if (env) session.env = env;
    if (activeFlow)
      session.activeFlow = activeFlow === "NONE" ? null : activeFlow;
    if (activeStep) session.activeStep = activeStep;

    // Save the updated session data back to Redis
    await RedisService.setKey(
      sessionId,
      JSON.stringify(session),
      SESSION_EXPIRY,
    );
    // Deliberately does NOT write flowMap.
    //
    // Two different things share that name. `SessionCache.flowMap` (above, and
    // in interfaces/newSessionData.ts) is `flowId -> transactionId`. automation-db's
    // `SessionDetails.flowMap` is `flowId -> "PASS" | "FAIL"` — a per-flow verdict
    // map owned by the report service. They are not interchangeable: stamping the
    // cache's keys into the verdict field made every merely-started flow count as
    // a failed one on the business dashboard.
    //
    // "This flow was attempted" belongs in `flows[]`, recorded via
    // POST /api/sessions/flows/:sessionId (see dbService.addFlowToSession).
    //
    // The upsert itself stays: it touches `updatedAt`, which the dashboard sorts
    // and exports on as the session's last-activity signal.
    upsertSessionInDb(sessionId, {
      npType: session.npType,
    }).catch((e) => logger.error("DB session upsert failed", loggerMeta, e));
    return "Session updated successfully";
  } catch (error: any) {
    logger.error("Error updating session", loggerMeta, error);
    throw new Error("Error updating session");
  }
};

export const clearFlowService = async (
  sessionId: string,
  flowId: string,
  loggerMeta: any,
) => {
  try {
    const sessionData = await RedisService.getKey(sessionId);
    if (!sessionData) {
      throw new Error("Session not found");
    }

    const session: SessionCache = JSON.parse(sessionData);
    logger.debug(JSON.stringify(session));
    const transactionId = session.flowMap[flowId];
    if (transactionId) {
      const index = session.transactionIds.indexOf(transactionId);
      if (index > -1) {
        session.transactionIds.splice(index, 1);
      }
    }
    session.flowMap[flowId] = undefined;
    await RedisService.setKey(
      sessionId,
      JSON.stringify(session),
      SESSION_EXPIRY,
    );
  } catch (e: any) {
    logger.error("Error clearing flow", loggerMeta, e);
    throw new Error("Error clearing flow");
  }
};

export const createExpectationService = async (
  subscriberUrl: string,
  flowId: string,
  sessionId: string,
  expectedAction: string,
): Promise<string> => {
  try {
    // Fetch existing session data from Redis
    const sessionData = await RedisService.getKey(subscriberUrl);

    let parsed: SubscriberCache = { activeSessions: [] };

    if (sessionData) {
      const paraseSession = JSON.parse(sessionData);
      if (paraseSession.activeSessions) {
        parsed = JSON.parse(sessionData);
      }
    }

    // Remove expired expectations and check for conflicts
    parsed.activeSessions = parsed.activeSessions.filter((expectation) => {
      const isExpired = new Date(expectation.expireAt) < new Date();

      if (isExpired) return false; // Remove expired session

      if (expectation.sessionId === sessionId) {
        saveLog(
          sessionId,
          `Expectation already exists for sessionId: ${sessionId}`,
          "error",
        );
        throw new Error(
          `Expectation already exists for sessionId: ${sessionId} and flowId: ${flowId}`,
        );
      }

      if (expectation.expectedAction === expectedAction) {
        saveLog(
          sessionId,
          `Expectation already exists for action: ${expectedAction}`,
          "error",
        );
        throw new Error(
          `Expectation already exists for the action: ${expectedAction}`,
        );
      }

      return true; // Keep valid expectations
    });

    // Add new expectation
    const expireAt = new Date(Date.now() + EXPECTATION_EXPIRY).toISOString();

    const expectation = {
      sessionId,
      flowId,
      expectedAction,
      expireAt,
    };

    parsed.activeSessions.push(expectation);

    saveLog(sessionId, `waiting for action: ${expectedAction}`);
    // Update Redis with the modified session data
    await RedisService.setKey(subscriberUrl, JSON.stringify(parsed));
    await RedisService.setKey(subscriberUrl, JSON.stringify(parsed));

    return "Expectation created successfully";
  } catch (error: any) {
    logger.error(
      "Error creating expectation",
      {
        subscriberUrl,
        flowId,
        sessionId,
        expectedAction,
      },
      error,
    );
    throw new Error(`Failed to create expectation: ${error.message}`);
  }
};

export const deleteExpectationService = async (
  sessionId: string,
  subscriberUrl: string,
) => {
  try {
    const subscriberData = await RedisService.getKey(subscriberUrl);
    if (!subscriberData) {
      logger.warning("No Expectation found for subscriber", {
        subscriberUrl,
        sessionId,
      });
      return;
    }

    const parsed: SubscriberCache = JSON.parse(subscriberData);
    logger.debug("Parsed data" + JSON.stringify(parsed));
    if (parsed.activeSessions === undefined) {
      throw new Error("No active sessions found");
    }
    parsed.activeSessions = parsed.activeSessions.filter(
      (expectation) => expectation.sessionId !== sessionId,
    );

    await RedisService.setKey(subscriberUrl, JSON.stringify(parsed));
  } catch (e: any) {
    logger.error("Error deleting expectation", { sessionId, subscriberUrl }, e);
    throw new Error("Error deleting expectation");
  }
};

export const getTransactionDataService = async (
  transaction_id: string,
  subscriber_url: string,
) => {
  try {
    const key = `${transaction_id}::${subscriber_url}`;
    const data = await RedisService.getKey(key);
    if (!data) {
      throw new Error("Transaction data not found");
    }
    return JSON.parse(data);
  } catch (e: any) {
    logger.error(
      "Error fetching transaction data",
      { transaction_id, subscriber_url },
      e,
    );
    throw new Error("Error fetching transaction data");
  }
};

export const requestForFlowPermissionService = async (
  subscriberUrl: string,
  action: string,
) => {
  const subscriberData = await RedisService.getKey(subscriberUrl);
  logger.info("request for flow permission subscriber data:", subscriberData);
  if (!subscriberData) {
    return {
      valid: true,
      message: "Subscriber not found",
    };
  }
  const parsed: SubscriberCache = JSON.parse(subscriberData);
  if (parsed.activeSessions === undefined) {
    return {
      valid: true,
      message: "No active sessions found",
    };
  }
  parsed.activeSessions = parsed.activeSessions.filter((expectation) => {
    const isExpired = new Date(expectation.expireAt) < new Date();
    if (isExpired) return false; // Remove expired session
    return true; // Keep valid expectations
  });
  const actionExists = parsed.activeSessions.some(
    (expectation) => expectation.expectedAction === action,
  );
  await RedisService.setKey(subscriberUrl, JSON.stringify(parsed));
  if (actionExists) {
    return {
      valid: false,
      message: `Already expecting action: ${action} for subscriber: ${subscriberUrl}`,
    };
  }
  return {
    valid: true,
    message: `Subscriber: ${subscriberUrl} is ready for action: ${action}`,
  };
};

export const updateFlowService = async (
  sessionId: string,
  flows: any[],
  loggerMeta: any,
) => {
  try {
    // Retrieve the session data from Redis
    const sessionData = await RedisService.getKey(sessionId);

    if (!sessionData) {
      throw new Error("Session not found");
    }

    const session: SessionCache = JSON.parse(sessionData);
    const map: Record<string, any> = {};

    if (flows) {
      for (const flow of flows) {
        map[flow.id] = flow;
      }

      session.flowConfigs = map;
    }

    // Save the updated session data back to Redis
    await RedisService.setKey(
      sessionId,
      JSON.stringify(session),
      SESSION_EXPIRY,
    );
    logger.info("Flow updated successfully", {
      ...flows,
      ...loggerMeta,
    });
    return "Flow updated successfully";
  } catch (error: any) {
    logger.error("Error updating flow", loggerMeta, error);
    throw new Error("Error updating flow");
  }
};
