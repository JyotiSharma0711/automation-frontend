import { Router } from "express";
import {
	getPayload,
	getReport,
	getSessions,
	createUserController,
	addFlowToSessionController,
	updateFlowInSessionController,
	tryAuthenticateAdmin,
	getPayloadFromDomainVersion,
} from "../controllers/dbController";
import otelTracing from "../services/tracing-service";

const router = Router();

router.post(
	"/payload",
	otelTracing("body.transaction_id", "body.session_id"),
	getPayload
);
router.get("/report", otelTracing("", "query.session_id"), getReport);

router.get(
	"/payloads/:domain/:version/:action/:page?",
	getPayloadFromDomainVersion
);

router.get("/admin/auth", tryAuthenticateAdmin);

router.get(
	"/sessions",
	otelTracing("", "query.sub_id", "query.np_type"),
	getSessions
);
router.post("/user", otelTracing("", ""), createUserController);

router.post(
	"/flows/:sessionId",
	otelTracing("", "query.session_id"),
	addFlowToSessionController
);
router.put(
	"/flows/:sessionId",
	otelTracing("", "query.session_id"),
	updateFlowInSessionController
);

export default router;
