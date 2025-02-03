import React from "react";

const TermsOfUse = () => {
	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-4">
				TERMS OF USE FOR EDGAR PARSING API
			</h1>
			<p className="text-sm mb-6">Last Updated: February 2, 2025</p>

			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">1. ACCEPTANCE OF TERMS</h2>
				<p>
					By accessing or using the EDGAR Parsing API ("API"), you ("User")
					agree to be bound by these Terms of Use ("Terms"). If you do not agree
					to these Terms, do not use the API. The provider ("Provider") reserves
					the right to modify these Terms at any time, and continued use of the
					API constitutes acceptance of any such modifications.
				</p>
			</div>

			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">
					2. DISCLAIMER OF WARRANTIES
				</h2>
				<p>
					THE API IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF
					ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
					IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
					PURPOSE, NON-INFRINGEMENT, OR ACCURACY. THE PROVIDER DOES NOT
					GUARANTEE THAT THE API WILL BE ERROR-FREE, UNINTERRUPTED, OR FREE FROM
					HARMFUL COMPONENTS. USERS RELY ON THE DATA PROVIDED AT THEIR OWN RISK.
				</p>
			</div>

			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">
					3. LIMITATION OF LIABILITY
				</h2>
				<p>
					TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE PROVIDER SHALL NOT BE
					LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL,
					OR EXEMPLARY DAMAGES (INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
					DATA, OR BUSINESS INTERRUPTION) ARISING FROM OR RELATED TO THE USE OR
					INABILITY TO USE THE API, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
					DAMAGES. IN NO EVENT SHALL THE PROVIDER’S TOTAL LIABILITY EXCEED THE
					AMOUNT PAID BY THE USER FOR ACCESS TO THE API IN THE SIX (6) MONTHS
					PRECEDING THE CLAIM.
				</p>
			</div>

			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">4. INDEMNIFICATION</h2>
				<p>
					User agrees to indemnify, defend, and hold harmless the Provider, its
					affiliates, officers, directors, employees, and agents from any and
					all claims, liabilities, damages, losses, costs, and expenses
					(including reasonable attorneys' fees) arising from User’s use of the
					API, User’s violation of these Terms, or User’s infringement of any
					third-party rights.
				</p>
			</div>

			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">5. USER OBLIGATIONS</h2>
				<p className="mb-2">
					(a) Permitted Use: User may access and use the API solely for lawful
					purposes and in compliance with these Terms.
				</p>
				<p>(b) Prohibited Use: User shall not:</p>
				<ul className="list-disc list-inside ml-4">
					<li>Use the API for any unlawful or fraudulent activities;</li>
					<li>
						Attempt to gain unauthorized access to the API, its systems, or
						data;
					</li>
					<li>
						Reverse engineer, decompile, or otherwise attempt to extract the
						source code of the API;
					</li>
					<li>
						Use the API in a manner that imposes an unreasonable load on the
						Provider’s infrastructure;
					</li>
					<li>
						Distribute, sublicense, or resell access to the API without prior
						written permission.
					</li>
				</ul>
			</div>

			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">
					6. GOVERNING LAW AND DISPUTE RESOLUTION
				</h2>
				<p>
					These Terms shall be governed by and construed in accordance with the
					laws of Washington State, without regard to its conflict of law
					principles. Any dispute arising out of or related to these Terms shall
					be resolved through binding arbitration in Washington State. Each
					party shall bear its own costs associated with arbitration, except
					where prohibited by law. The parties waive any right to a jury trial
					or to participate in a class action.
				</p>
			</div>

			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">
					7. MODIFICATION AND TERMINATION
				</h2>
				<p className="mb-2">
					(a) Modification: The Provider reserves the right to modify or update
					the API and these Terms at any time without prior notice. Users are
					encouraged to review these Terms periodically.
				</p>
				<p>
					(b) Termination: The Provider may suspend or terminate User’s access
					to the API at any time, with or without cause, and without liability.
					Upon termination, all rights granted to the User under these Terms
					shall cease immediately.
				</p>
			</div>

			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">
					8. NO PROFESSIONAL ADVICE
				</h2>
				<p>
					The API provides access to parsed financial filings from the EDGAR
					database for informational purposes only. The Provider does not offer
					financial, investment, legal, or other professional advice. Users
					should seek the advice of qualified professionals before making any
					financial or legal decisions.
				</p>
			</div>

			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">9. SEVERABILITY</h2>
				<p>
					If any provision of these Terms is found to be invalid, illegal, or
					unenforceable, the remaining provisions shall continue in full force
					and effect.
				</p>
			</div>

			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">10. ENTIRE AGREEMENT</h2>
				<p>
					These Terms constitute the entire agreement between the User and the
					Provider regarding the use of the API and supersede all prior
					agreements, understandings, or representations.
				</p>
			</div>

			<p className="mt-6">
				For any questions regarding these Terms, please contact
				edgar.brutishly148@passinbox.com.
			</p>
		</div>
	);
};

export default TermsOfUse;
