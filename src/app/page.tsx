'use client';

import { useState, useEffect } from 'react';
import GoogleLoginButton from './components/GoogleLoginButton';

export default function Home() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		checkAuthStatus();
	}, []);

	const checkAuthStatus = async () => {
		try {
			const response = await fetch('/api/auth/user');
			if (response.ok) {
				const data = await response.json();
				setIsAuthenticated(data.authenticated);
			}
		} catch (error) {
			console.error('Error checking auth status:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCTAClick = () => {
		if (isAuthenticated) {
			window.location.href = '/api-key';
		} else {
			setShowLoginModal(true);
		}
	};

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 space-y-4 relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
			</div>
			{/* Hero Section */}
			<section className="text-center pt-0 flex flex-col items-center gap-6 relative z-10">
				
				<h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight">
					EDGAR <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">JSON</span> API
				</h1>
				<p className="text-2xl text-gray-700 max-w-3xl leading-relaxed">
					Transform SEC filings into structured JSON for AI analysis. 
					<span className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> Save 75-80% on AI processing costs</span> with clean, structured data.
				</p>
				
				
				<button
					onClick={handleCTAClick}
					disabled={isLoading}
					className="mt-6 px-8 py-4 bg-blue-600 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 text-xl font-bold relative overflow-hidden group"
				>
					<span className="relative z-10 flex items-center gap-3">
						<span className="text-2xl">🔑</span>
						{isLoading ? 'Loading...' : 'Get Your FREE API Key!'}
					</span>
					<div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</button>
			</section>

			{/* Example Comparison Section */}
			<section className="py-12 px-6 max-w-5xl">
				<h2 className="text-3xl font-semibold text-center text-gray-900">
					Raw Filings vs. JSON
				</h2>
				<p className="text-center text-gray-700 mt-2">
					Compare how our API transforms SEC filings into structured JSON.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
					{/* Raw TXT Example */}
					<div className="p-6 bg-gray-900 text-white shadow-lg rounded-lg">
						<h3 className="text-xl font-bold mb-3 text-gray-100">
							SEC Raw Filing (TXT)
						</h3>
						<pre
							className="text-gray-300 overflow-auto max-h-56 p-3 bg-gray-800 rounded text-xxs"
							style={{
								scrollbarWidth: "none",
								msOverflowStyle: "none",
								fontSize: "10px",
							}}
						>
							{`<SEC-DOCUMENT>0001104659-25-006631.txt : 20250128
<SEC-HEADER>0001104659-25-006631.hdr.sgml : 20250128
<ACCEPTANCE-DATETIME>20250128140548
ACCESSION NUMBER:		0001104659-25-006631
CONFORMED SUBMISSION TYPE:	SF-3/A
PUBLIC DOCUMENT COUNT:		28
<DEPOSITOR-CIK>0000872471
<SPONSOR-CIK>0000038009
FILED AS OF DATE:		20250128
DATE AS OF CHANGE:		20250128
ABS ASSET CLASS:             	Floorplan financings

FILER:

	COMPANY DATA:	
		COMPANY CONFORMED NAME:			FORD CREDIT FLOORPLAN MASTER OWNER TRUST A
		CENTRAL INDEX KEY:			0001159408
		STANDARD INDUSTRIAL CLASSIFICATION:	ASSET-BACKED SECURITIES [6189]
		ORGANIZATION NAME:           	Office of Structured Finance
		IRS NUMBER:				386787145
		STATE OF INCORPORATION:			DE
		FISCAL YEAR END:			1231

...

</TEXT>
</DOCUMENT>
</SEC-DOCUMENT>
              `}
						</pre>
					</div>

					{/* Structured JSON Example */}
					<div className="p-6 bg-gray-900 text-white shadow-lg rounded-lg">
						<h3 className="text-xl font-bold mb-3 text-gray-100">
							Structured JSON Output
						</h3>
						<pre
							className="text-gray-300 overflow-auto max-h-56 p-3 bg-gray-800 rounded text-xxs"
							style={{
								scrollbarWidth: "none",
								msOverflowStyle: "none",
								fontSize: "10px",
							}}
						>
							{/* Placeholder for JSON Output */}
							{`{
    "acceptanceDatetime": "20250128140548",
    "accessionNumber": "0001104659-25-006631",
    "conformedSubmissionType": "SF-3/A",
    "publicDocumentCount": "28",
    "depositorCik": "0000872471",
    "sponsorCik": "0000038009",
    "filedAsOfDate": "20250128",
    "dateAsOfChange": 20250128,
    "absAssetClass": "Floorplan financings",
    "filer": [
        {
          businessAddress: {
            businessPhone: "313-323-7070",
            city: "DEARBORN",
            state: "MI",
            street1: "ONE AMERICAN ROAD",
            zip: "48126",
          },
          companyData: {
            centralIndexKey: "0001159408",
            companyConformedName: "FORD CREDIT FLOORPLAN MASTER OWNER TRUST A",
            fiscalYearEnd: "1231",
            irsNumber: "386787145",
            organizationName: "Office of Structured Finance",
            standardIndustrialClassification: "ASSET-BACKED SECURITIES [6189]",
            stateOfIncorporation: "DE",
          },
          filingValues: {
            filmNumber: "25563105",
            formType: "SF-3/A",
            secAct: "1933 Act",
            secFileNumber: "333-283567",
          },
          mailAddress: {
            city: "DEARBORN",
            state: "MI",
            street1: "ONE AMERICAN ROAD",
            zip: "48126",
          },
        },
        {
          businessAddress: {
            businessPhone: "313-594-3495",
            city: "DEARBORN",
            state: "MI",
            street1: "ONE AMERICAN ROAD",
            zip: "48126",
          },
          companyData: {
            centralIndexKey: "0000872471",
            companyConformedName: "Ford Credit Floorplan Corp",
            fiscalYearEnd: "1231",
            irsNumber: "382973806",
            organizationName: "Office of Structured Finance",
            standardIndustrialClassification: "ASSET-BACKED SECURITIES [6189]",
            stateOfIncorporation: "DE",
          },
          filingValues: {
            filmNumber: "25563107",
            formType: "SF-3/A",
            secAct: "1933 Act",
            secFileNumber: "333-283567-02",
          },
          formerCompany: [
            {
              dateOfNameChange: "20010731",
              formerConformedName: "FORD CREDIT FLOORPLAN CORP",
            },
            {
              dateOfNameChange: "19921111",
              formerConformedName: "FORD CREDIT AUTO RECEIVABLES CORP",
            },
          ],
          mailAddress: {
            city: "DEARBORN",
            state: "MI",
            street1: "ONE AMERICAN ROAD",
            zip: "48126",
          },
        },
        {
          businessAddress: {
            city: "DEARBORN",
            state: "MI",
            street1: "ONE AMERICAN ROAD",
            street2: "ROOM 1034",
            zip: "48126",
          },
          companyData: {
            centralIndexKey: "0001061198",
            companyConformedName: "FORD CREDIT FLOORPLAN LLC",
            fiscalYearEnd: "1231",
            irsNumber: "383372243",
            organizationName: "Office of Structured Finance",
            standardIndustrialClassification: "ASSET-BACKED SECURITIES [6189]",
            stateOfIncorporation: "DE",
          },
          filingValues: {
            filmNumber: "25563106",
            formType: "SF-3/A",
            secAct: "1933 Act",
            secFileNumber: "333-283567-01",
          },
          mailAddress: {
            city: "DEARBORN",
            state: "MI",
            street1: "ONE AMERICAN ROAD",
            street2: "ROOM 1034",
            zip: "48126",
          },
        },
      ],
  "attachments": [
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp1img001.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp1img002.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp1img003.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp1img004.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp1img005.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp4img001.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp4img002.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp4img003.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp4img004.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp4img005.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp5img001.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d1_sf3sp5img002.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d4_sf3aimg023.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d5_ex5-1img001.jpg",
    "/872471/000110465925006631/0001104659-25-006631/tm2429876d5_ex8-1img001.jpg"
  ]
}
`}
						</pre>
					</div>
				</div>
			</section>

			{/* AI Benefits Section */}
			<section id="ai-benefits" className="py-12 px-6 max-w-6xl">
				<h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
					Why AI Developers Choose Our API 🤖
				</h2>
				<p className="text-lg text-gray-700 text-center mb-8">
					Transform your AI processing costs with structured SEC data
				</p>

				{/* Cost Comparison */}
				<div className="bg-gradient-to-r from-red-50 via-white to-green-50 rounded-3xl p-8 mb-8 shadow-2xl border-2 border-gray-100 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-r from-red-100/20 via-transparent to-green-100/20"></div>
					<div className="relative z-10">
						<div className="text-center mb-8">
							<h3 className="text-3xl font-black text-gray-900 mb-2">
								AI Processing Cost Comparison
							</h3>
							<p className="text-lg text-gray-600">See the dramatic cost savings in action</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{/* Raw Processing */}
							<div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-red-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
								<div className="flex items-center mb-6">
									<div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 animate-pulse">
										<span className="text-2xl">❌</span>
									</div>
									<h4 className="text-2xl font-bold text-red-600">Raw SEC Filing Processing</h4>
								</div>
								<div className="space-y-3 text-gray-700">
									<div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
										<span><strong>Typical 10-K:</strong></span>
										<span className="font-bold text-red-600">~300,000 tokens</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
										<span><strong>GPT-4 Input Cost:</strong></span>
										<span>$0.03 per 1K tokens</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
										<span><strong>Processing Cost:</strong></span>
										<span className="font-bold text-red-600">300K × $0.03/1K = $9.00</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
										<span><strong>Output Cost:</strong></span>
										<span>~$0.06 per 1K tokens</span>
									</div>
									<div className="bg-red-100 border-2 border-red-200 rounded-xl p-4 text-center">
										<p className="text-sm text-red-600 mb-1">Total Cost</p>
										<p className="text-3xl font-black text-red-600">$12-15</p>
										<p className="text-sm text-red-600">per analysis</p>
									</div>
								</div>
							</div>

							{/* Structured Processing */}
							<div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-green-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
								<div className="flex items-center mb-6">
									<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 animate-pulse">
										<span className="text-2xl">✅</span>
									</div>
									<h4 className="text-2xl font-bold text-green-600">Structured JSON Processing</h4>
								</div>
								<div className="space-y-3 text-gray-700">
									<div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
										<span><strong>Parsed Data:</strong></span>
										<span className="font-bold text-green-600">~15,000 tokens</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
										<span><strong>GPT-4 Input Cost:</strong></span>
										<span>$0.03 per 1K tokens</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
										<span><strong>Processing Cost:</strong></span>
										<span className="font-bold text-green-600">15K × $0.03/1K = $0.45</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
										<span><strong>Output Cost:</strong></span>
										<span>Similar analysis</span>
									</div>
									<div className="bg-green-100 border-2 border-green-200 rounded-xl p-4 text-center">
										<p className="text-sm text-green-600 mb-1">Total Cost</p>
										<p className="text-3xl font-black text-green-600">$2-3</p>
										<p className="text-sm text-green-600">per analysis</p>
									</div>
								</div>
							</div>
						</div>
						<div className="text-center mt-8">
							<div className="inline-flex items-center gap-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-6 border-2 border-green-200">
								<div className="text-4xl">💰</div>
								<div>
									<p className="text-3xl font-black text-green-600 mb-1">
										Save 75-80% on AI processing costs!
									</p>
									<p className="text-sm text-gray-600">
										Sources: <a href="https://openai.com/pricing" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-600">OpenAI API Pricing</a> | 
										<a href="https://www.sec.gov/newsroom/speeches-statements/lee-structured-data-2020-11-17" target="_blank" rel="noopener noreferrer" className="underline ml-1 hover:text-green-600">SEC Structured Data Benefits</a>
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* AI Benefits Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{/* Feature 1 */}
					<div className="group p-8 bg-white shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 border-2 border-blue-100 hover:border-blue-200 hover:shadow-2xl">
						<div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
							<span className="text-3xl animate-pulse">🤖</span>
						</div>
						<h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
							AI-Optimized Data
						</h3>
						<p className="text-gray-700 text-center leading-relaxed">
							Structured JSON eliminates boilerplate text, reducing token usage by <span className="font-bold text-blue-600">80%</span> and processing costs by <span className="font-bold text-green-600">75%</span>.
						</p>
						<div className="mt-4 flex justify-center">
							<div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
								Token Reduction: 80%
							</div>
						</div>
					</div>

					{/* Feature 2 */}
					<div className="group p-8 bg-white shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 border-2 border-green-100 hover:border-green-200 hover:shadow-2xl">
						<div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
							<span className="text-3xl animate-bounce">⚡</span>
						</div>
						<h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
							Real-Time Analysis
						</h3>
						<p className="text-gray-700 text-center leading-relaxed">
							Process filings instantly as they&apos;re published. Perfect for AI-powered trading algorithms and research tools.
						</p>
						<div className="mt-4 flex justify-center">
							<div className="bg-green-50 text-green-600 px-4 py-2 rounded-full text-sm font-semibold">
								Speed: 5-10x Faster
							</div>
						</div>
					</div>

					{/* Feature 3 */}
					<div className="group p-8 bg-white shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 border-2 border-purple-100 hover:border-purple-200 hover:shadow-2xl">
						<div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
							<span className="text-3xl animate-pulse">🎯</span>
						</div>
						<h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
							Consistent Format
						</h3>
						<p className="text-gray-700 text-center leading-relaxed">
							Reliable data structure means higher AI accuracy and fewer processing errors. No more parsing inconsistencies.
						</p>
						<div className="mt-4 flex justify-center">
							<div className="bg-purple-50 text-purple-600 px-4 py-2 rounded-full text-sm font-semibold">
								Accuracy: 95%+
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16 px-6 max-w-6xl text-center relative">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-3xl opacity-50"></div>
				<div className="relative z-10">
					<h2 className="text-5xl font-black text-gray-900 mb-4">
						Perfect for AI Applications <span className="text-4xl">🚀</span>
					</h2>
					<p className="text-xl text-gray-700 mt-3 mb-12">
						Build AI-powered financial analysis tools with confidence
					</p>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
						{/* Use Case 1 */}
						<div className="group p-8 bg-white shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 border-2 border-blue-100 hover:border-blue-200 hover:shadow-2xl">
							<div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📊</div>
							<h3 className="text-xl font-bold text-gray-900 mb-3">Investment Research</h3>
							<p className="text-gray-600 leading-relaxed">Automated equity analysis and due diligence</p>
							<div className="mt-4 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold">
								AI-Powered Analysis
							</div>
						</div>

						{/* Use Case 2 */}
						<div className="group p-8 bg-white shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 border-2 border-green-100 hover:border-green-200 hover:shadow-2xl">
							<div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🔍</div>
							<h3 className="text-xl font-bold text-gray-900 mb-3">Risk Monitoring</h3>
							<p className="text-gray-600 leading-relaxed">AI-powered compliance and risk detection</p>
							<div className="mt-4 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">
								Real-Time Alerts
							</div>
						</div>

						{/* Use Case 3 */}
						<div className="group p-8 bg-white shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 border-2 border-purple-100 hover:border-purple-200 hover:shadow-2xl">
							<div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📈</div>
							<h3 className="text-xl font-bold text-gray-900 mb-3">Market Intelligence</h3>
							<p className="text-gray-600 leading-relaxed">Trend analysis and sector insights</p>
							<div className="mt-4 bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-semibold">
								Pattern Recognition
							</div>
						</div>

						{/* Use Case 4 */}
						<div className="group p-8 bg-white shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 border-2 border-orange-100 hover:border-orange-200 hover:shadow-2xl">
							<div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🤖</div>
							<h3 className="text-xl font-bold text-gray-900 mb-3">Trading Algorithms</h3>
							<p className="text-gray-600 leading-relaxed">Real-time filing analysis for automated trading</p>
							<div className="mt-4 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
								Instant Processing
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Sources & Documentation */}
			<section className="py-8 px-6 max-w-4xl">
				<h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
					Sources & Documentation 📚
				</h3>
				<div className="bg-gray-50 rounded-lg p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 className="font-semibold text-gray-900 mb-3">Cost Analysis Sources</h4>
							<ul className="space-y-2 text-sm text-gray-700">
								<li>
									<a href="https://openai.com/pricing" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
										OpenAI API Pricing (Official)
									</a>
								</li>
								<li>
									<a href="https://www.sec.gov/newsroom/speeches-statements/lee-structured-data-2020-11-17" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
										SEC: Benefits of Structured Data
									</a>
								</li>
								<li>
									<a href="https://blog.dottxt.ai/extracting-financial-data.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
										Financial Data Extraction Best Practices
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold text-gray-900 mb-3">Coming Soon</h4>
							<ul className="space-y-2 text-sm text-gray-700">
								<li>
									<span className="text-gray-500">API Documentation</span>
								</li>
								<li>
									<span className="text-gray-500">AI Integration Guide</span>
								</li>
								<li>
									<span className="text-gray-500">Code Examples & SDKs</span>
								</li>
							</ul>
						</div>
					</div>
					<div className="mt-6 p-4 bg-blue-50 rounded-lg">
						<p className="text-sm text-blue-800">
							<strong>Note:</strong> Cost savings are based on OpenAI GPT-4 pricing as of January 2024. 
							Actual savings may vary based on AI model choice and processing requirements. 
							Token counts are estimates based on typical SEC filing sizes.
						</p>
					</div>
				</div>
			</section>

			{/* Footer CTA */}
			<section className="py-12 text-center">
				<h2 className="text-3xl font-semibold text-gray-900">
					Ready to Build AI-Powered Financial Tools?
				</h2>
				<p className="text-gray-700 mt-2">
					Join developers saving 75-80% on AI processing costs with structured SEC data.
				</p>
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto mt-4">
					<p className="text-sm text-blue-800">
						<strong>Free Tier:</strong> 100 requests/day • <strong>Pro Tier:</strong> 10,000 requests/day • 
						<strong>Enterprise:</strong> Custom limits + MCP access
					</p>
				</div>
				<button
					onClick={handleCTAClick}
					disabled={isLoading}
					className="mt-6 px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition inline-block disabled:opacity-50 text-lg font-semibold"
				>
					{isLoading ? 'Loading...' : '🔑 Get FREE API Key & Start Building'}
				</button>
				<p className="text-xs text-gray-500 mt-3">
					No credit card required • Instant access • Full documentation included
				</p>
			</section>

			{/* Login Modal */}
			{showLoginModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-xl relative">
						{/* X Button */}
						<button
							onClick={() => setShowLoginModal(false)}
							className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition p-1 bg-transparent border-none outline-none"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
						
						<div className="text-center">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
								🔑
							</div>
							<h3 className="text-2xl font-bold text-gray-900 mb-2">
								Just One Thing First
							</h3>
							<p className="text-gray-600 mb-6">
								Sign in with Google and we&apos;ll get your FREE API key ready in seconds!
							</p>
							<div className="flex justify-center">
								<GoogleLoginButton />
							</div>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
