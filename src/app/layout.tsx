import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./components/Navigation";

export const metadata: Metadata = {
	title: "EDGAR API - Convert SEC Filings to JSON Instantly",
	description:
		"Easily convert SEC EDGAR filings into structured JSON format with the EDGAR API.",
};

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				{/* Primary Meta Tags */}
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<meta
					name="title"
					content="EDGAR API - Convert SEC Filings to JSON Instantly"
				/>
				<meta
					name="description"
					content="Easily convert SEC EDGAR filings into structured JSON format. Fetch SEC data programmatically with a simple API call."
				/>
				<meta
					name="keywords"
					content="EDGAR, SEC Filings, JSON API, financial data, structured data, developer API, SEC API, EDGAR JSON, SEC EDGAR API"
				/>
				<meta name="robots" content="index, follow" />
				<meta name="author" content="Dean Shelton" />
				<link rel="canonical" href="https://darkbastion.com" />

				{/* Open Graph / Facebook */}
				<meta property="og:type" content="website" />
				<meta property="og:url" content="https://darkbastion.com" />
				<meta
					property="og:title"
					content="EDGAR API - Convert SEC Filings to JSON Instantly"
				/>
				<meta
					property="og:description"
					content="Easily convert SEC EDGAR filings into structured JSON format. Fetch SEC data programmatically with a simple API call."
				/>
				<meta
					property="og:image"
					content="https://darkbastion.com/og-image.png"
				/>

				{/* Twitter */}
				<meta property="twitter:card" content="summary_large_image" />
				<meta property="twitter:url" content="https://darkbastion.com" />
				<meta
					property="twitter:title"
					content="EDGAR API - Convert SEC Filings to JSON Instantly"
				/>
				<meta
					property="twitter:description"
					content="Easily convert SEC EDGAR filings into structured JSON format. Fetch SEC data programmatically with a simple API call."
				/>
				<meta
					property="twitter:image"
					content="https://darkbastion.com/og-image.png"
				/>

				{/* Structured Data for SEO */}
				<script type="application/ld+json">
					{JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebSite",
						name: "EDGAR API",
						url: "https://darkbastion.com",
						description:
							"Convert SEC EDGAR filings into structured JSON format. Fetch SEC data programmatically with a simple API call.",
						publisher: {
							"@type": "Organization",
							name: "Dark Bastion",
							url: "https://darkbastion.com",
						},
					})}
				</script>
			</head>

			<body className="font-sans bg-gray-50">
				{/* Navigation */}
				<Navigation />

				{/* Page Content */}
				<main>{children}</main>
			</body>
		</html>
	);
}
