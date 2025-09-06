import { google } from "googleapis";
import { MongoClient } from "mongodb";
import { getEnv } from "../../utils/getEnv";

const GOOGLE_AUTH_SCOPES = [
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/calendar",
	"https://www.googleapis.com/auth/gmail.readonly",
	"https://www.googleapis.com/auth/gmail.modify",
];
const GCP_OAUTH_CLIENT_ID = getEnv("GCP_OAUTH_CLIENT_ID");
const GCP_OAUTH_CLIENT_SECRET = getEnv("GCP_OAUTH_CLIENT_SECRET");
const REDIRECT_URI = "/api/auth/callback";

const mongoClient = await MongoClient.connect(getEnv("MONGO_URI"), {
	authSource: "google",
});
const db = mongoClient.db("google");

interface AuthToken {
	email: string;
	refresh_token?: string | null;
	access_token?: string | null;
	expiry_date?: number | null;
	id_token?: string | null;
	token_type?: string | null;
}

const collection = db.collection<AuthToken>("authTokens");

export class GoogleAuthService {
	static generateRedirectUri(serverURL: string) {
		const redirectUri = new URL(REDIRECT_URI, serverURL);
		const isLocalhost = redirectUri.hostname === "localhost";
		if (!isLocalhost) {
			redirectUri.protocol = "https";
		} else {
			redirectUri.protocol = "http";
		}
		return redirectUri.toString();
	}

	static getAuthUrl(serverURL: string) {
		const oauth2Client = new google.auth.OAuth2(
			GCP_OAUTH_CLIENT_ID,
			GCP_OAUTH_CLIENT_SECRET,
			GoogleAuthService.generateRedirectUri(serverURL),
		);
		const authUrl = oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: GOOGLE_AUTH_SCOPES,
			prompt: "consent",
		});
		return authUrl;
	}

	static async processCode(code: string, serverURL: string) {
		const oauth2Client = new google.auth.OAuth2(
			GCP_OAUTH_CLIENT_ID,
			GCP_OAUTH_CLIENT_SECRET,
			GoogleAuthService.generateRedirectUri(serverURL),
		);
		const { tokens } = await oauth2Client.getToken(code);
		await oauth2Client.setCredentials(tokens);
		const userData = await google.oauth2("v2").userinfo.get({
			auth: oauth2Client,
		});
		const email = userData.data.email;
		if (!email) {
			throw new Error("Email not found");
		}
		await collection.updateOne(
			{
				email,
			},
			{
				$set: {
					email,
					...tokens,
				},
			},
			{
				upsert: true,
			},
		);
		return tokens;
	}

	static async listAccounts() {
		const accounts = await collection.find({}).toArray();
		return accounts.map((account) => account.email);
	}

	private static async getClientByTokens(token: AuthToken, url: string) {
		const authClient = new google.auth.OAuth2(
			GCP_OAUTH_CLIENT_ID,
			GCP_OAUTH_CLIENT_SECRET,
			GoogleAuthService.generateRedirectUri(url),
		);

		authClient.on("tokens", (tokens) => {
			collection.updateOne(
				{
					email: token.email,
				},
				{
					$set: {
						...tokens,
						refresh_token: tokens.refresh_token || token.refresh_token,
					},
				},
				{
					upsert: true,
				},
			);
		});
		authClient.setCredentials(token);
		return {
			email: token.email,
			authClient,
		};
	}

	static async getAllClients(url: string) {
		const tokens = await collection.find({}).toArray();
		return Promise.all(
			tokens.map((token) => GoogleAuthService.getClientByTokens(token, url)),
		);
	}

	static async getClient(email: string, url: string) {
		const token = await collection.findOne({ email });
		if (!token) {
			throw new Error("Token not found");
		}
		return GoogleAuthService.getClientByTokens(token, url);
	}
}
