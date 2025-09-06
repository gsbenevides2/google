import Elysia, { t } from "elysia";
import { GoogleGmailService } from "../services/GoogleGmailService";

const GoogleGmailController = new Elysia({
	prefix: "/google-gmail",
	detail: {
		tags: ["Google Gmail"],
		security: [
			{
				bearerAuth: [],
			},
		],
	},
})
	.get(
		"/list-emails",
		async ({ request, status, query }) => {
			const emails = await GoogleGmailService.listEmails({
				...query,
				url: request.url,
			});
			const formattedEmails = emails.map((email) => ({
				id: email.id ?? "",
				from:
					email.payload?.headers?.find((h) => h.name === "From")?.value ?? "",
				to: email.payload?.headers?.find((h) => h.name === "To")?.value ?? "",
				subject:
					email.payload?.headers?.find((h) => h.name === "Subject")?.value ??
					"",
				date:
					email.payload?.headers?.find((h) => h.name === "Date")?.value ?? "",
				isUnread: email.labelIds?.includes("UNREAD") ?? false,
			}));
			return status(200, formattedEmails);
		},
		{
			detail: {
				summary: "List emails",
				description: "List emails",
			},
			query: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the emails",
					example: "test@example.com",
				}),
				maxResults: t.Optional(
					t.Number({
						title: "Max Results",
						description: "The maximum number of emails to list",
						example: 10,
					}),
				),
				q: t.Optional(
					t.String({
						title: "Query",
						description: "The query to search for",
						example: "test",
					}),
				),
				labelIds: t.Optional(
					t.Array(
						t.String({
							title: "Label IDs",
							description: "The IDs of the labels to list emails from",
							example: ["INBOX", "UNREAD"],
						}),
					),
				),
				includeSpamTrash: t.Optional(
					t.Boolean({
						title: "Include Spam Trash",
						description: "If the spam and trash folders should be included",
						example: true,
					}),
				),
			}),
			response: {
				200: t.Array(
					t.Object({
						id: t.String({
							title: "ID",
							description: "The ID of the email",
							example: "1234567890",
						}),
						from: t.String({
							title: "From",
							description: "The from of the email",
							example: "test@example.com",
						}),
						to: t.String({
							title: "To",
							description: "The to of the email",
							example: "test@example.com",
						}),
						subject: t.String({
							title: "Subject",
							description: "The subject of the email",
							example: "Test Email",
						}),
						date: t.String({
							title: "Date",
							description: "The date of the email",
							example: "2025-01-01T00:00:00Z",
						}),
						isUnread: t.Boolean({
							title: "Is Unread",
							description: "If the email is unread",
							example: true,
						}),
					}),
					{
						minItems: 0,
						maxItems: 100,
						uniqueItems: true,
						description: "The array of emails",
						example: [],
					},
				),
			},
		},
	)
	.get(
		"/get-email-by-id",
		async ({ request, status, query }) => {
			const email = await GoogleGmailService.getEmailById({
				...query,
				url: request.url,
			});
			let body = "";
			if (email.payload?.body?.data) {
				body = Buffer.from(email.payload.body.data, "base64").toString("utf-8");
			} else if (email.payload?.parts) {
				// Look for text/plain or text/html parts
				const textPart = email.payload.parts.find(
					(part) =>
						part.mimeType === "text/plain" || part.mimeType === "text/html",
				);
				if (textPart?.body?.data) {
					body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
				}
			}

			const formattedEmail = {
				id: email.id ?? "",
				from:
					email.payload?.headers?.find((h) => h.name === "From")?.value ?? "",
				to: email.payload?.headers?.find((h) => h.name === "To")?.value ?? "",
				subject:
					email.payload?.headers?.find((h) => h.name === "Subject")?.value ??
					"",
				date:
					email.payload?.headers?.find((h) => h.name === "Date")?.value ?? "",
				isUnread: email.labelIds?.includes("UNREAD") ?? false,
				threadId: email.threadId ?? "",
				body: body,
			};
			return status(200, formattedEmail);
		},
		{
			detail: {
				summary: "Get email by ID",
				description: "Get email by ID",
			},
			query: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the email",
					example: "test@example.com",
				}),
				messageId: t.String({
					title: "Message ID",
					description: "The ID of the message",
					example: "1234567890",
				}),
				format: t.Optional(
					t.Union(
						[
							t.Literal("metadata"),
							t.Literal("minimal"),
							t.Literal("full"),
							t.Literal("raw"),
						],
						{
							title: "Format",
							description: "The format of the email",
							example: "minimal",
						},
					),
				),
			}),
			response: {
				200: t.Object({
					id: t.String({
						title: "ID",
						description: "The ID of the email",
						example: "1234567890",
					}),
					from: t.String({
						title: "From",
						description: "The from of the email",
						example: "test@example.com",
					}),
					to: t.String({
						title: "To",
						description: "The to of the email",
						example: "test@example.com",
					}),
					subject: t.String({
						title: "Subject",
						description: "The subject of the email",
						example: "Test Email",
					}),
					date: t.String({
						title: "Date",
						description: "The date of the email",
						example: "2025-01-01T00:00:00Z",
					}),
					isUnread: t.Boolean({
						title: "Is Unread",
						description: "If the email is unread",
						example: true,
					}),
					threadId: t.String({
						title: "Thread ID",
						description: "The thread ID of the email",
						example: "1234567890",
					}),
					body: t.String({
						title: "Body",
						description: "The body of the email",
						example: "Test Email",
					}),
				}),
			},
		},
	)
	.get(
		"/get-unread-emails",
		async ({ request, status, query }) => {
			const emails = await GoogleGmailService.getUnreadEmails({
				...query,
				url: request.url,
			});
			const formattedEmails = emails.map((email) => ({
				id: email.id ?? "",
				from:
					email.payload?.headers?.find((h) => h.name === "From")?.value ?? "",
				to: email.payload?.headers?.find((h) => h.name === "To")?.value ?? "",
				subject:
					email.payload?.headers?.find((h) => h.name === "Subject")?.value ??
					"",
				date:
					email.payload?.headers?.find((h) => h.name === "Date")?.value ?? "",
				isUnread: email.labelIds?.includes("UNREAD") ?? false,
			}));
			return status(200, formattedEmails);
		},
		{
			detail: {
				summary: "Get unread emails",
				description: "Get unread emails",
			},
			query: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the emails",
					example: "test@example.com",
				}),
				maxResults: t.Optional(
					t.Number({
						title: "Max Results",
						description: "The maximum number of emails to list",
						example: 10,
					}),
				),
			}),
			response: {
				200: t.Array(
					t.Object({
						id: t.String({
							title: "ID",
							description: "The ID of the email",
							example: "1234567890",
						}),
						from: t.String({
							title: "From",
							description: "The from of the email",
							example: "test@example.com",
						}),
						to: t.String({
							title: "To",
							description: "The to of the email",
							example: "test@example.com",
						}),
						subject: t.String({
							title: "Subject",
							description: "The subject of the email",
							example: "Test Email",
						}),
						date: t.String({
							title: "Date",
							description: "The date of the email",
							example: "2025-01-01T00:00:00Z",
						}),
						isUnread: t.Boolean({
							title: "Is Unread",
							description: "If the email is unread",
							example: true,
						}),
					}),
					{
						minItems: 0,
						maxItems: 100,
						uniqueItems: true,
						description: "The array of emails",
						example: [],
					},
				),
			},
		},
	)
	.get(
		"/get-labels",
		async ({ request, status, query }) => {
			const labels = await GoogleGmailService.getLabels({
				...query,
				url: request.url,
			});
			const formattedLabels = labels.map((label) => ({
				id: label.id ?? "",
				name: label.name ?? "",
				type: label.type ?? "",
				labelListVisibility: label.labelListVisibility ?? "",
			}));
			return status(200, formattedLabels);
		},
		{
			detail: {
				summary: "Get labels",
				description: "Get labels",
			},
			query: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the labels",
					example: "test@example.com",
				}),
			}),
			response: {
				200: t.Array(
					t.Object({
						id: t.String({
							title: "ID",
							description: "The ID of the label",
							example: "1234567890",
						}),
						name: t.String({
							title: "Name",
							description: "The name of the label",
							example: "Test Label",
						}),
						type: t.String({
							title: "Type",
							description: "The type of the label",
							example: "system",
						}),
						labelListVisibility: t.String({
							title: "Label List Visibility",
							description: "The visibility of the label list",
							example: "show",
						}),
					}),
				),
			},
		},
	)
	.get(
		"/search-emails",
		async ({ request, status, query }) => {
			const emails = await GoogleGmailService.searchEmails({
				...query,
				url: request.url,
			});
			const formattedEmails = emails.map((email) => ({
				id: email.id ?? "",
				from:
					email.payload?.headers?.find((h) => h.name === "From")?.value ?? "",
				to: email.payload?.headers?.find((h) => h.name === "To")?.value ?? "",
				subject:
					email.payload?.headers?.find((h) => h.name === "Subject")?.value ??
					"",
				date:
					email.payload?.headers?.find((h) => h.name === "Date")?.value ?? "",
				isUnread: email.labelIds?.includes("UNREAD") ?? false,
			}));
			return status(200, formattedEmails);
		},
		{
			detail: {
				summary: "Search emails",
				description: "Search emails",
			},
			query: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the emails",
					example: "test@example.com",
				}),
				query: t.String({
					title: "Query",
					description: "The query to search for",
					example: "test",
				}),
				maxResults: t.Optional(
					t.Number({
						title: "Max Results",
						description: "The maximum number of emails to list",
						example: 10,
					}),
				),
			}),
			response: {
				200: t.Array(
					t.Object({
						id: t.String({
							title: "ID",
							description: "The ID of the email",
							example: "1234567890",
						}),
						from: t.String({
							title: "From",
							description: "The from of the email",
							example: "test@example.com",
						}),
						to: t.String({
							title: "To",
							description: "The to of the email",
							example: "test@example.com",
						}),
						subject: t.String({
							title: "Subject",
							description: "The subject of the email",
							example: "Test Email",
						}),
						date: t.String({
							title: "Date",
							description: "The date of the email",
							example: "2025-01-01T00:00:00Z",
						}),
						isUnread: t.Boolean({
							title: "Is Unread",
							description: "If the email is unread",
							example: true,
						}),
					}),
					{
						minItems: 0,
						maxItems: 100,
						uniqueItems: true,
						description: "The array of emails",
						example: [],
					},
				),
			},
		},
	)
	.patch(
		"/mark-as-read",
		async ({ request, status, query, body }) => {
			await GoogleGmailService.markAsRead({
				...query,
				...body,
				url: request.url,
			});
			return status(200, undefined);
		},
		{
			detail: {
				summary: "Mark emails as read",
				description: "Mark emails as read",
			},
			query: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the emails",
					example: "test@example.com",
				}),
			}),
			body: t.Object({
				messageIds: t.Array(
					t.String({
						title: "Message IDs",
						description: "The IDs of the messages to mark as read",
						example: ["1234567890"],
					}),
				),
			}),
		},
	);

export default GoogleGmailController;
