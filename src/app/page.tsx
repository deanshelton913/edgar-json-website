export default function Home() {
	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 space-y-4">
			{/* Hero Section */}
			<section className="text-center pt-16 flex flex-col items-center gap-4">
				<h1 className="text-5xl font-bold text-gray-900">EDGAR JSON API</h1>
				<p className="text-lg text-gray-700 max-w-lg">
					Get structured SEC filings instantly.
				</p>
				<a
					href="/api-key"
					className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition inline-block"
				>
					Get API Key for $1/Month
				</a>
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
							className="text-gray-300 overflow-auto max-h-56 p-3 bg-gray-800 rounded"
							style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
						>
							{`
<SEC-DOCUMENT>0001104659-25-006631.txt : 20250128
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
							className="text-gray-300 overflow-auto max-h-56 p-3 bg-gray-800 rounded"
							style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
						>
							{/* Placeholder for JSON Output */}
							{`
{
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

			<section className="py-12 px-6 max-w-5xl text-center">
				<h2 className="text-4xl font-bold  text-gray-900">
					Why Developers Love This API 🚀
				</h2>
				<p className="text-lg text-gray-700 mt-3">
					Get SEC filings in a format you can actually use.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
					{/* Feature 1 */}
					<div className="p-6 bg-white shadow-lg rounded-lg transform hover:scale-105 transition">
						<div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-white rounded-full mx-auto mb-4">
							🗂️
						</div>
						<h3 className="text-xl font-bold text-gray-900">
							Structured & Reliable
						</h3>
						<p className="text-gray-700 mt-2">
							No more messy TXT files—get clean, structured JSON that makes
							sense.
						</p>
					</div>

					{/* Feature 2 */}
					<div className="p-6 bg-white shadow-lg rounded-lg transform hover:scale-105 transition">
						<div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-white rounded-full mx-auto mb-4">
							⚡
						</div>
						<h3 className="text-xl font-bold text-gray-900">
							Lightning-Fast Queries
						</h3>
						<p className="text-gray-700 mt-2">
							Get SEC filing data optimized for performance.
						</p>
					</div>

					{/* Feature 3 */}
					<div className="p-6 bg-white shadow-lg rounded-lg transform hover:scale-105 transition">
						<div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-white rounded-full mx-auto mb-4">
							💻
						</div>
						<h3 className="text-xl font-bold text-gray-900">
							Made for Developers
						</h3>
						<p className="text-gray-700 mt-2">
							RESTful API that integrates seamlessly with your stack.
						</p>
					</div>
				</div>
			</section>

			{/* Footer CTA */}
			<section className="py-12 text-center">
				<h2 className="text-3xl font-semibold text-gray-900">
					Start Using EDGAR API Today
				</h2>
				<p className="text-gray-700 mt-2">
					Get instant access to structured SEC filings.
				</p>
				<a
					href="/api-key"
					className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition inline-block"
				>
					Get Started for $1/Month
				</a>
			</section>
		</main>
	);
}
