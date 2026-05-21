import { type gmail_v1, google } from "googleapis";
import { GoogleAuthService } from "./GoogleAuthService";

export class GoogleGmailService {
	public static async listEmails(args: {
		email: string;
		url: string;
		maxResults?: number;
		q?: string;
		labelIds?: string[];
		includeSpamTrash?: boolean;
	}) {
		const oauth2Client = await GoogleAuthService.getClient(
			args.email,
			args.url,
		);
		const gmail = google.gmail({
			version: "v1",
			auth: oauth2Client.authClient,
		});

		const response = await gmail.users.messages.list({
			userId: "me",
			maxResults: args.maxResults || 10,
			q: args.q,
			labelIds: args.labelIds,
			includeSpamTrash: args.includeSpamTrash || false,
		});

		if (!response.data.messages) {
			return [];
		}

		// Get detailed information for each message
		const messages = await Promise.all(
			response.data.messages.map(async (message) => {
				if (!message.id) return;
				const detail = await gmail.users.messages.get({
					userId: "me",
					id: message.id,
					format: "metadata",
					metadataHeaders: ["From", "To", "Subject", "Date"],
				});
				return detail.data;
			}),
		);

		return messages.filter(
			(message) => message !== undefined,
		) as gmail_v1.Schema$Message[];
	}

	public static async getEmailById(args: {
		email: string;
		url: string;
		messageId: string;
		format?: "minimal" | "full" | "raw" | "metadata";
	}) {
		const oauth2Client = await GoogleAuthService.getClient(
			args.email,
			args.url,
		);
		const gmail = google.gmail({
			version: "v1",
			auth: oauth2Client.authClient,
		});

		const response = await gmail.users.messages.get({
			userId: "me",
			id: args.messageId,
			format: args.format || "full",
		});

		return response.data;
	}

	private static async extractPartsAttachments(
		gmail: gmail_v1.Gmail,
		messageId: string,
		parts: gmail_v1.Schema$MessagePart[],
	): Promise<
		Array<{
			filename: string;
			mimeType: string;
			size: number;
			attachmentId: string;
			data: string;
		}>
	> {
		const attachments: Array<{
			filename: string;
			mimeType: string;
			size: number;
			attachmentId: string;
			data: string;
		}> = [];

		for (const part of parts) {
			if (part.filename && part.filename.length > 0) {
				let data = part.body?.data ?? "";
				const attachmentId = part.body?.attachmentId ?? "";

				if (!data && attachmentId) {
					const response = await gmail.users.messages.attachments.get({
						userId: "me",
						messageId,
						id: attachmentId,
					});
					data = response.data.data ?? "";
				}

				attachments.push({
					filename: part.filename,
					mimeType: part.mimeType ?? "",
					size: part.body?.size ?? 0,
					attachmentId,
					data,
				});
			}

			if (part.parts) {
				const nested = await GoogleGmailService.extractPartsAttachments(
					gmail,
					messageId,
					part.parts,
				);
				attachments.push(...nested);
			}
		}

		return attachments;
	}

	public static async getEmailAttachments(args: {
		email: string;
		url: string;
		messageId: string;
		parts: gmail_v1.Schema$MessagePart[];
	}) {
		const oauth2Client = await GoogleAuthService.getClient(
			args.email,
			args.url,
		);
		const gmail = google.gmail({
			version: "v1",
			auth: oauth2Client.authClient,
		});

		return GoogleGmailService.extractPartsAttachments(
			gmail,
			args.messageId,
			args.parts,
		);
	}

	public static async markAsRead(args: {
		email: string;
		messageIds: string[];
		url: string;
	}) {
		const oauth2Client = await GoogleAuthService.getClient(
			args.email,
			args.url,
		);
		const gmail = google.gmail({
			version: "v1",
			auth: oauth2Client.authClient,
		});

		// Remove the UNREAD label to mark as read
		const response = await gmail.users.messages.batchModify({
			userId: "me",
			requestBody: {
				ids: args.messageIds,
				removeLabelIds: ["UNREAD"],
			},
		});

		return response.data;
	}

	public static async markAsUnread(args: {
		email: string;
		messageIds: string[];
		url: string;
	}) {
		const oauth2Client = await GoogleAuthService.getClient(
			args.email,
			args.url,
		);
		const gmail = google.gmail({
			version: "v1",
			auth: oauth2Client.authClient,
		});

		// Add the UNREAD label to mark as unread
		const response = await gmail.users.messages.batchModify({
			userId: "me",
			requestBody: {
				ids: args.messageIds,
				addLabelIds: ["UNREAD"],
			},
		});

		return response.data;
	}

	public static async searchEmails(args: {
		email: string;
		query: string;
		url: string;
		maxResults?: number;
	}) {
		const oauth2Client = await GoogleAuthService.getClient(
			args.email,
			args.url,
		);
		const gmail = google.gmail({
			version: "v1",
			auth: oauth2Client.authClient,
		});

		const response = await gmail.users.messages.list({
			userId: "me",
			q: args.query,
			maxResults: args.maxResults || 10,
		});

		if (!response.data.messages) {
			return [];
		}

		// Get detailed information for each message
		const messages = await Promise.all(
			response.data.messages.map(async (message) => {
				if (!message.id) return;
				const detail = await gmail.users.messages.get({
					userId: "me",
					id: message.id,
					format: "metadata",
					metadataHeaders: ["From", "To", "Subject", "Date"],
				});
				return detail.data;
			}),
		);

		return messages.filter(
			(message) => message !== undefined,
		) as gmail_v1.Schema$Message[];
	}

	public static async getUnreadEmails(args: {
		email: string;
		maxResults?: number;
		url: string;
	}) {
		return GoogleGmailService.listEmails({
			email: args.email,
			url: args.url,
			maxResults: args.maxResults,
			labelIds: ["UNREAD"],
		});
	}

	public static async getLabels(args: { email: string; url: string }) {
		const oauth2Client = await GoogleAuthService.getClient(
			args.email,
			args.url,
		);
		const gmail = google.gmail({
			version: "v1",
			auth: oauth2Client.authClient,
		});

		const response = await gmail.users.labels.list({
			userId: "me",
		});

		return response.data.labels || [];
	}

	public static async watchForNewEmails(args: {
		email: string;
		topicName: string;
		labelIds?: string[];
		labelFilterAction?: "include" | "exclude";
		url: string;
	}) {
		const oauth2Client = await GoogleAuthService.getClient(
			args.email,
			args.url,
		);
		const gmail = google.gmail({
			version: "v1",
			auth: oauth2Client.authClient,
		});

		const response = await gmail.users.watch({
			userId: "me",
			requestBody: {
				topicName: args.topicName,
				labelIds: args.labelIds,
				labelFilterAction: args.labelFilterAction || "include",
			},
		});

		return response.data;
	}
}
