import React from "react";
import { Outlet } from "react-router";

export function Root() {
	return (
		<html lang="pt-BR">
			<head>
				<meta charSet="utf-8" />
				<title>Google Plataform</title>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin=""
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
					rel="stylesheet"
				></link>
				<meta name="description" content="Google Plataform" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="stylesheet" href="/styles.css" />
				<link
					rel="icon"
					href="/favicon-32x32.png"
					sizes="32x32"
					type="image/png"
				/>
				<link
					rel="icon"
					href="/favicon-16x16.png"
					sizes="16x16"
					type="image/png"
				/>
				<link rel="shortcut icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				<link rel="manifest" href="/site.webmanifest" />
				<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#4285f4" />
				<meta name="theme-color" content="#4285f4" />
			</head>
			<body>
				<Outlet />
			</body>
		</html>
	);
}
