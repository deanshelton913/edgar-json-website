export default function ApiKey() {
	return (
		<div className="p-8 max-w-2xl mx-auto bg-white shadow-xl rounded-lg mt-12 text-center">
			{/* API Key Header */}
			<h2 className="text-3xl font-bold text-gray-900">Get Your API Key 🔑</h2>
			<p className="text-gray-600 mt-4 text-lg">
				To request your API key, please send an email to{" "}
				<strong className="text-blue-600">edgar.brutishly148@passinbox.com</strong>.
			</p>

			{/* Personal Note */}
			<div className="mt-8 p-4 bg-gray-50 border-t border-gray-200 rounded-md shadow-md">
				<h3 className="text-lg font-semibold text-gray-900">
					👋 Just a Heads-Up
				</h3>
				<p className="text-gray-600 text-sm mt-2">
					I&apos;m not some big company—just a guy who built something useful.
					The support helps to <strong>keep the lights on</strong> and provide a reliable
					service.
				</p>
				<p className="text-gray-500 text-sm mt-2">Appreciate the support! 🙌</p>
			</div>
		</div>
	);
}
