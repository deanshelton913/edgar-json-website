"use client";

import { useState } from "react";
import {
	ClipboardIcon,
	CheckIcon,
	ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Highlight } from "prism-react-renderer";
import { themes } from "prism-react-renderer";
import { ContactUs } from "../components/ContactUs";

export default function Docs() {
	// Copy functionality
	const [copied1, setCopied1] = useState(false);
	const [copied2, setCopied2] = useState(false);
	const apiExample1 = `curl -H 'Authorization: demo-key' \\
  "https://api.edgar-json.com/filings/312070/000095010325001140/0000950103-25-001140.json"`;

	const apiExample2 = `curl -H "Authorization: demo-key" \
     -X GET \   
     "https://api.edgar-json.com/filings/312070/000095010325001140/0000950103-25-001140/image_001.jpg" --output /tmp/image_001.jpg`;
	const handleCopy1 = () => {
		navigator.clipboard.writeText(apiExample1);
		setCopied1(true);
		setTimeout(() => setCopied1(false), 2000);
	};
	const handleCopy2 = () => {
		navigator.clipboard.writeText(apiExample1);
		setCopied2(true);
		setTimeout(() => setCopied2(false), 2000);
	};

	// Accordion state for Form 4 example
	const [showForm4, setShowForm4] = useState(false);

	// Example JSON snippet for a simplified Form 4
	const form4ExampleJson = `{
/**
 * attachments: string[]
 * 
 * The decoded S3 keypaths of the uuencoded 
 * attachment files found in the document. They are available 
 * for 14 days at url suffix provided in the array, and can 
 * be downloaded the same way you got the base-document.  
 */
  "attachments": [],
/** 
 * basic:
 * {
 *   "accessionNumber": string,
 *   "acceptanceDatetime": number, // unix timestamp
 *   "publicDocumentCount": string,
 *   "filedAsOfDate": number, // unix timestamp
 *   "submissionType": string,
 *   "url": string, // url of orig filing.
 * } 
 * Data that is consistent between all document types, 
 * parsed into a  more usable format.
 */
  "basic": {
    "accessionNumber": "0001628280-25-003035",
    "acceptanceDatetime": 1738185950,
    "publicDocumentCount": "1",
    "filedAsOfDate": 1738123200,
    "submissionType": "4",
    "url": "https://www.sec.gov/Archives/edgar/data/1043000/000162828025003035/0001628280-25-003035.txt"
  },

/**
 * (slated for deprecation)
 * \`estimatedImpact\` is a rough internal sentiment analysis result
 * of this document. This value is derived internally and may not be 
 * useful for external applications. 
 */
  "estimatedImpact": {
    "marketImpact": "neutral",
    "confidence": 0.6,
    "totalScore": 0.00023202,
    "sentiment": 0.00232019
  },

/**
 * parsed 
 * See sec-edgar-parser for types per "conformedSubmissionType."
 * 
 * This value contains the extracted keys and values from the document. 
 * All values are stored as strings to preserve numerical integrity, 
 * including leading zeros and other formatting quirks that JSON/JS 
 * cannot natively handle.
 * 
 * The document undergoes preprocessing before being parsed. Some 
 * parts as YAML, others as XML. Then normalized into JSON.
 * 
 * NOTE: This is a "best effort" parsing process. While most documents 
 * are handled by a single parser, some require additional logic. 
 * If data is missing, a custom parser may be needed for that document type.
 * 
 * If you encounter missing data, please contact the support email 
 * listed on this site so we can enhance parsing for your document.
 */
  "parsed": {
    "acceptanceDatetime": "20250129172550",
    "accessionNumber": "0001628280-25-003035",
    "conformedSubmissionType": "4",
    "publicDocumentCount": "1",
    "conformedPeriodOfReport": "20241231",
    "filedAsOfDate": "20250129",
    "dateAsOfChange": "20250129",
    "reportingOwner": [
      {
        "ownerData": {
          "companyConformedName": "BRICKMAN DAVID R",
          "centralIndexKey": "0001257152",
          "organizationName": null
        },
        "filingValues": {
          "formType": "4",
          "secAct": "1934 Act",
          "secFileNumber": "001-13445",
          "filmNumber": "25570410"
        },
        "mailAddress": {
          "street1": "14160 DALLAS PARWAY",
          "street2": "STE 300",
          "city": "DALLAS",
          "state": "TX",
          "zip": "75254"
        }
      }
    ],
    "issuer": [
      {
        "companyData": {
          "companyConformedName": "SONIDA SENIOR LIVING, INC.",
          "centralIndexKey": "0001043000",
          "standardIndustrialClassification": "SERVICES-NURSING & PERSONAL CARE FACILITIES [8050]",
          "organizationName": "08 Industrial Applications and Services",
          "irsNumber": "752678809",
          "stateOfIncorporation": "DE",
          "fiscalYearEnd": "1231"
        },
        "businessAddress": {
          "street1": "16301 QUORUM DRIVE",
          "street2": "SUITE 160A",
          "city": "ADDISON",
          "state": "TX",
          "zip": "75001",
          "businessPhone": "9727705600"
        },
        "mailAddress": {
          "street1": "16301 QUORUM DRIVE",
          "street2": "SUITE 160A",
          "city": "ADDISON",
          "state": "TX",
          "zip": "75001"
        },
        "formerCompany": [
          {
            "formerConformedName": "CAPITAL SENIOR LIVING CORP",
            "dateOfNameChange": "19970724"
          }
        ]
      }
    ],
    "ownershipDocument": {
      "schemaVersion": "X0508",
      "documentType": 4,
      "periodOfReport": "2024-12-31",
      "notSubjectToSection16": 1,
      "issuer": [
        {
          "issuerCik": "0001043000",
          "issuerName": "SONIDA SENIOR LIVING, INC.",
          "issuerTradingSymbol": "SNDA"
        }
      ],
      "reportingOwner": [
        {
          "reportingOwnerId": {
            "rptOwnerCik": "0001257152",
            "rptOwnerName": "BRICKMAN DAVID R"
          },
          "reportingOwnerAddress": {
            "rptOwnerStreet1": "14755 PRESTON ROAD",
            "rptOwnerStreet2": "SUITE 810",
            "rptOwnerCity": "DALLAS",
            "rptOwnerState": "TX",
            "rptOwnerZipCode": 75254,
            "rptOwnerStateDescription": ""
          },
          "reportingOwnerRelationship": {
            "isDirector": 0,
            "isOfficer": 1,
            "isTenPercentOwner": 0,
            "isOther": 0,
            "officerTitle": "SVP Gen. Counsel & Secretary"
          }
        }
      ],
      "aff10b5One": 0,
      "nonDerivativeTable": {
        "nonDerivativeTransaction": [
          {
            "securityTitle": {
              "value": "Common Stock"
            },
            "transactionDate": {
              "value": "2024-12-31"
            },
            "transactionCoding": {
              "transactionFormType": 4,
              "transactionCode": "F",
              "equitySwapInvolved": 0
            },
            "transactionAmounts": {
              "transactionShares": {
                "value": 1671
              },
              "transactionPricePerShare": {
                "value": 22.74,
                "footnoteId": ""
              },
              "transactionAcquiredDisposedCode": {
                "value": "D"
              }
            },
            "postTransactionAmounts": {
              "sharesOwnedFollowingTransaction": {
                "value": 114298
              }
            },
            "ownershipNature": {
              "directOrIndirectOwnership": {
                "value": "D"
              }
            }
          },
          {
            "securityTitle": {
              "value": "Common Stock"
            },
            "transactionDate": {
              "value": "2024-12-31"
            },
            "transactionCoding": {
              "transactionFormType": 4,
              "transactionCode": "D",
              "equitySwapInvolved": 0
            },
            "transactionAmounts": {
              "transactionShares": {
                "value": 76873
              },
              "transactionPricePerShare": {
                "value": 0
              },
              "transactionAcquiredDisposedCode": {
                "value": "D"
              }
            },
            "postTransactionAmounts": {
              "sharesOwnedFollowingTransaction": {
                "value": 37425
              }
            },
            "ownershipNature": {
              "directOrIndirectOwnership": {
                "value": "D"
              }
            }
          }
        ]
      },
      "derivativeTable": "",
      "footnotes": {
        "footnote": "Represents shares that were withheld upon vesting of restricted stock to satisfy tax withholding obligations."
      },
      "remarks": "",
      "ownerSignature": {
        "signatureName": "/s/ David Brickman",
        "signatureDate": "2025-01-24"
      }
    }
  }
}`;

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
							312070/000095010325001140/0000950103-25-001140
						</span>
						-index.htm
					</p>
					<p className="text-gray-800 font-mono text-sm mt-2">
						<strong>Converted API URL:</strong>
					</p>
					<p className=" text-sm break-all">
						https://edgar-json.com/filings/
						<span className="text-green-600">
							312070/000095010325001140/0000950103-25-001140
						</span>
						.json
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
					<Highlight code={apiExample1} language="bash" theme={themes.github}>
						{({ className, style, tokens, getLineProps, getTokenProps }) => (
							<pre
								className={`${className} p-5 rounded-md text-white overflow-x-auto whitespace-pre-wrap text-sm`}
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
						onClick={handleCopy1}
						className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-md flex items-center"
					>
						{copied1 ? (
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
				{/* Form 4 Accordion */}
				<div className="mt-6">
					<button
						type="button"
						className="flex items-center justify-between w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none"
						onClick={() => setShowForm4(!showForm4)}
					>
						<span className="font-medium text-gray-900">
							Show Example JSON filing
						</span>
						<ChevronDownIcon
							className={`h-5 w-5 transform transition-transform duration-200 ${
								showForm4 ? "rotate-180" : ""
							}`}
						/>
					</button>

					{showForm4 && (
						<div className="mt-2 border border-gray-300 rounded-md bg-gray-100 overflow-x-auto">
							<Highlight
								code={form4ExampleJson}
								language="json"
								theme={themes.github}
							>
								{({
									className,
									style,
									tokens,
									getLineProps,
									getTokenProps,
								}) => (
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
				{/* Highlighted Code Block */}
				<div className="relative mt-4 border border-gray-400 bg-gray-900 rounded-lg shadow-lg">
					<Highlight code={apiExample2} language="bash" theme={themes.github}>
						{({ className, style, tokens, getLineProps, getTokenProps }) => (
							<pre
								className={`${className} p-5 rounded-md text-white overflow-x-auto whitespace-pre-wrap text-sm`}
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
						onClick={handleCopy2}
						className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-md flex items-center"
					>
						{copied2 ? (
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
					href="/api-key"
					className="mt-3 inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition"
				>
					Get Your API Key 🔑
				</a>
			</div>

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
