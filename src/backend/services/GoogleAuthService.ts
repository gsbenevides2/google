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
	static getAuthUrl(serverURL: string) {
		const redirectUrl = new URL(REDIRECT_URI, serverURL);
		const oauth2Client = new google.auth.OAuth2(
			GCP_OAUTH_CLIENT_ID,
			GCP_OAUTH_CLIENT_SECRET,
			redirectUrl.toString(),
		);
		const authUrl = oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: GOOGLE_AUTH_SCOPES,
		});
		return authUrl;
	}

	static async processCode(code: string, serverURL: string) {
		const redirectUri = new URL(REDIRECT_URI, serverURL);
		const oauth2Client = new google.auth.OAuth2(
			GCP_OAUTH_CLIENT_ID,
			GCP_OAUTH_CLIENT_SECRET,
			redirectUri.toString(),
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
		await collection.insertOne({
			email,
			...tokens,
		});
		return tokens;
	}
}
