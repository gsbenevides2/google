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
		async ({ status, query, headers, request, set }) => {
			const code = query.code;
			const origin = request.url;
			const isHTML = headers.accept?.includes("text/html");
			if (!code) {
				console.log("Code not found");
				if (isHTML) {
					set.headers.location = "/error";
					return status(StatusMap["Temporary Redirect"], "/error");
				}
				return status(StatusMap["Bad Request"], {
					error: "Code not found",
				});
			}
			if (!origin) {
				console.log("Origin not found");
				if (isHTML) {
					set.headers.location = "/error";
					return status(StatusMap["Temporary Redirect"], "/error");
				}
				return status(StatusMap["Bad Request"], {
					error: "Origin not found",
				});
			}
			try {
				await GoogleAuthService.processCode(code, origin);
				if (isHTML) {
					set.headers.location = "/success";
					return status(StatusMap["Temporary Redirect"], "/success");
				}
				return status(StatusMap.OK, {
					success: true,
				});
			} catch (error) {
				console.log("Error processing code", error);
				if (isHTML) {
					set.headers.location = "/error";
					return status(StatusMap["Temporary Redirect"], "/error");
				}
				return status(StatusMap["Bad Request"], {
					error: "Error processing code",
				});
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
	.get(
		"/list-accounts",
		async () => {
			const accounts = await GoogleAuthService.listAccounts();
			return {
				accounts,
			};
		},
		{
			detail: {
				summary: "List accounts",
				description: "List accounts",
			},
			response: {
				200: t.Object(
					{
						accounts: t.Array(
							t.String({
								title: "Account Email",
								description: "The email of the account",
								example: "test@example.com",
							}),
							{
								minItems: 0,
								maxItems: 100,
								uniqueItems: true,
								description: "The array of account emails",
								example: ["test@example.com", "test2@example.com"],
							},
						),
					},
					{
						description: "The response of the list accounts",
						example: {
							accounts: ["test@example.com", "test2@example.com"],
						},
					},
				),
			},
		},
	)
	.as("scoped");
