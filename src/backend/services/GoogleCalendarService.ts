import { google } from "googleapis";
import { GoogleAuthService } from "./GoogleAuthService";

interface CreateEventArgs {
	email: string;
	url: string;
	calendarId: string;
	summary: string;
	description?: string;
	start: string;
	end: string;
	// Default is America/Sao_Paulo
	timeZone?: string;
	location?: string;
	attendees?: { email: string }[];
	reminders?: {
		useDefault: boolean;
		overrides?: { method: "email" | "popup"; minutes: number }[];
	};
	recurrence?: string[];
}

export class GoogleCalendarService {
	public static async listCalendars(url: string) {
		const allClients = await GoogleAuthService.getAllClients(url);
		const calendars = await Promise.all(
			allClients.map(async (client) => {
				const calendar = google.calendar({
					version: "v3",
					auth: client.authClient,
				});
				return {
					ower_email: client.email,
					calendars: await calendar.calendarList.list(),
				};
			}),
		);
		return calendars.flatMap((item) => {
			const email = item.ower_email;
			return (
				item.calendars.data.items?.map((cal) => ({
					owner_email: email,
					...cal,
				})) ?? []
			);
		});
	}

	public static async listEvents(args: {
		email: string;
		calendarId: string;
		url: string;
		timeMin?: string;
		timeMax?: string;
		maxResults?: number;
		orderBy?: string;
		singleEvents?: boolean;
	}) {
		const oauth2Client = await GoogleAuthService.getClient(
			args.email,
			args.url,
		);
		const calendar = google.calendar({
			version: "v3",
			auth: oauth2Client.authClient,
		});
		return calendar.events.list({
			calendarId: args.calendarId,
			timeMin: args.timeMin,
			timeMax: args.timeMax,
			maxResults: args.maxResults,
			orderBy: args.orderBy,
			singleEvents: args.singleEvents,
		});
	}

	public static async createEvent(args: CreateEventArgs) {
		const { email, url, ...rest } = args;
		const oauth2Client = await GoogleAuthService.getClient(email, url);
		const calendar = google.calendar({
			version: "v3",
			auth: oauth2Client.authClient,
		});
		return calendar.events.insert({
			calendarId: args.calendarId,
			requestBody: {
				...rest,
				start: {
					dateTime: rest.start,
					timeZone: rest.timeZone,
				},
				end: {
					dateTime: rest.end,
					timeZone: rest.timeZone,
				},
			},
		});
	}

	public static async deleteEvent(args: {
		email: string;
		calendarId: string;
		eventId: string;
		url: string;
	}) {
		const { email, calendarId, eventId, url } = args;
		const oauth2Client = await GoogleAuthService.getClient(email, url);
		const calendar = google.calendar({
			version: "v3",
			auth: oauth2Client.authClient,
		});
		return calendar.events.delete({
			calendarId,
			eventId,
		});
	}

	public static async updateEvent(args: {
		email: string;
		calendarId: string;
		eventId: string;
		url: string;
		summary?: string;
		description?: string;
		start?: string;
		end?: string;
		timeZone?: string;
		location?: string;
		attendees?: { email: string }[];
		reminders?: {
			useDefault: boolean;
			overrides?: { method: "email" | "popup"; minutes: number }[];
		};
		recurrence?: string[];
	}) {
		const { email, calendarId, eventId, start, end, timeZone, url, ...rest } =
			args;
		const oauth2Client = await GoogleAuthService.getClient(email, url);
		const calendar = google.calendar({
			version: "v3",
			auth: oauth2Client.authClient,
		});

		// Prepare request body
		const requestBody: Record<string, unknown> = { ...rest };

		// Handle start and end times if provided
		if (start && timeZone) {
			requestBody.start = {
				dateTime: start,
				timeZone: timeZone,
			};
		}

		if (end && timeZone) {
			requestBody.end = {
				dateTime: end,
				timeZone: timeZone,
			};
		}

		return calendar.events.patch({
			calendarId,
			eventId,
			requestBody,
		});
	}
}
