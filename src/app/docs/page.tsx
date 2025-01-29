"use client";

import { useState } from "react";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Highlight } from "prism-react-renderer";
import { themes } from "prism-react-renderer";
import { ContactUs } from "../components/ContactUs";

export default function Docs() {
	// Copy functionality
	const [copied, setCopied] = useState(false);
	const apiExample = `curl -H 'Authorization:123456' \\
	"https://darkbastion.com/edgar?filingId=2001260/000149315225004050/0001493152-25-004050.json"`;

	const handleCopy = () => {
		navigator.clipboard.writeText(apiExample);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="p-8 max-w-3xl mx-auto bg-white shadow-xl rounded-lg mt-12">
			{/* Page Title */}
			<h1 className="text-4xl font-bold text-gray-900 text-center">
				📄 EDGAR JSON API Docs
			</h1>
			<p className="text-gray-600 mt-4 text-lg text-center">
				Convert SEC filings into structured JSON with a simple API call.
			</p>

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
					<p className="text-blue-600 text-sm break-all">
						https://www.sec.gov/Archives/edgar/data/2001260/000149315225004050/0001493152-25-004050-index.htm
					</p>
					<p className="text-gray-800 font-mono text-sm mt-2">
						<strong>Converted API URL:</strong>
					</p>
					<p className="text-green-600 text-sm break-all">
						https://darkbastion.com/edgar?filingId=2001260/000149315225004050/0001493152-25-004050.json
					</p>
				</div>
			</div>

			{/* API Example with Copy Button */}
			<div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-md">
				<h2 className="text-2xl font-semibold text-gray-900">
					⚡ API Request Example
				</h2>
				<p className="text-gray-700 mt-2">
					Use the following <strong>cURL command</strong> to fetch an SEC filing
					as JSON.
				</p>

				{/* Highlighted Code Block */}
				<div className="relative mt-4 border border-gray-400 bg-gray-900 rounded-lg shadow-lg">
					<Highlight code={apiExample} language="bash" theme={themes.github}>
						{({ className, style, tokens, getLineProps, getTokenProps }) => (
							<pre
								className={`${className} p-5 rounded-md text-white overflow-x-auto whitespace-pre-wrap`}
								style={style}
							>
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

					{/* Copy Button */}
					<button
						type="button"
						onClick={handleCopy}
						className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-md flex items-center"
					>
						{copied ? (
							<>
								<CheckIcon className="h-4 w-4 mr-1" /> Copied!
							</>
						) : (
							<>
								<ClipboardIcon className="h-4 w-4 mr-1" /> Copy
							</>
						)}
					</button>
				</div>
			</div>

			{/* API Key Requirement */}
			<div className="mt-8 p-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 rounded-md">
				<h3 className="text-lg font-semibold">⚠️ API Key Required</h3>
				<p className="mt-1 text-sm">
					You <strong>must include an API key</strong> in the request headers.
					If you don’t have one yet, <strong>get your key here:</strong>
				</p>
				<a
					href="/dashboard"
					className="mt-3 inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition"
				>
					Get Your API Key 🔑
				</a>
			</div>

			{/* Contact */}
			<ContactUs />
		</div>
	);
}
