"use client";

import { ContactUs } from "../components/ContactUs";

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


	return (
		<div className="p-8 max-w-3xl mx-auto bg-white shadow-xl rounded-lg mt-12">
			{/* Page Title */}
			<h1 className="text-4xl font-bold text-gray-900 text-center">
				📄 EDGAR JSON API Docs
			</h1>
			<p className="text-gray-600 mt-4 text-lg text-center">
				Retrieve SEC EDGAR filings as structured JSON with a simple API call.
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




			{/* Contact */}
			<ContactUs />
		</div>
	);
}
