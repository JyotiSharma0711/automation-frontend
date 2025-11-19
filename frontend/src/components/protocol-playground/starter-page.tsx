import { useContext, useEffect, useState } from "react";
import { PlaygroundContext } from "./context/playground-context";

import PlaygroundPage from "./playground-page";
import { createInitialMockConfig } from "@ondc/automation-mock-runner";
import axios from "axios";
import { SavedConfigsModal } from "./ui/saved-configs-modal";

export default function GetPlaygroundComponent() {
	const { config, setCurrentConfig } = useContext(PlaygroundContext);
	const [domain, setDomain] = useState("");
	const [version, setVersion] = useState("");
	const [flowId, setFlowId] = useState("");
	const [showSavedConfigs, setShowSavedConfigs] = useState(false);
	const [dynamicList, setDynamicList] = useState<{
		domain: any[];
		version: any[];
		usecase: any[];
	}>({
		domain: [],
		version: [],
		usecase: [],
	});

	const fetchFormData = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/config/senarioFormData`
			);
			setDynamicList((prev) => {
				return {
					...prev,
					domain: response.data.domain || [],
					version: response.data.version || [],
				};
			});
			console.log("form field data", response.data);
		} catch (e) {
			console.log("error while fetching form field data", e);
		}
	};

	useEffect(() => {
		fetchFormData();
	}, []);

	if (config) {
		return <PlaygroundPage />;
	}

	function SetConfig(domain: string, version: string, flowId: string) {
		if (domain && version && flowId) {
			setCurrentConfig(createInitialMockConfig(domain, version, flowId));
		}
	}

	return (
		<div className="min-h-screen h-full bg-gradient-to-b from-white via-sky-50/30 to-white flex items-center justify-center px-8 py-16">
			{/* Subtle background decoration */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-100/40 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
				<div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/40 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
			</div>

			{/* Main container */}
			<div className="relative z-10 w-full max-w-lg">
				{/* Header */}
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-14 h-14 bg-sky-500 rounded-2xl mb-4 shadow-lg shadow-sky-500/20">
						<svg
							className="w-7 h-7 text-white"
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
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						ONDC Protocol Playground
					</h1>
					<p className="text-gray-600 text-sm">
						Configure and test your protocol flows
					</p>
				</div>

				{/* Card */}
				<div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
					{/* Card header */}
					<div className="mb-8">
						<h2 className="text-lg font-semibold text-gray-900 mb-1">
							Initialize Flow
						</h2>
						<p className="text-sm text-gray-500">
							Enter your configuration details to begin
						</p>
					</div>

					{/* Load saved config link */}
					<button
						onClick={() => setShowSavedConfigs(true)}
						className="w-full mb-6 px-4 py-3 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
							/>
						</svg>
						Load Saved Configuration
					</button>

					{/* Form fields */}
					<div className="space-y-5">
						{/* Domain */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Domain
							</label>
							{dynamicList.domain?.length > 0 ? (
								<select
									value={domain}
									onChange={(e) => {
										setDomain(e.target.value);
										const selectedDomainData = dynamicList.domain.find(
											(item: any) => item.key === e.target.value
										);
										if (selectedDomainData) {
											setDynamicList((prev) => ({
												...prev,
												version: selectedDomainData.version || [],
											}));
										}
									}}
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm"
								>
									<option value="">Select a domain...</option>
									{dynamicList.domain.map((item: any) => (
										<option key={item.key} value={item.key}>
											{item.key}
										</option>
									))}
								</select>
							) : (
								<input
									type="text"
									value={domain}
									onChange={(e) => setDomain(e.target.value)}
									placeholder="e.g., mobility, logistics, retail"
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
								/>
							)}
						</div>

						{/* Version */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Version
							</label>
							{dynamicList.version?.length > 0 ? (
								<select
									value={version}
									onChange={(e) => {
										setVersion(e.target.value);
										const selectedVersionData = dynamicList.version.find(
											(item: any) => item.key === e.target.value
										);
										if (selectedVersionData) {
											setDynamicList((prev) => ({
												...prev,
												usecase: selectedVersionData.usecase || [],
											}));
										}
									}}
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm"
								>
									<option value="">Select a version...</option>
									{dynamicList.version.map((item: any) => (
										<option key={item.key} value={item.key}>
											{item.key}
										</option>
									))}
								</select>
							) : (
								<input
									type="text"
									value={version}
									onChange={(e) => setVersion(e.target.value)}
									placeholder="e.g., 2.0.1, 1.5.3"
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
								/>
							)}
						</div>

						{/* Flow ID */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Flow ID
							</label>
							<input
								type="text"
								value={flowId}
								onChange={(e) => setFlowId(e.target.value)}
								placeholder="Enter unique flow identifier"
								className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
							/>
						</div>

						{/* Submit button */}
						<button
							onClick={() => SetConfig(domain, version, flowId)}
							disabled={!domain || !version || !flowId}
							className="w-full mt-6 px-6 py-3.5 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 disabled:shadow-none"
						>
							Continue to Playground
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 7l5 5m0 0l-5 5m5-5H6"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Saved Configs Modal */}
			<SavedConfigsModal
				isOpen={showSavedConfigs}
				onClose={() => setShowSavedConfigs(false)}
				onConfigSelected={(domain, version, flowId) => {
					setDomain(domain);
					setVersion(version);
					setFlowId(flowId);
				}}
			/>
		</div>
	);
}
