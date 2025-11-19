import { useState } from "react";
import JsonView from "@uiw/react-json-view";
import axios from "axios";
import { toast } from "react-toastify";
import { ONDC_ACTION_LIST } from "../protocol-playground/types";

interface LoginCredentials {
	username: string;
	password: string;
}

interface PayloadData {
	domain: string;
	version: string;
	page?: string;
	data: any;
}

export default function DBBackOffice() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [credentials, setCredentials] = useState<LoginCredentials>({
		username: "",
		password: "",
	});
	const [payloadData, setPayloadData] = useState<PayloadData | null>(null);
	const [fetchParams, setFetchParams] = useState({
		domain: "",
		version: "",
		page: "",
		action: "any",
	});

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/db/admin/auth`,
				{
					params: {
						username: credentials.username,
						password: credentials.password,
					},
				}
			);

			if (response.data.authenticated) {
				setIsAuthenticated(true);
				toast.success("Login successful!");
			} else {
				toast.error("Invalid credentials");
			}
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Login failed");
			console.error("Authentication error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchPayloadData = async () => {
		if (!fetchParams.domain || !fetchParams.version) {
			toast.error("Domain and Version are required");
			return;
		}

		setIsLoading(true);
		try {
			const url = fetchParams.page
				? `${import.meta.env.VITE_BACKEND_URL}/db/payloads/${fetchParams.domain}/${fetchParams.version}/${fetchParams.action}/${fetchParams.page}`
				: `${import.meta.env.VITE_BACKEND_URL}/db/payloads/${fetchParams.domain}/${fetchParams.version}/${fetchParams.action}/1`;

			const response = await axios.get(url);
			setPayloadData({
				domain: fetchParams.domain,
				version: fetchParams.version,
				page: fetchParams.page,
				data: response.data,
			});
			toast.success("Data fetched successfully!");
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Failed to fetch data");
			console.error("Fetch error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleLogout = () => {
		setIsAuthenticated(false);
		setPayloadData(null);
		setCredentials({ username: "", password: "" });
		setFetchParams({
			domain: "",
			version: "",
			page: "",
			action: "",
		});
	};

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
				<div className="w-full max-w-md">
					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-2">
							Back Office Portal
						</h1>
						<p className="text-sky-600 text-sm">
							Enter your credentials to access payload data
						</p>
					</div>

					{/* Login Form */}
					<div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
						<div className="bg-gradient-to-r from-sky-500 to-blue-500 p-6">
							<h2 className="text-xl font-semibold text-white text-center">
								Administrator Login
							</h2>
						</div>

						<form onSubmit={handleLogin} className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Username
								</label>
								<input
									type="text"
									value={credentials.username}
									onChange={(e) =>
										setCredentials({ ...credentials, username: e.target.value })
									}
									className="w-full px-4 py-3 border bg-white border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
									placeholder="Enter your username"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Password
								</label>
								<input
									type="password"
									value={credentials.password}
									onChange={(e) =>
										setCredentials({ ...credentials, password: e.target.value })
									}
									className="bg-white w-full px-4 py-3 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
									placeholder="Enter your password"
									required
								/>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-sky-600 hover:to-blue-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? (
									<span className="flex items-center justify-center">
										<svg
											className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Signing in...
									</span>
								) : (
									"Sign In"
								)}
							</button>
						</form>

						<div className="bg-sky-50 p-4 text-center border-t border-sky-100">
							<p className="text-xs text-sky-600">
								Enter your administrator credentials
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
			{/* Header */}
			<div className="bg-white shadow-sm border-b border-sky-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div>
							<h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
								Back Office Portal
							</h1>
							<p className="text-sm text-sky-600">Payload Data Management</p>
						</div>
						<button
							onClick={handleLogout}
							className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
						>
							Logout
						</button>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Fetch Form */}
				<div className="bg-white rounded-xl shadow-lg border border-sky-100 p-6 mb-8">
					<h2 className="text-lg font-semibold text-gray-800 mb-4">
						Fetch Payload Data
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Domain *
							</label>
							<input
								type="text"
								value={fetchParams.domain}
								onChange={(e) =>
									setFetchParams({ ...fetchParams, domain: e.target.value })
								}
								className="bg-white w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
								placeholder="e.g., mobility"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Version *
							</label>
							<input
								type="text"
								value={fetchParams.version}
								onChange={(e) =>
									setFetchParams({ ...fetchParams, version: e.target.value })
								}
								className="bg-white w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
								placeholder="e.g., 2.0.1"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Page (Optional)
							</label>
							<input
								type="text"
								value={fetchParams.page}
								onChange={(e) =>
									setFetchParams({ ...fetchParams, page: e.target.value })
								}
								className="bg-white w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
								placeholder="e.g., search"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Action
							</label>
							<select
								value={fetchParams.action}
								onChange={(e) =>
									setFetchParams({ ...fetchParams, action: e.target.value })
								}
								className="bg-white w-full px-3 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
							>
								{["any", ...ONDC_ACTION_LIST].map((action) => (
									<option key={action} value={action}>
										{action}
									</option>
								))}
							</select>
						</div>
						<div className="flex items-end">
							<button
								onClick={fetchPayloadData}
								disabled={isLoading}
								className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:from-sky-600 hover:to-blue-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? (
									<span className="flex items-center justify-center">
										<svg
											className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Fetching...
									</span>
								) : (
									"Fetch Data"
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Data Display */}
				{payloadData && (
					<div className="bg-white rounded-xl shadow-lg border border-sky-100 p-6">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg font-semibold text-gray-800">
								Payload Data
							</h2>
							<div className="flex gap-2 text-xs">
								<span className="bg-sky-100 text-sky-700 px-2 py-1 rounded">
									Domain: {payloadData.domain}
								</span>
								<span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
									Version: {payloadData.version}
								</span>
								{payloadData.page && (
									<span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
										Page: {payloadData.page}
									</span>
								)}
							</div>
						</div>

						<div className="border border-sky-200 rounded-lg overflow-hidden">
							<JsonView
								value={payloadData.data}
								style={{
									backgroundColor: "#f8fafc",
									padding: "16px",
									fontSize: "14px",
									fontFamily: "JetBrains Mono, Monaco, monospace",
								}}
								displayDataTypes={false}
								displayObjectSize={true}
								enableClipboard={true}
								collapsed={2}
							/>
						</div>

						<div className="mt-4 text-xs text-gray-500 text-center">
							Click on objects to expand/collapse • Copy values by clicking the
							copy icon
						</div>
					</div>
				)}

				{/* Empty State */}
				{!payloadData && !isLoading && (
					<div className="bg-white rounded-xl shadow-lg border border-sky-100 p-12 text-center">
						<div className="text-sky-400 mb-4">
							<svg
								className="w-16 h-16 mx-auto"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							No data loaded
						</h3>
						<p className="text-gray-500">
							Enter domain and version parameters above to fetch payload data
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
