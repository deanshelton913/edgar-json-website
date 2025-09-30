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
				🛠️ Support Center
			</h1>
			<p className="text-gray-600 mt-4 text-lg text-center">
				Get help with the EDGAR JSON API, find answers to common questions, and connect with our community.
			</p>


			{/* Quick Start */}
			<div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-md">
				<h2 className="text-2xl font-semibold text-gray-900">
					🚀 Quick Start Guide
				</h2>
				<p className="text-gray-700 mt-2">
					Convert any SEC filing URL to get structured JSON data with a simple API call.
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
						<strong>API Endpoint:</strong>
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

			{/* Common Issues */}
			<div className="mt-8 p-6 bg-yellow-50 rounded-lg shadow-md">
				<h2 className="text-2xl font-semibold text-gray-900">
					❓ Common Issues & Solutions
				</h2>
				<div className="mt-4 space-y-3">
					<div className="p-3 bg-white rounded border-l-4 border-blue-500">
						<h3 className="font-semibold text-gray-900">Rate Limit Exceeded</h3>
						<p className="text-gray-700 text-sm mt-1">
							Upgrade to Pro for higher rate limits, or wait for your limit to reset.
						</p>
					</div>
					<div className="p-3 bg-white rounded border-l-4 border-green-500">
						<h3 className="font-semibold text-gray-900">Invalid Filing URL</h3>
						<p className="text-gray-700 text-sm mt-1">
							Ensure the URL follows the correct SEC EDGAR format and ends with .txt
						</p>
					</div>
					<div className="p-3 bg-white rounded border-l-4 border-purple-500">
						<h3 className="font-semibold text-gray-900">Authentication Required</h3>
						<p className="text-gray-700 text-sm mt-1">
							Sign up for an account and get your API key to access the service.
						</p>
					</div>
				</div>
			</div>




			{/* Support Resources */}
			<div className="mt-8 p-6 bg-blue-50 rounded-lg shadow-md">
				<h2 className="text-2xl font-semibold text-gray-900">
					💬 Get Support
				</h2>
				<p className="text-gray-700 mt-2">
					Need help? Connect with our community and get assistance from other developers.
				</p>
				
				<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-4 bg-white rounded-lg border">
						<h3 className="font-semibold text-gray-900 mb-2">💬 Slack Community</h3>
						<p className="text-gray-600 text-sm mb-3">
							Join our active Slack workspace for real-time help and discussions.
						</p>
						<a 
							href="https://join.slack.com/t/mukilteotechworkspace/shared_invite/zt-3ehy7g3gj-4WZ_4Vm1K5r8S_Awkuc~5Q"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200"
						>
							<img 
								src="/slack-logo.svg" 
								alt="Slack" 
								className="w-4 h-4 mr-2" 
							/>
							Join Slack
						</a>
					</div>
					
					<div className="p-4 bg-white rounded-lg border">
						<h3 className="font-semibold text-gray-900 mb-2">📧 Direct Support</h3>
						<p className="text-gray-600 text-sm mb-3">
							Contact us directly for technical issues or billing questions.
						</p>
						<a 
							href="mailto:support@edgar-json.com"
							className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
						>
							📧 Email Support
						</a>
					</div>
				</div>
			</div>

			{/* Contact */}
			<ContactUs />
		</div>
	);
}
