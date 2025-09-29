"use client";

import { useState, useEffect } from "react";
import {
	PlayIcon,
} from "@heroicons/react/24/outline";
import { Highlight } from "prism-react-renderer";
import { themes } from "prism-react-renderer";
import { ContactUs } from "../components/ContactUs";

interface ApiKeyData {
	apiKey: string;
	userId: string;
	email: string;
	currentTier: string;
	usageCount: number;
	createdAt: string;
	lastUsed?: string;
}

export default function Docs() {
	// Get base URL dynamically
	const getApiBaseUrl = () => {
		if (typeof window !== 'undefined') {
			return window.location.origin;
		}
		return process.env.NEXT_PUBLIC_VERCEL_URL 
			? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
			: 'http://localhost:3000';
	};

	const baseUrl = getApiBaseUrl();

	// State management
	const [isLoading, setIsLoading] = useState(true);
	const [apiKeyData, setApiKeyData] = useState<ApiKeyData | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	
	// Test API state
	const [testCode, setTestCode] = useState(`fetch('${baseUrl}/api/v1/filings/1578217/000157821725000004/0001578217-25-000004.json', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`);
	const [testResponse, setTestResponse] = useState<string | null>(null);
	const [isTesting, setIsTesting] = useState(false);
	const [testError, setTestError] = useState<string | null>(null);

	// Check authentication and API key
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const response = await fetch('/api/auth/user');
				if (response.ok) {
					await response.json(); // userData not used
					setIsAuthenticated(true);
					
					// Get API key data
					const apiKeyResponse = await fetch('/api/api-key');
					if (apiKeyResponse.ok) {
						const response = await apiKeyResponse.json();
						// Extract the actual API key data from the nested structure
						setApiKeyData(response.data);
					}
				}
			} catch (error) {
				console.error('Auth check failed:', error);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, []);

	// Update test code when base URL or API key changes
	useEffect(() => {
		if (!isLoading) {
			const apiKey = apiKeyData?.apiKey || 'YOUR_API_KEY';
			const newTestCode = `fetch('${baseUrl}/api/v1/filings/1578217/000157821725000004/0001578217-25-000004.json', {
  headers: {
    'Authorization': 'Bearer ${apiKey}'
  }
})`;
			setTestCode(newTestCode);
		}
	}, [baseUrl, apiKeyData, isLoading]);


	// Test API functionality
	const handleTestApi = async () => {
		if (!apiKeyData?.apiKey) return;
		
		setIsTesting(true);
		setTestError(null);
		setTestResponse(null);

		try {
			// Extract URL from the JavaScript code
			const urlMatch = testCode.match(/fetch\('([^']+)'/);
			if (!urlMatch) {
				setTestError('Invalid JavaScript code format');
				return;
			}
			
			const apiUrl = urlMatch[1];
			const response = await fetch(apiUrl, {
				headers: {
					'Authorization': `Bearer ${apiKeyData.apiKey}`,
				},
			});

			const data = await response.json();
			
			if (response.ok) {
				setTestResponse(JSON.stringify(data, null, 2));
			} else {
				setTestError(`Error ${response.status}: ${data.error || data.message || 'Unknown error'}`);
			}
		} catch (error) {
			setTestError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setIsTesting(false);
		}
	};


	return (
		<div className="p-8 max-w-3xl mx-auto bg-white shadow-xl rounded-lg mt-12">
			{/* Page Title */}
			<h1 className="text-4xl font-bold text-gray-900 text-center">
				📄 EDGAR JSON API Docs
			</h1>
			<p className="text-gray-600 mt-4 text-lg text-center">
				Retrieve SEC EDGAR filings as structured JSON with a simple API call.
			</p>

			{/* Interactive API Testing - Only show when user has API key */}
			{!isLoading && isAuthenticated && apiKeyData && (
				<div className="mt-8 p-6 bg-blue-50 rounded-lg shadow-md">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4">
						🧪 Test the API
					</h2>
					
					<div className="space-y-4">
						<p className="text-gray-700">
							Test the API with your own API key. Modify the JavaScript code below and click &quot;Run Code&quot; to see the JSON response.
						</p>
						
						<div className="space-y-2">
							<textarea
								value={testCode}
								onChange={(e) => setTestCode(e.target.value)}
								rows={8}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
								placeholder="Enter your JavaScript fetch code here..."
							/>
							<button
								onClick={handleTestApi}
								disabled={isTesting || !testCode}
								className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								<PlayIcon className="h-4 w-4" />
								{isTesting ? 'Running...' : 'Run Code'}
							</button>
						</div>

						{testError && (
							<div className="p-4 bg-red-100 border border-red-300 rounded-md">
								<p className="text-red-800 font-medium">Error:</p>
								<p className="text-red-700 text-sm">{testError}</p>
							</div>
						)}

						{testResponse && (
							<div className="border border-gray-300 rounded-md bg-gray-100 overflow-x-auto">
								<div className="p-2 bg-gray-200 border-b border-gray-300">
									<p className="text-sm font-medium text-gray-700">Response:</p>
								</div>
								<Highlight
									code={testResponse}
									language="json"
									theme={themes.github}
								>
									{({ className, style, tokens, getLineProps, getTokenProps }) => (
										<pre className={`${className} p-4 text-sm`} style={style}>
											{tokens.map((line, i) => (
												<div key={i} {...getLineProps({ line })}>
													{line.map((token, key) => (
														<span key={key} {...getTokenProps({ token })} />
													))}
												</div>
											))}
										</pre>
									)}
								</Highlight>
							</div>
						)}
					</div>
				</div>
			)}

			{/* How it Works */}
			<div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-md">
				<h2 className="text-2xl font-semibold text-gray-900">
					🔍 How It Works
				</h2>
				<p className="text-gray-700 mt-2">
					Take any SEC filing link and{" "}
					<strong>convert it into an API call</strong> to get the JSON-formatted
					version.
				</p>

				{/* Example URL transformation */}
				<div className="mt-4 p-4 bg-gray-100 rounded-md border border-gray-300">
					<p className="text-gray-800 font-mono text-sm">
						<strong>SEC Filing URL:</strong>
					</p>
					<p className="text-sm break-all">
						https://www.sec.gov/Archives/edgar/data/
						<span className="text-green-600">
							1578217/000157821725000004/0001578217-25-000004
						</span>
						.txt
					</p>
					<p className="text-gray-800 font-mono text-sm mt-2">
						<strong>Converted API URL:</strong>
					</p>
					<p className="text-sm break-all">
						{baseUrl}/api/v1/filings/
						<span className="text-green-600">
							1578217/000157821725000004/0001578217-25-000004
						</span>
						.json
					</p>
				</div>
			</div>


			{/* API Key Requirement - Only show if user doesn't have API key */}
			{!isLoading && (!isAuthenticated || !apiKeyData) && (
			<div className="mt-8 p-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 rounded-md">
				<h3 className="text-lg font-semibold">⚠️ API Key Required</h3>
				<p className="mt-1 text-sm">
					You <strong>must include an API key</strong> in the request headers.
						If you don&apos;t have one yet, <strong>get your key here:</strong>
				</p>
				<a
					href="/api-key"
					className="mt-3 inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition"
				>
					Get Your API Key 🔑
				</a>
			</div>
			)}

			{/* Document Types Section (Semantic) */}
			<section className="mt-8 p-6 bg-gray-50 rounded-lg shadow-md">
				<h2 className="text-2xl font-semibold text-gray-900">
					📋 Document Types
				</h2>
				<p className="text-gray-700 mt-2">
					Below are the known SEC document types that this system can parse.
					Each document type returns a structured JSON response, which is also
					available as a fully typed TypeScript interface from the public npm
					package{" "}
					<code className="bg-gray-200 p-1 rounded">sec-edgar-parser</code>. If
					you&apos;re using TypeScript, you can import them directly, for
					example:
				</p>
				<div className="mt-4 p-4 bg-gray-100 rounded-md border border-gray-300 text-sm">
					<code>{`import { Form4 } from 'sec-edgar-parser';`}</code>
				</div>

				<p className="text-gray-700 mt-2">
					Click on any document type below to expand its details and see a
					simplified JSON example.
				</p>

				{/* Add more document types (e.g., Form 8-K, Form 10-Q, etc.) here */}
			</section>

			{/* Contact */}
			<ContactUs />
		</div>
	);
}
