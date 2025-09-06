import { Elysia, StatusMap, t } from "elysia";
import { GoogleAuthService } from "../services/GoogleAuthService";
export interface PlatformResponse {
	_id: string;
	name: string;
	url: string;
	type: string;
}

export const GoogleAuthController = new Elysia({
	prefix: "/auth",
	detail: {
		tags: ["Google Auth"],
		description: "Google authentication and authorization",
	},
})
	.get(
		"/",
		async ({ status, set, request, headers }) => {
			const isHTML = headers.accept?.includes("text/html");
			const serverURL = request.url;
			const authUrl = GoogleAuthService.getAuthUrl(serverURL);
			set.headers.location = authUrl;
			if (!isHTML) {
				return status(StatusMap.OK, {
					url: authUrl,
				});
			}
			return status(StatusMap["Temporary Redirect"], authUrl);
		},
		{
			detail: {
				summary: "Get auth url",
				description: "Retrieves a url to authenticate with google",
			},
		},
	)
	.get(
		"/callback",
		async ({ status, query, headers }) => {
			const isHTML = headers.accept?.includes("text/html");
			if (!query.code && !isHTML) {
				return status(StatusMap.BadRequest, {
					error: "Code not found",
				});
			} else if (!query.code && isHTML) {
				return status(StatusMap["Temporary Redirect"], "/error");
			}
		},
		{
			detail: {
				summary: "Callback from Google",
				description: "Callback from Google",
			},
			query: t.Object({
				code: t.Optional(
					t.String({
						title: "Code",
						description: "The code from Google",
						example: "1234567890",
					}),
				),
			}),
		},
	)
	.as("scoped");
