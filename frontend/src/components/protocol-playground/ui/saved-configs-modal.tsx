import React, { useContext, useState, useEffect } from "react";
import { PlaygroundContext } from "../context/playground-context";
import { SavedConfigMetadata } from "../utils/config-storage";
import {
	FiX,
	FiTrash2,
	FiArrowRight,
	FiClock,
	FiGithub,
	FiBox,
	FiInbox,
} from "react-icons/fi";

interface SavedConfigsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfigSelected: (domain: string, version: string, flowId: string) => void;
}

export const SavedConfigsModal: React.FC<SavedConfigsModalProps> = ({
	isOpen,
	onClose,
	onConfigSelected,
}) => {
	const { getSavedConfigs, loadSavedConfig, deleteSavedConfig } =
		useContext(PlaygroundContext);
	const [savedConfigs, setSavedConfigs] = useState<SavedConfigMetadata[]>([]);

	useEffect(() => {
		if (isOpen) {
			setSavedConfigs(getSavedConfigs());
		}
	}, [isOpen, getSavedConfigs]);

	const handleLoadConfig = (config: SavedConfigMetadata) => {
		const success = loadSavedConfig(config.configId);
		if (success) {
			onConfigSelected(config.domain, config.version, config.flowId);
			onClose();
		}
	};

	const handleDeleteConfig = (config: SavedConfigMetadata) => {
		if (
			window.confirm(
				`Are you sure you want to delete config: ${config.domain}_${config.version}_${config.flowId}?`
			)
		) {
			deleteSavedConfig(config.configId);
			setSavedConfigs(getSavedConfigs());
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
				{/* Header */}
				<div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">
							Saved Configurations
						</h2>
						<p className="text-sm text-gray-500 mt-0.5">
							{savedConfigs.length} configuration
							{savedConfigs.length !== 1 ? "s" : ""} saved
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
						aria-label="Close"
					>
						<FiX size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="overflow-y-auto flex-1 p-6">
					{savedConfigs.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<div className="mb-4 p-4 bg-sky-50 rounded-2xl">
								<FiInbox size={40} className="text-sky-400" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								No saved configurations
							</h3>
							<p className="text-gray-500 text-sm max-w-sm">
								Save a configuration from the playground to access it here for
								future use
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{savedConfigs.map((config) => (
								<div
									key={config.configId}
									className="group relative bg-white rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition-all duration-200 overflow-hidden"
								>
									{/* Hover accent line */}
									<div className="absolute inset-y-0 left-0 w-1 bg-sky-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top"></div>

									<div className="flex items-center justify-between p-4 pl-5">
										<div className="flex-1 min-w-0">
											{/* Top row - Domain and Version */}
											<div className="flex items-center gap-2.5 mb-2">
												{config.configId.startsWith("gist_") && (
													<div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-md">
														<FiGithub className="text-purple-600" size={14} />
													</div>
												)}
												<span className="font-semibold text-gray-900 text-base">
													{config.domain}
												</span>
												<span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-md">
													v{config.version}
												</span>
											</div>

											{/* Bottom row - Flow ID and Date */}
											<div className="flex items-center gap-4 text-sm text-gray-600">
												<span className="flex items-center gap-1.5">
													<FiBox size={14} className="text-gray-400" />
													<span className="truncate">{config.flowId}</span>
												</span>
												<span className="flex items-center gap-1.5 text-gray-500">
													<FiClock size={14} className="text-gray-400" />
													{new Date(config.savedAt).toLocaleDateString(
														"en-US",
														{
															month: "short",
															day: "numeric",
															year: "numeric",
														}
													)}
												</span>
											</div>
										</div>

										{/* Action buttons */}
										<div className="flex items-center gap-2 ml-6 flex-shrink-0">
											<button
												onClick={() => handleLoadConfig(config)}
												className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow"
												title="Load configuration"
											>
												Load
												<FiArrowRight size={14} />
											</button>
											<button
												onClick={() => handleDeleteConfig(config)}
												className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
												title="Delete configuration"
											>
												<FiTrash2 size={16} />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer (optional - can add close button here if needed) */}
				<div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
					<button
						onClick={onClose}
						className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};
