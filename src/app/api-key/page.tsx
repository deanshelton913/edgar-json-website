import Image from "next/image";
import { ContactUs } from "../components/ContactUs";

export default function ApiKey() {
	return (
		<div className="p-8 max-w-2xl mx-auto bg-white shadow-xl rounded-lg mt-12 text-center">
			{/* API Key Header */}
			<h2 className="text-3xl font-bold text-gray-900">Get Your API Key 🔑</h2>
			<p className="text-gray-600 mt-4 text-lg">
				Unlock API access for just{" "}
				<strong className="text-green-600">$1/month</strong>.
			</p>

			{/* Important Note - Must Include Email */}
			<div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 rounded-md">
				<h3 className="text-lg font-semibold">⚠️ Important</h3>
				<p className="mt-1 text-sm">
					<strong>Include your email address in the Venmo payment note</strong>{" "}
					so I can send your API key!
				</p>
			</div>

			{/* Payment Instructions */}
			<div className="mt-6 p-6 bg-gray-50 rounded-lg shadow-md">
				<p className="text-lg text-gray-800">
					Send <strong className="text-green-600">$1</strong> via Venmo to:
				</p>

				{/* Venmo Handle */}
				<p className="text-xl font-semibold text-blue-600 mt-2">
					@dean-shelton
				</p>

				{/* QR Code */}
				<div className="flex justify-center mt-4">
					<Image
						src="/venmo-qrcode.png"
						height={160}
						width={160}
						alt="Venmo QR Code"
						className="rounded-md shadow-md"
					/>
				</div>

				{/* Payment Link Button */}
				<a
					href="https://venmo.com/code?user_id=1743826104352768258&created=1738126619"
					target="_blank"
					rel="noopener noreferrer"
					className="mt-6 inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition"
				>
					Pay via Venmo 💸
				</a>
			</div>

			{/* Recurring Payment Reminder */}
			<div className="mt-6 p-4 bg-gray-100 rounded-md">
				<p className="text-gray-700 text-sm">
					🔄 To keep your API key active, set up a{" "}
					<strong>$1 recurring payment</strong> or renew manually every 30 days.
				</p>
			</div>

			{/* Personal Note */}
			<div className="mt-8 p-4 bg-gray-50 border-t border-gray-200 rounded-md shadow-md">
				<h3 className="text-lg font-semibold text-gray-900">
					👋 Just a Heads-Up
				</h3>
				<p className="text-gray-600 text-sm mt-2">
					I&apos;m not some big company—just a guy who built something useful.
					The $1 isn&apos;t about making a fortune, it&apos;s just to{" "}
					<strong>keep the lights on</strong> and help provide a reliable
					service.
				</p>
				<p className="text-gray-500 text-sm mt-2">Appreciate the support! 🙌</p>
			</div>

			<ContactUs />
		</div>
	);
}
