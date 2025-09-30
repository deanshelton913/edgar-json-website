import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import { SidebarProvider } from "./contexts/SidebarContext";
import MainContent from "./components/MainContent";

export const metadata: Metadata = {
	title: "EDGAR-JSON API | Convert SEC Filings to JSON | Free Developer API",
	description:
		"Transform SEC EDGAR filings into structured JSON with our free API. Perfect for developers building financial apps, compliance tools, and data analysis. 100 free requests/day.",
	keywords: [
		"SEC API",
		"EDGAR API", 
		"SEC filings JSON",
		"financial data API",
		"SEC EDGAR JSON",
		"developer API",
		"SEC filing parser",
		"financial compliance API",
		"SEC data extraction",
		"EDGAR filing API",
		"SEC 10-K API",
		"SEC 10-Q API",
		"SEC 8-K API",
		"financial reporting API",
		"SEC filing converter"
	],
	authors: [{ name: "Dean Shelton" }],
	creator: "Dean Shelton",
	publisher: "edgar-json.com",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://www.edgar-json.com",
		siteName: "EDGAR-JSON API",
		title: "EDGAR-JSON API | Convert SEC Filings to JSON | Free Developer API",
		description: "Transform SEC EDGAR filings into structured JSON with our free API. Perfect for developers building financial apps, compliance tools, and data analysis.",
		images: [
			{
				url: "https://www.edgar-json.com/logo-wordmark.png",
				width: 400,
				height: 80,
				alt: "EDGAR-JSON API Logo - Convert SEC Filings to JSON Instantly",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "EDGAR-JSON API | Convert SEC Filings to JSON | Free Developer API",
		description: "Transform SEC EDGAR filings into structured JSON with our free API. Perfect for developers building financial apps, compliance tools, and data analysis.",
		images: ["https://www.edgar-json.com/logo-wordmark.png"],
		creator: "@darkshelton",
	},
	verification: {
		google: "your-google-verification-code",
	},
	alternates: {
		canonical: "https://www.edgar-json.com",
	},
};

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				{/* Additional Meta Tags */}
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />

				{/* Structured Data for SEO */}
				<script type="application/ld+json">
					{JSON.stringify({
						"@context": "https://schema.org",
						"@graph": [
							{
								"@type": "WebSite",
								"@id": "https://www.edgar-json.com/#website",
								"url": "https://www.edgar-json.com",
								"name": "EDGAR-JSON API",
								"description": "Convert SEC EDGAR filings into structured JSON format. Fetch SEC data programmatically with a simple API call.",
								"publisher": {
									"@id": "https://www.edgar-json.com/#organization"
								},
								"potentialAction": {
									"@type": "SearchAction",
									"target": "https://www.edgar-json.com/api-key",
									"query-input": "required name=search_term_string"
								}
							},
							{
								"@type": "Organization",
								"@id": "https://www.edgar-json.com/#organization",
								"name": "edgar-json.com",
								"url": "https://www.edgar-json.com",
								"logo": {
									"@type": "ImageObject",
									"url": "https://www.edgar-json.com/logo.png",
									"width": 200,
									"height": 40
								},
								"sameAs": [
									"https://github.com/darkshelton"
								]
							},
							{
								"@type": "SoftwareApplication",
								"@id": "https://www.edgar-json.com/#software",
								"name": "EDGAR-JSON API",
								"description": "RESTful API that converts SEC EDGAR filings from raw text format to structured JSON. Perfect for developers building financial applications, data analysis tools, and compliance software.",
								"url": "https://www.edgar-json.com",
								"applicationCategory": "DeveloperApplication",
								"operatingSystem": "Any",
								"offers": {
									"@type": "Offer",
									"price": "0",
									"priceCurrency": "USD",
									"description": "Free tier with 100 requests per day"
								},
								"featureList": [
									"Convert SEC filings to JSON",
									"RESTful API interface",
									"Real-time data processing",
									"Developer-friendly documentation",
									"Rate limiting and authentication",
									"Support for all SEC filing types"
								],
								"author": {
									"@id": "https://www.edgar-json.com/#organization"
								},
								"publisher": {
									"@id": "https://www.edgar-json.com/#organization"
								}
							},
							{
								"@type": "FAQPage",
								"@id": "https://www.edgar-json.com/#faq",
								"mainEntity": [
									{
										"@type": "Question",
										"name": "What is the EDGAR-JSON API?",
										"acceptedAnswer": {
											"@type": "Answer",
											"text": "The EDGAR-JSON API is a RESTful service that converts SEC EDGAR filings from raw text format into structured JSON. It makes it easy for developers to access and work with SEC filing data programmatically."
										}
									},
									{
										"@type": "Question",
										"name": "How much does the API cost?",
										"acceptedAnswer": {
											"@type": "Answer",
											"text": "We offer a free tier with 100 requests per day and 10 requests per minute. Paid plans are available for higher usage limits and additional features."
										}
									},
									{
										"@type": "Question",
										"name": "What types of SEC filings are supported?",
										"acceptedAnswer": {
											"@type": "Answer",
											"text": "Our API supports all major SEC filing types including 10-K, 10-Q, 8-K, 4, 3, 13D, 13G, S-1, S-4, and many others. We continuously add support for new filing types."
										}
									},
									{
										"@type": "Question",
										"name": "How do I get started with the API?",
										"acceptedAnswer": {
											"@type": "Answer",
											"text": "Simply sign up for a free account, get your API key, and start making requests. We provide comprehensive documentation and code examples to help you get started quickly."
										}
									}
								]
							}
						]
					})}
				</script>
			</head>

			<body className="font-sans bg-gray-50">
				<SidebarProvider>
					{/* Navigation with Header and Sidebar */}
					<Navigation />

					{/* Page Content */}
					<MainContent>{children}</MainContent>

					{/* Footer */}
					<Footer />
				</SidebarProvider>
			</body>
		</html>
	);
}
