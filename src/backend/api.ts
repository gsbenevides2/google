import { Elysia } from "elysia";
import AuthController from "./controllers/AuthController";
import { GoogleAuthController } from "./controllers/GoogleAuthController";
import { GoogleCalendarController } from "./controllers/GoogleCalendar";
import GoogleGmailController from "./controllers/GoogleGmailController";
import { AuthService, InvalidCredentialsError } from "./services/AuthService";

const api = new Elysia({
	prefix: "/api",
})
	.onBeforeHandle(async ({ cookie, status, route, headers }) => {
		if (route.startsWith("/api/auth") || route === "/api/health") {
			return;
		}
		const inHeader = headers.authorization;
		if (inHeader) {
			const result = await AuthService.verifyFromHeader(inHeader);
			if (!result) {
				return status(401, {
					error: "Unauthorized",
				});
			}
			return;
		}

		const token = cookie.token.value;
		if (!token) {
			return status(401, {
				error: "Unauthorized",
			});
		}
		const decoded = await AuthService.verify(token);
		if (!decoded || decoded instanceof InvalidCredentialsError) {
			return status(401, {
				error: "Unauthorized",
			});
		}
	})
	.get(
		"/health",
		() => {
			return {
				status: "ok",
				timestamp: new Date().toISOString(),
				uptimeSeconds: Math.round(process.uptime()),
			};
		},
		{
			detail: {
				tags: ["Systems"],
				summary: "API healthcheck",
				description: "Endpoint para healthcheck da API",
			},
		},
	)
	.use(AuthController)
	.use(GoogleAuthController)
	.use(GoogleCalendarController)
	.use(GoogleGmailController);

export default api;
