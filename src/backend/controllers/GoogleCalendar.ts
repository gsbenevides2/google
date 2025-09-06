import { Elysia, t } from "elysia";
import { GoogleCalendarService } from "../services/GoogleCalendarService";

export const GoogleCalendarController = new Elysia({
	prefix: "/google-calendar",
	detail: {
		tags: ["Google Calendar"],
		security: [
			{
				bearerAuth: [],
			},
		],
	},
})
	.get(
		"/list-calendars",
		async ({ request, status }) => {
			const calendars = await GoogleCalendarService.listCalendars(request.url);
			return status(
				200,
				calendars.map((c) => {
					return {
						email: c.owner_email,
						calendarId: c.id ?? "",
						summary: c.summary ?? "",
						primary: c.primary ?? false,
					};
				}),
			);
		},
		{
			response: {
				200: t.Array(
					t.Object({
						email: t.String({
							title: "Email",
							description: "The email of the owner of the calendar",
							example: "test@example.com",
						}),
						calendarId: t.String({
							title: "Calendar ID",
							description: "The ID of the calendar",
							example: "test@example.com",
						}),
						summary: t.String({
							title: "Summary",
							description: "The summary of the calendar",
							example: "Test Calendar",
						}),
						primary: t.Boolean({
							title: "Primary",
							description: "If the calendar is the primary calendar",
							example: true,
						}),
					}),
					{
						minItems: 0,
						maxItems: 100,
						uniqueItems: true,
						description: "The array of calendars",
						example: [
							{
								email: "test@example.com",
								calendarId: "test@example.com",
								summary: "Test Calendar",
								primary: true,
							},
						],
					},
				),
			},
			detail: {
				summary: "List calendars",
				description: "List calendars",
			},
		},
	)
	.get(
		"/get-event",
		async ({ request, status, query }) => {
			const event = await GoogleCalendarService.getEvent({
				...query,
				url: request.url,
			});
			const formatedEvent = {
				id: event.data.id ?? "",
				summary: event.data.summary ?? "",
				start_date: event.data.start?.dateTime ?? "",
				end_date: event.data.end?.dateTime ?? "",
				attendees:
					event.data.attendees?.map((a) => {
						return {
							display_name: a.displayName ?? "",
							email: a.email ?? "",
							response_status: a.responseStatus ?? "",
						};
					}) ?? [],
				location: event.data.location ?? "",
				color_id: event.data.colorId ?? "",
				hangout_link: event.data.hangoutLink ?? "",
				reminders: {
					use_default: event.data.reminders?.useDefault ?? false,
					overrides:
						event.data.reminders?.overrides?.map((o) => {
							return {
								method: o.method ?? "",
								minutes: o.minutes ?? 0,
							};
						}) ?? [],
				},
				organizer: {
					self: event.data.organizer?.self ?? false,
					display_name: event.data.organizer?.displayName ?? "",
					email: event.data.organizer?.email ?? "",
				},
				work_location_properties: {
					type: event.data.workingLocationProperties?.type ?? "",
				},
				birthday_properties: {
					type: event.data.birthdayProperties?.type ?? "",
				},
			};
			return status(200, formatedEvent);
		},
		{
			response: {
				200: t.Object({
					id: t.String({
						title: "ID",
						description: "The ID of the event",
						example: "1234567890",
					}),
					summary: t.String({
						title: "Summary",
						description: "The summary of the event",
						example: "Test Event",
					}),
					start_date: t.String({
						title: "Start Date",
						description: "The start date of the event",
						example: "2025-01-01T00:00:00Z",
					}),
					end_date: t.String({
						title: "End Date",
						description: "The end date of the event",
						example: "2025-01-01T00:00:00Z",
					}),
					attendees: t.Array(
						t.Object({
							display_name: t.String({
								title: "Display Name",
								description: "The display name of the attendee",
								example: "John Doe",
							}),
							email: t.String({
								title: "Email",
								description: "The email of the attendee",
								example: "john.doe@example.com",
							}),
							response_status: t.String({
								title: "Response Status",
								description: "The response status of the attendee",
								example: "accepted",
								enum: ["accepted", "declined", "tentative", "needsAction"],
							}),
						}),
					),
					location: t.String({
						title: "Location",
						description: "The location of the event",
						example: "123 Main St, Anytown, USA",
					}),
					color_id: t.String({
						title: "Color ID",
						description: "The color ID of the event",
						example: "1",
					}),
					hangout_link: t.String({
						title: "Hangout Link",
						description: "The hangout link of the event",
						example: "https://hangout.com",
					}),
					reminders: t.Object({
						use_default: t.Boolean({
							title: "Use Default",
							description: "If the reminders should be used",
							example: true,
						}),
						overrides: t.Array(
							t.Object({
								method: t.String({
									title: "Method",
									description: "The method of the reminder",
									enum: ["email", "popup"],
									example: "email",
								}),
								minutes: t.Number({
									title: "Minutes",
									description: "The minutes of the reminder",
									example: 10,
								}),
							}),
						),
					}),
					organizer: t.Object({
						self: t.Boolean({
							title: "Self",
							description: "If the organizer is the same as the user",
							example: true,
						}),
						display_name: t.String({
							title: "Display Name",
							description: "The display name of the organizer",
							example: "John Doe",
						}),
						email: t.String({
							title: "Email",
							description: "The email of the organizer",
							example: "john.doe@example.com",
						}),
					}),
					work_location_properties: t.Object({
						type: t.String({
							title: "Type",
							description: "The type of the work location properties",
							example: "homeOffice",
							enum: ["homeOffice", "officeLocation", "customLocation"],
						}),
					}),
					birthday_properties: t.Object({
						type: t.String({
							title: "Type",
							description: "The type of the birthday properties",
							example: "birthday",
							enum: ["birthday", "anniversary", "custom", "other", "self"],
						}),
					}),
				}),
			},
			query: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the calendar",
					example: "test@example.com",
				}),
				calendarId: t.String({
					title: "Calendar ID",
					description: "The ID of the calendar",
					example: "test@example.com",
				}),
				eventId: t.String({
					title: "Event ID",
					description: "The ID of the event",
					example: "1234567890",
				}),
			}),
		},
	)
	.get(
		"/list-events",
		async ({ request, status, query }) => {
			const events = await GoogleCalendarService.listEvents({
				...query,
				url: request.url,
			});
			const formatedEvents =
				events.data.items?.map((e) => {
					const formatedAttendees =
						e.attendees?.map((a) => {
							return {
								display_name: a.displayName ?? "",
								email: a.email ?? "",
								response_status: a.responseStatus ?? "",
							};
						}) ?? [];
					return {
						id: e.id ?? "",
						summary: e.summary ?? "",
						start_date: e.start?.dateTime ?? "",
						end_date: e.end?.dateTime ?? "",
						attendees: formatedAttendees,
						location: e.location ?? "",
						color_id: e.colorId ?? "",
						hangout_link: e.hangoutLink ?? "",
						reminders: {
							use_default: e.reminders?.useDefault ?? false,
							overrides:
								e.reminders?.overrides?.map((o) => {
									return {
										method: o.method ?? "",
										minutes: o.minutes ?? 0,
									};
								}) ?? [],
						},
						organizer: {
							self: e.organizer?.self ?? false,
							display_name: e.organizer?.displayName ?? "",
							email: e.organizer?.email ?? "",
						},
						work_location_properties: {
							type: e.workingLocationProperties?.type ?? "",
						},
						birthday_properties: {
							type: e.birthdayProperties?.type ?? "",
						},
					};
				}) ?? [];
			return status(200, formatedEvents);
		},
		{
			response: {
				200: t.Array(
					t.Object({
						id: t.String({
							title: "ID",
							description: "The ID of the event",
							example: "1234567890",
						}),
						summary: t.String({
							title: "Summary",
							description: "The summary of the event",
							example: "Test Event",
						}),
						start_date: t.String({
							title: "Start Date",
							description: "The start date of the event",
							example: "2025-01-01T00:00:00Z",
						}),
						end_date: t.String({
							title: "End Date",
							description: "The end date of the event",
							example: "2025-01-01T00:00:00Z",
						}),
						attendees: t.Array(
							t.Object({
								display_name: t.String({
									title: "Display Name",
									description: "The display name of the attendee",
									example: "John Doe",
								}),
								email: t.String({
									title: "Email",
									description: "The email of the attendee",
									example: "john.doe@example.com",
								}),
								response_status: t.String({
									title: "Response Status",
									description: "The response status of the attendee",
									example: "accepted",
									enum: ["accepted", "declined", "tentative", "needsAction"],
								}),
							}),
						),
						location: t.String({
							title: "Location",
							description: "The location of the event",
							example: "123 Main St, Anytown, USA",
						}),
						color_id: t.String({
							title: "Color ID",
							description: "The color ID of the event",
							example: "1",
						}),
						hangout_link: t.String({
							title: "Hangout Link",
							description: "The hangout link of the event",
							example: "https://hangout.com",
						}),
						reminders: t.Object({
							use_default: t.Boolean({
								title: "Use Default",
								description: "If the reminders should be used",
								example: true,
							}),
							overrides: t.Array(
								t.Object({
									method: t.String({
										title: "Method",
										description: "The method of the reminder",
										enum: ["email", "popup"],
										example: "email",
									}),
									minutes: t.Number({
										title: "Minutes",
										description: "The minutes of the reminder",
										example: 10,
									}),
								}),
							),
						}),
						organizer: t.Object({
							self: t.Boolean({
								title: "Self",
								description: "If the organizer is the same as the user",
								example: true,
							}),
							display_name: t.String({
								title: "Display Name",
								description: "The display name of the organizer",
								example: "John Doe",
							}),
							email: t.String({
								title: "Email",
								description: "The email of the organizer",
								example: "john.doe@example.com",
							}),
						}),
						work_location_properties: t.Object({
							type: t.String({
								title: "Type",
								description: "The type of the work location properties",
								example: "homeOffice",
								enum: ["homeOffice", "officeLocation", "customLocation"],
							}),
						}),
						birthday_properties: t.Object({
							type: t.String({
								title: "Type",
								description: "The type of the birthday properties",
								example: "birthday",
								enum: ["birthday", "anniversary", "custom", "other", "self"],
							}),
						}),
					}),
				),
			},
			query: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the calendar",
					example: "test@example.com",
				}),
				calendarId: t.String({
					title: "Calendar ID",
					description:
						"ID of the calendar to list events from (use 'primary' for the main calendar)",
					example: "primary",
				}),
				timeMin: t.Optional(
					t.String({
						title: "Time Min",
						description: "The minimum time to list events from",
						example: "2025-01-01T00:00:00Z",
					}),
				),
				timeMax: t.Optional(
					t.String({
						title: "Time Max",
						description: "The maximum time to list events from",
						example: "2025-01-01T00:00:00Z",
					}),
				),
				maxResults: t.Optional(
					t.Number({
						title: "Max Results",
						description: "The maximum number of events to list",
						example: 10,
					}),
				),
				orderBy: t.Optional(
					t.String({
						title: "Order By",
						description: "The order to list events in",
						example: "startTime",
					}),
				),
				singleEvents: t.Optional(
					t.Boolean({
						title: "Single Events",
						description: "If the events should be single events",
						example: true,
					}),
				),
			}),
			detail: {
				summary: "List events",
				description: "List events",
			},
		},
	)
	.post(
		"/create-event",
		async ({ request, status, body }) => {
			const event = await GoogleCalendarService.createEvent({
				...body,
				url: request.url,
			});
			return status(200, event);
		},
		{
			detail: {
				summary: "Create event",
				description: "Create event",
			},
			body: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the calendar",
					example: "test@example.com",
				}),
				calendarId: t.String({
					title: "Calendar ID",
					description: "The ID of the calendar",
					example: "test@example.com",
				}),
				summary: t.String({
					title: "Summary",
					description: "The summary of the event",
					example: "Test Event",
				}),
				description: t.Optional(
					t.String({
						title: "Description",
						description: "The description of the event",
						example: "Test Event",
					}),
				),
				start: t.String({
					title: "Start",
					description: "The start of the event",
					example: "2025-01-01T00:00:00Z",
				}),
				end: t.String({
					title: "End",
					description: "The end of the event",
					example: "2025-01-01T00:00:00Z",
				}),
				timeZone: t.Optional(
					t.String({
						title: "Time Zone",
						description: "The time zone of the event",
						default: "America/Sao_Paulo",
						example: "America/Sao_Paulo",
					}),
				),
				location: t.Optional(
					t.String({
						title: "Location",
						description: "The location of the event",
						example: "123 Main St, Anytown, USA",
					}),
				),
				attendees: t.Optional(
					t.Array(
						t.Object({
							email: t.String({
								title: "Email",
								description: "The email of the attendee",
								example: "test@example.com",
							}),
						}),
					),
				),
				reminders: t.Optional(
					t.Object({
						useDefault: t.Boolean({
							title: "Use Default",
							description: "If the reminders should be used",
							example: true,
						}),
						overrides: t.Optional(
							t.Array(
								t.Object({
									method: t.Union([t.Literal("email"), t.Literal("popup")], {
										title: "Method",
										description: "The method of the reminder",
										example: "email",
									}),
									minutes: t.Number({
										title: "Minutes",
										description: "The minutes of the reminder",
										example: 10,
									}),
								}),
							),
						),
					}),
				),
				recurrence: t.Optional(
					t.Array(
						t.String({
							title: "Recurrence",
							description: "The recurrence of the event",
							example: "RRULE:FREQ=DAILY",
						}),
					),
				),
			}),
		},
	)
	.delete(
		"/delete-event",
		async ({ request, status, query }) => {
			await GoogleCalendarService.deleteEvent({
				...query,
				url: request.url,
			});
			return status(200, undefined);
		},
		{
			detail: {
				summary: "Delete event",
				description: "Delete event",
			},
			query: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the calendar",
					example: "test@example.com",
				}),
				calendarId: t.String({
					title: "Calendar ID",
					description: "The ID of the calendar",
					example: "test@example.com",
				}),
				eventId: t.String({
					title: "Event ID",
					description: "The ID of the event",
					example: "1234567890",
				}),
			}),
		},
	)
	.patch(
		"/update-event",
		async ({ request, status, body }) => {
			await GoogleCalendarService.updateEvent({
				...body,
				url: request.url,
			});
			return status(200, undefined);
		},
		{
			detail: {
				summary: "Update event",
				description: "Update event",
			},
			body: t.Object({
				email: t.String({
					title: "Email",
					description: "The email of the owner of the calendar",
					example: "test@example.com",
				}),
				calendarId: t.String({
					title: "Calendar ID",
					description: "The ID of the calendar",
					example: "test@example.com",
				}),
				eventId: t.String({
					title: "Event ID",
					description: "The ID of the event",
					example: "1234567890",
				}),
				summary: t.Optional(
					t.String({
						title: "Summary",
						description: "The summary of the event",
						example: "Test Event",
					}),
				),
				description: t.Optional(
					t.String({
						title: "Description",
						description: "The description of the event",
						example: "Test Event",
					}),
				),
				start: t.Optional(
					t.String({
						title: "Start",
						description: "The start of the event",
						example: "2025-01-01T00:00:00Z",
					}),
				),
				end: t.Optional(
					t.String({
						title: "End",
						description: "The end of the event",
						example: "2025-01-01T00:00:00Z",
					}),
				),
				timeZone: t.Optional(
					t.String({
						title: "Time Zone",
						description: "The time zone of the event",
						example: "America/Sao_Paulo",
					}),
				),
				location: t.Optional(
					t.String({
						title: "Location",
						description: "The location of the event",
						example: "123 Main St, Anytown, USA",
					}),
				),
				attendees: t.Optional(
					t.Array(
						t.Object({
							email: t.String({
								title: "Email",
								description: "The email of the attendee",
								example: "test@example.com",
							}),
						}),
					),
				),
				reminders: t.Optional(
					t.Object({
						useDefault: t.Boolean({
							title: "Use Default",
							description: "If the reminders should be used",
							example: true,
						}),
					}),
				),
				recurrence: t.Optional(
					t.Array(
						t.String({
							title: "Recurrence",
							description: "The recurrence of the event",
							example: "RRULE:FREQ=DAILY",
						}),
					),
				),
			}),
		},
	);
