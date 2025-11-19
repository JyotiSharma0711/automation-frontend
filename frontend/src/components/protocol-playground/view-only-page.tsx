import { useContext, useState } from "react";
import { PlaygroundContext } from "./context/playground-context";
import { useConfigOperations } from "./hooks/use-config";
import JsonView from "@uiw/react-json-view";
import {
	FiPackage,
	FiTag,
	FiHash,
	FiPlay,
	FiCode,
	FiChevronDown,
	FiChevronUp,
} from "react-icons/fi";

export default function ViewOnlyPlaygroundPage() {
	const playgroundContext = useContext(PlaygroundContext);
	const config = playgroundContext.config;
	const { createFlowSession } = useConfigOperations();
	const [showJsonView, setShowJsonView] = useState(false);

	if (!config) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-white via-sky-50/30 to-white flex items-center justify-center p-8">
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
						<FiPackage className="w-8 h-8 text-gray-400" />
					</div>
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						No Configuration Available
					</h2>
					<p className="text-gray-500">
						No configuration is available for view-only mode.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-white via-sky-50/30 to-white">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
				<div className="max-w-7xl mx-auto px-6 py-4">
					<div className="flex items-center justify-center gap-3">
						<div className="flex items-center justify-center w-10 h-10 bg-sky-500 rounded-xl shadow-lg shadow-sky-500/20">
							<svg
								className="w-5 h-5 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
								/>
							</svg>
						</div>
						<h1 className="text-2xl font-bold text-gray-900">
							ONDC Protocol Playground
						</h1>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-5xl mx-auto px-6 py-8">
				{/* Flow Information Card */}
				<div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-8 mb-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
						<FiPackage className="text-sky-500" />
						Flow Information
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Domain */}
						<div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
							<div className="flex items-center gap-2 mb-2">
								<div className="p-1.5 bg-white rounded-lg">
									<FiPackage className="w-4 h-4 text-gray-600" />
								</div>
								<span className="text-sm font-medium text-gray-600">
									Domain
								</span>
							</div>
							<p className="text-lg font-semibold text-gray-900">
								{config.meta.domain}
							</p>
						</div>

						{/* Version */}
						<div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
							<div className="flex items-center gap-2 mb-2">
								<div className="p-1.5 bg-white rounded-lg">
									<FiTag className="w-4 h-4 text-gray-600" />
								</div>
								<span className="text-sm font-medium text-gray-600">
									Version
								</span>
							</div>
							<p className="text-lg font-semibold text-gray-900">
								{config.meta.version}
							</p>
						</div>

						{/* Flow ID */}
						<div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
							<div className="flex items-center gap-2 mb-2">
								<div className="p-1.5 bg-white rounded-lg">
									<FiHash className="w-4 h-4 text-gray-600" />
								</div>
								<span className="text-sm font-medium text-gray-600">
									Flow ID
								</span>
							</div>
							<p className="text-lg font-semibold text-gray-900 truncate">
								{config.meta.flowId}
							</p>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col sm:flex-row gap-3 mb-6">
					<button
						onClick={createFlowSession}
						className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30"
					>
						<FiPlay className="w-4 h-4" />
						Create New Session
					</button>

					<button
						onClick={() => setShowJsonView(!showJsonView)}
						className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300"
					>
						<FiCode className="w-4 h-4" />
						{showJsonView ? "Hide" : "View"} Configuration JSON
						{showJsonView ? (
							<FiChevronUp className="w-4 h-4" />
						) : (
							<FiChevronDown className="w-4 h-4" />
						)}
					</button>
				</div>

				{/* JSON View Section */}
				{showJsonView && (
					<div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
						<div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
							<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
								<FiCode className="text-sky-500" />
								Configuration JSON
							</h3>
							<p className="text-sm text-gray-500 mt-1">
								Complete configuration object for this flow
							</p>
						</div>
						<div className="p-6 bg-gray-50/50 overflow-x-auto">
							<div className="bg-white rounded-lg border border-gray-200 p-4">
								<JsonView
									value={config}
									collapsed={1}
									style={{
										fontSize: "13px",
										fontFamily:
											"'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
										backgroundColor: "transparent",
									}}
								/>
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
