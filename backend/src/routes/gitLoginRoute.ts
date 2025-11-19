import { Request, Router, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { verifyJWT } from "../services/registryServices";
import {getUser, createUser} from "../services/dbService"
import logger from "@ondc/automation-logger";
import { getOrCreateUser } from "../utils";
const router = Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
// / auth
// Step 1: Redirect to GitHub
router.get("/github", (req: Request, res: Response) => {
	const redirect_uri = `${BACKEND_URL}/auth/github/callback`;
	res.redirect(
		`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect_uri}`
	);
});

// Step 2: GitHub Callback
router.get("/github/callback", async (req: Request, res: Response) => {
	const code = req.query.code;

	try {
		// Step 3: Exchange code for access token
		const tokenRes = await axios.post(
			`https://github.com/login/oauth/access_token`,
			{
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
				code,
			},
			{ headers: { accept: "application/json" } }
		);

		const accessToken = tokenRes.data.access_token;

		// Step 4: Get GitHub user info
		const userRes = await axios.get("https://api.github.com/user", {
			headers: { Authorization: `token ${accessToken}` },
		});

		const user = userRes.data;
		console.log(user);
		const userId = user.login;
		const registryBaseUrl = process.env.IN_HOUSE_REGISTRY;
		const url = `${registryBaseUrl}/admin/v3.0/token/create`;

		const requestToken = await axios.post(url, {
			github_id: userId,
		});
		const token = requestToken.data.token;

		const subUrl = `${registryBaseUrl}/admin/v3.0/subscribe`;
		const lookupUrl = `${registryBaseUrl}/admin/v3.0/lookup`;
		try {
			await axios.post(
				subUrl,
				{
					participant_id: userId,
					request_id: `request-${new Date().toISOString()}`,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
		} catch (error) {
			try {
				const lookupResponse = await axios.post(
					lookupUrl,
					{
						participant_id: userId,
						type: "PR",
						request_id: `request-${new Date().toISOString()}`,
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
			} catch (error: any) {
				if (axios.isAxiosError(error) && error.response) {
					// If the error is an Axios error with a response, extract the message from the response
					console.error("Lookup error:", error.response.data);
				} else {
					console.error("Lookup error:", error);
				}
				res.status(500).send("Failed to subscribe or lookup");
				return;
			}
		}

		// Step 6: Set HTTP-only cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: false, // Set to true in production (HTTPS)
			sameSite: "lax",
			maxAge: 3600000, // 1 hour
		});

		res.redirect(`${FRONTEND_URL}/profile`);
	} catch (err) {
		console.error(err);
		res.status(500).send("OAuth error");
	}
});

router.get("/api/me", async (req: Request, res: Response) => {
	const token = req.cookies.token;
	console.log("Token from cookie:", token);
	if (!token) {
		res.status(401).json({ error: "No token" });
		return;
	}

	try {
		// const decoded = jwt.verify(token, JWT_SECRET!);
		const decoded = await verifyJWT(token);
		if (!decoded) {
			throw new Error("Invalid token");
		}
		console.log("Decoded token:", decoded);

		await getOrCreateUser(decoded)

		res.status(200).send({
			user: decoded,
			ok: true,
		}); // Or fetch full user from DB if needed
		return;
	} catch (err) {
		res.status(401).json({ error: "Invalid token" });
	}
});

router.post("/logout", (req: Request, res: Response) => {
	let env = process.env.NODE_ENV || "development";
	env = env.toLowerCase();
	res.clearCookie("token", {
		httpOnly: true,
		secure: env.startsWith("prod"), // Set to true in production (HTTPS)
		sameSite: "lax",
	});
	res.status(200).json({ message: "Logged out successfully" });
});

router.get("/api/generate-keys", async (req: Request, res: Response) => {
	try {
		const registryBaseUrl = process.env.IN_HOUSE_REGISTRY;
		const url = `${registryBaseUrl}/admin/v2.0/generate-keys`;
		const token = req.cookies.token;
		const keys = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		res.status(200).json(keys.data);
		return;
	} catch (error) {
		console.error("Error generating subscriber keys:", error);
		res.status(500).json({ error: "Failed to generate subscriber keys" });
		return;
	}
});

router.post("/subscribe", async (req: Request, res: Response) => {
	const registryBaseUrl = process.env.IN_HOUSE_REGISTRY;
	const url = `${registryBaseUrl}/admin/v3.0/subscribe`;
	const token = req.cookies.token;
	if (!token) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}
	try {
		const response = await axios.post(
			url,
			{
				...req.body,
			},
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);
		res.status(200).json(response.data);
	} catch (error: any) {
		let message = error.message;
		if (axios.isAxiosError(error) && error.response) {
			// If the error is an Axios error with a response, extract the message from the response
			message = error.response.data.error || error.message;
		}
		console.error("Error subscribing:", error);
		res.status(500).json({
			error: "Failed to subscribe",
			details: message,
		});
	}
});

router.patch("/subscribe", async (req: Request, res: Response) => {
	const registryBaseUrl = process.env.IN_HOUSE_REGISTRY;
	const url = `${registryBaseUrl}/admin/v3.0/subscribe`;
	const token = req.cookies.token;
	if (!token) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}
	logger.info(
		"Patching subscriber details with body: \n" +
			JSON.stringify(req.body, null, 2)
	);
	try {
		const response = await axios.patch(
			url,
			{
				...req.body,
			},
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);
		logger.info(
			"Response from patch request: \n" + JSON.stringify(response.data, null, 2)
		);
		res.status(200).json(response.data);
	} catch (error: any) {
		let message = error.message;
		if (axios.isAxiosError(error) && error.response) {
			// If the error is an Axios error with a response, extract the message from the response
			message = error.response.data.error || error.message;
		}
		console.error("Error patching:", error);
		res.status(500).json({
			error: "Failed to patch",
			details: message,
		});
	}
});

router.delete("/subscribe", async (req: Request, res: Response) => {
	const registryBaseUrl = process.env.IN_HOUSE_REGISTRY;
	const url = `${registryBaseUrl}/admin/v3.0/subscribe`;
	const token = req.cookies.token;
	if (!token) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}
	try {
		const response = await axios.delete(url, {
			data: {
				participant_id: req.body.participant_id,
				...req.body,
				request_id: `request-${new Date().toISOString()}`,
			},
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		res.status(200).json(response.data);
	} catch (error: any) {
		let message = error.message;
		if (axios.isAxiosError(error) && error.response) {
			// If the error is an Axios error with a response, extract the message from the response
			message = error.response.data.error || error.message;
		}
		console.error("Error deleting subscription:", error);
		res.status(500).json({
			error: "Failed to delete subscription",
			details: message,
		});
	}
});

router.post("/lookup", async (req: Request, res: Response) => {
	const registryBaseUrl = process.env.IN_HOUSE_REGISTRY;
	const url = `${registryBaseUrl}/admin/v3.0/lookup`;
	const token = req.cookies.token;
	const { participant_id } = req.body;
	if (!token) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}
	if (!participant_id) {
		res.status(400).json({ error: "Participant ID is required" });
		return;
	}
	try {
		const response = await axios.post(
			url,
			{
				type: "PR",
				participant_id: participant_id,
				request_id: `request-${new Date().toISOString()}`,
			},
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);
		res.status(200).json(response.data);
	} catch (error: any) {
		let message = error.message;
		if (axios.isAxiosError(error) && error.response) {
			// If the error is an Axios error with a response, extract the message from the response
			message = error.response.data.error || error.message;
		}
		console.error("Error looking up participant:", error);
		res.status(500).json({
			error: "Failed to lookup participant",
			details: message,
		});
	}
});

export default router;
