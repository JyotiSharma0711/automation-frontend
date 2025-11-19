import { useContext, useState } from "react";
import jsonpath from "jsonpath";
import { inputClass } from "../../ui/forms/inputClass";
// import { MockPlaygroundConfigType } from "../mock-engine/types";
import { FaExclamationTriangle, FaPlus } from "react-icons/fa";
import { PlaygroundContext } from "../context/playground-context";
import { useEffect } from "react";
import JsonViewer from "./Json-path-extractor";
import JsonPathInput from "./json-path-input";
import { handleAddParam } from "./json-path-input";
import JsonPathOutputPopup from "./JsonPathOutputModal";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

export enum SelectedType {
	SavedInfo = "saved_info",
	SaveData = "saveData",
}

export default function SessionDataTab() {
	const [selectedCall, setSelectedCall] = useState("");
	const {
		config: playgroundConfig,
		setCurrentConfig: setPlayGroundConfig,
		resetTransactionHistory,
	} = useContext(PlaygroundContext);
	const [showAlert, setShowAlert] = useState(false);
	const [showInput, setShowInput] = useState(false);
	const [alias, setAlias] = useState<string>("");
	const [path, setPath] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [isViewActive, setIsViewActive] = useState(false);
	const [viewPath, setViewPath] = useState<string>("");

	useEffect(() => {
		const currentLength = playgroundConfig?.steps?.length || 0;

		if (!currentLength && currentLength < 2) {
			setSelectedCall("");
			return;
		}

		const secondLastActionId =
			playgroundConfig?.steps[currentLength - 2]?.action_id || "";
		console.log("cuurentLenght: ", currentLength, secondLastActionId);
		setSelectedCall(secondLastActionId);
	}, []);

	const handleContinue = () => {
		if (!selectedCall || !alias) return;

		// Clone the current config
		if (!playgroundConfig) return;
		const updatedConfig: MockPlaygroundConfigType = { ...playgroundConfig };

		// Find the step by selected action_id
		const stepIndex = updatedConfig.steps.findIndex(
			(s: any) => s.action_id === selectedCall
		);
		if (stepIndex === -1) return;

		// Clone the target step and its saveData
		const step = { ...updatedConfig.steps[stepIndex] };
		const updatedSaveData = { ...step.mock.saveData };

		// Remove the alias if present
		delete updatedSaveData[alias];

		// Write back the updated step
		step.mock.saveData = updatedSaveData;
		updatedConfig.steps[stepIndex] = step;

		// Commit changes
		setPlayGroundConfig(updatedConfig);

		// Reset UI and state
		resetTransactionHistory();
		setShowAlert(false);
		setAlias("");
	};

	const handleCancel = () => {
		setShowAlert(false);
	};

	const handleKeyClick = (path: string, key: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!selectedCall) return;

		const baseAlias = `payload_${key}`;
		if (!playgroundConfig) return;
		// Clone current config
		const updatedConfig: MockPlaygroundConfigType = { ...playgroundConfig };

		// Find the step for selectedCall
		const step = updatedConfig.steps?.find((s) => s.action_id === selectedCall);
		if (!step) return;

		const saveData = { ...step.mock.saveData };

		// Check if path already exists in saveData
		const existingInSaveData = Object.keys(saveData).find(
			(alias) => saveData[alias] === path
		);

		if (existingInSaveData) {
			console.log(
				`⚠️ This item (alias: ${existingInSaveData}) is already saved in saveData and cannot be modified.`
			);
			setAlias(existingInSaveData);
			setShowAlert(true);
			return;
		}

		// Find corresponding transaction_history entry
		const historyIndex = updatedConfig.transaction_history.findIndex(
			(h) => h.action_id === selectedCall
		);
		if (historyIndex === -1) return;

		const historyEntry = { ...updatedConfig.transaction_history[historyIndex] };
		const savedInfo = { ...(historyEntry.saved_info || {}) };

		// Check if path exists in saved_info — remove if found
		const existingInSavedInfo = Object.keys(savedInfo).find(
			(alias) => savedInfo[alias] === path
		);

		if (existingInSavedInfo) {
			delete savedInfo[existingInSavedInfo];
		} else {
			// Generate unique alias not present in saved_info or saveData
			let alias = baseAlias;
			let counter = 1;
			while (
				Object.prototype.hasOwnProperty.call(savedInfo, alias) ||
				Object.prototype.hasOwnProperty.call(saveData, alias)
			) {
				alias = `${baseAlias}_${counter}`;
				counter++;
			}

			savedInfo[alias] = path;
		}

		// Update transaction_history
		updatedConfig.transaction_history[historyIndex] = {
			...historyEntry,
			saved_info: savedInfo,
		};

		// Commit updated config
		setPlayGroundConfig(updatedConfig);
	};

	const payloadFromTranscationHistory = (action_id: string) => {
		if (!playgroundConfig) return {};
		const history = playgroundConfig.transaction_history.find(
			(h) => h.action_id === action_id
		);
		return history?.payload ?? {};
	};

	const isSelected = (
		path: string
	): { status: boolean; type: SelectedType | null } => {
		if (!selectedCall || !playgroundConfig) {
			return { status: false, type: null };
		}
		const history = playgroundConfig.transaction_history.find(
			(history) => history.action_id === selectedCall
		);
		const step = playgroundConfig.steps.find(
			(s) => s.action_id === selectedCall
		);

		const savedInfo = history?.saved_info || {};
		const saveData = step?.mock.saveData || {};

		if (Object.values(savedInfo).includes(path)) {
			return { status: true, type: SelectedType.SavedInfo };
		} else if (Object.values(saveData).includes(path)) {
			return { status: true, type: SelectedType.SaveData };
		} else {
			return { status: false, type: null };
		}
	};

	const removePath = (aliasToRemove: string) => {
		if (!selectedCall) return;

		if (!playgroundConfig) return;

		// Clone the config
		const updatedConfig = { ...playgroundConfig };

		// Find the transaction_history entry for the selected call
		const historyIndex = updatedConfig.transaction_history.findIndex(
			(h) => h.action_id === selectedCall
		);
		if (historyIndex === -1) return;

		const historyEntry = { ...updatedConfig.transaction_history[historyIndex] };
		const savedInfo = { ...(historyEntry.saved_info || {}) };

		// Remove the alias
		delete savedInfo[aliasToRemove];

		// Update the transaction_history entry
		updatedConfig.transaction_history[historyIndex] = {
			...historyEntry,
			saved_info: savedInfo,
		};

		// Commit the updated config
		setPlayGroundConfig(updatedConfig);
	};

	const handleSave = () => {
		if (!selectedCall) return;
		if (!playgroundConfig) return;
		// Clone the playgroundConfig
		const updatedConfig = { ...playgroundConfig };

		// Clone transaction_history and steps
		const updatedHistory = [...updatedConfig.transaction_history];
		const updatedSteps = updatedConfig.steps.map((step) => ({ ...step }));

		// Find the history entry for selectedCall
		const historyIndex = updatedHistory.findIndex(
			(h) => h.action_id === selectedCall
		);
		if (historyIndex === -1) return;

		const historyEntry = { ...updatedHistory[historyIndex] };

		// Nothing to save
		if (
			!historyEntry.saved_info ||
			Object.keys(historyEntry.saved_info).length === 0
		) {
			return;
		}

		// Find the corresponding step
		const stepIndex = updatedSteps.findIndex(
			(s) => s.action_id === selectedCall
		);
		if (stepIndex === -1) return;

		const step = { ...updatedSteps[stepIndex] };

		// Merge saved_info into step.mock.saveData
		step.mock = {
			...step.mock,
			saveData: {
				...step.mock.saveData,
				...historyEntry.saved_info,
			},
		};

		// Update step and clear saved_info in history
		updatedSteps[stepIndex] = step;
		updatedHistory[historyIndex] = { ...historyEntry, saved_info: {} };

		// Commit the updated config
		setPlayGroundConfig({
			...updatedConfig,
			transaction_history: updatedHistory,
			steps: updatedSteps,
		});
	};

	const editSavedInfo = (
		oldAlias: string,
		newAlias: string,
		newPath: string
	) => {
		if (!selectedCall) return;
		if (!playgroundConfig) return;
		// Clone the playgroundConfig
		const updatedConfig = { ...playgroundConfig };

		// Clone transaction_history
		const updatedHistory = [...updatedConfig.transaction_history];

		// Find the history entry for selectedCall
		const historyIndex = updatedHistory.findIndex(
			(h) => h.action_id === selectedCall
		);
		if (historyIndex === -1) return;

		const historyEntry = { ...updatedHistory[historyIndex] };
		const savedInfo = { ...(historyEntry.saved_info || {}) };

		// 🔹 If the old alias doesn’t exist, do nothing
		if (!Object.prototype.hasOwnProperty.call(savedInfo, oldAlias)) {
			console.warn(`Alias "${oldAlias}" not found in saved_info`);
			return;
		}

		// 🔹 Check if the new alias already exists (and is not the same as oldAlias)
		if (
			newAlias !== oldAlias &&
			Object.prototype.hasOwnProperty.call(savedInfo, newAlias)
		) {
			console.warn(
				`Alias "${newAlias}" already exists. Choose a different alias.`
			);
			return;
		}

		// 🔹 Delete the old alias if it's being renamed
		if (oldAlias !== newAlias) {
			delete savedInfo[oldAlias];
		}

		// 🔹 Update (or create) the new alias → path mapping
		savedInfo[newAlias] = newPath;

		// 🔹 Update the history entry
		updatedHistory[historyIndex] = { ...historyEntry, saved_info: savedInfo };

		// Commit the updated config
		setPlayGroundConfig({
			...updatedConfig,
			transaction_history: updatedHistory,
		});
	};

	const handleAdd = ({
		currAlias,
		currPath,
		oldAlias,
	}: {
		currAlias?: string;
		currPath?: string;
		oldAlias?: string;
	}) => {
		const finalAlias = (currAlias || alias).trim();
		const finalPath = (currPath || path).trim();

		if (!finalAlias) return setError("Alias is required");

		try {
			if (!finalPath.startsWith("EVAL#"))
				jsonpath.query(payloadFromTranscationHistory(selectedCall), finalPath);
		} catch (err) {
			setError("Invalid JSONPath format");
			console.error("❌ JSONPath validation failed:", err);
			return;
		}

		onAdd(finalAlias, finalPath, oldAlias);
		setAlias("");
		setPath("");
		setShowInput(false);
		setError("");
	};

	const onAdd = (alias: string, path: string, oldAlias?: string) => {
		if (!selectedCall || !playgroundConfig) return;

		// Clone playgroundConfig
		const updatedConfig = { ...playgroundConfig };

		// Find the step for selectedCall
		const stepIndex = updatedConfig.steps.findIndex(
			(s) => s.action_id === selectedCall
		);
		if (stepIndex === -1) return;

		const currentStep = { ...updatedConfig.steps[stepIndex] };
		const saveData = { ...currentStep.mock.saveData }; // clone saveData

		// Determine if we are editing or adding
		const isEditing = oldAlias && oldAlias in saveData;

		// Prevent duplicate paths under different aliases
		const duplicateEntry = Object.entries(saveData).find(
			([existingAlias, existingPath]) =>
				existingPath === path && existingAlias !== (oldAlias || alias)
		);

		if (duplicateEntry) {
			console.warn(
				`⚠️ This path is already assigned to alias "${duplicateEntry[0]}".`
			);
			return;
		}

		if (isEditing) {
			// If alias changed, delete the old one
			if (oldAlias !== alias) delete saveData[oldAlias];
			saveData[alias] = path;
			console.log(
				`✏️ Updated entry: ${oldAlias !== alias ? `renamed to "${alias}"` : `"${alias}"`} with path "${path}".`
			);
		} else {
			// Adding new entry
			saveData[alias] = path;
			console.log(`✅ Added new alias "${alias}" → "${path}".`);
		}

		// Update the step with new saveData
		updatedConfig.steps[stepIndex] = {
			...currentStep,
			mock: {
				...currentStep.mock,
				saveData,
			},
		};

		// Commit the updated config
		setPlayGroundConfig(updatedConfig);
	};

	const selectedHistory = playgroundConfig?.transaction_history.find(
		(history) => history.action_id === selectedCall
	);

	const savedInfo = selectedHistory?.saved_info || {};
	const savedInfoLength = Object.keys(savedInfo).length;

	const saveData =
		playgroundConfig?.steps.find((s) => s.action_id === selectedCall)?.mock
			.saveData || {};
	const saveDataLength = Object.keys(saveData).length;

	// const activeApi =

	if (!playgroundConfig) {
		return <div className="p-4 text-red-400">No configuration found.</div>;
	}

	return (
		<div className="relative flex flex-col gap-4 h-full p-4">
			{/* Alert at the top */}
			{showAlert && (
				<div className="absolute bottom-20 right-8 w-full max-w-md z-50 flex items-start gap-4 p-4 rounded-lg bg-red-50 border border-red-300 shadow-lg">
					{/* Alert Icon */}
					<FaExclamationTriangle className="w-6 h-6 text-red-600 mt-1" />

					{/* Alert Text and Buttons */}
					<div className="flex-1">
						<p className="text-red-700 font-semibold mb-2">
							Are you sure you want to remove this saved data? Removing it will
							reset the transaction history from the call and ahead.
						</p>
						<div className="flex gap-2">
							<button
								onClick={handleContinue}
								className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
							>
								Continue
							</button>
							<button
								onClick={handleCancel}
								className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{isViewActive && (
				<JsonPathOutputPopup
					jsonPath={viewPath}
					output={jsonpath.query(
						payloadFromTranscationHistory(selectedCall),
						viewPath
					)}
					onClose={() => setIsViewActive(false)}
				/>
			)}

			<div>
				<label className="text-sm text-gray-400">Select a call</label>
				<select
					id="apiNameInput"
					className={inputClass}
					value={selectedCall}
					onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
						setSelectedCall(e.target.value)
					}
				>
					{playgroundConfig?.steps?.length > 1 &&
						playgroundConfig?.steps
							.slice(0, playgroundConfig.steps.length) // skip last element
							.map((step) => (
								<option key={step.action_id} value={step.action_id}>
									{step.action_id}
								</option>
							))}
				</select>
			</div>

			<div className="flex flex-1 bg-gray-900 text-gray-100 min-h-0 p-4">
				{/* Left side - JSON Viewer */}
				<div className="w-1/2 p-2 overflow-auto">
					<div className="text-sm text-gray-400 mb-3">
						💡 Click on object keys (like "context") or primitive values
					</div>
					<div className="bg-gray-900 p-2 rounded-md font-mono text-sm">
						{/* <div className="text-gray-400">{"{"}</div> */}
						<JsonViewer
							data={payloadFromTranscationHistory(selectedCall)}
							isSelected={isSelected}
							handleKeyClick={handleKeyClick}
						/>
						{/* <div className="text-gray-400">{"}"}</div> */}
					</div>
				</div>

				{/* Right side - Selected Paths */}
				<div className="w-1/2 p-6 overflow-auto bg-gray-850">
					<div className="flex justify-between items-center">
						<h2 className="text-xl mb-0 font-bold text-sky-400">
							Save Data ({saveDataLength})
						</h2>
						<button
							onClick={() => {
								setError("");
								setShowInput((prev) => !prev);
							}}
							className="flex items-center gap-2 px-3 py-3 bg-sky-500/20 text-sky-300 rounded hover:bg-sky-500/30 transition-colors"
						>
							<FaPlus className="text-sky-300" />
							Add Manually
						</button>
					</div>

					{showInput && (
						<div className="bg-gray-800 mt-4 p-4 rounded-lg border border-sky-500/30">
							<div className="flex flex-row gap-2 items-center">
								<input
									type="text"
									value={alias}
									onChange={(e) => setAlias(e.target.value)}
									placeholder="Enter alias (e.g. userInfo)"
									className="px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:border-sky-500 outline-none"
								/>
								:
								<input
									type="text"
									value={path}
									onChange={(e) => setPath(e.target.value)}
									placeholder="Enter JSON path (e.g. $.context.city)"
									className="px-3 w-full py-2 rounded bg-gray-900 text-white border border-gray-700 focus:border-sky-500 outline-none"
								/>
							</div>
							{error && <p className="text-red-400 text-sm">{error}</p>}
							<div className="flex gap-2 mt-2">
								<button
									onClick={() => handleAdd({})}
									className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
								>
									Save
								</button>
								<button
									onClick={() => {
										setShowInput(false);
										setError("");
									}}
									className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
								>
									Cancel
								</button>
							</div>
						</div>
					)}

					{savedInfoLength + saveDataLength === 0 ? (
						<div className="text-gray-500 text-center mt-8">
							No paths selected. Click on any key or value in the JSON to add
							it.
						</div>
					) : (
						<div className="space-y-2 mt-4">
							{Object.entries(
								playgroundConfig.steps.find((s) => s.action_id === selectedCall)
									?.mock.saveData || {}
							).map(([alias, path]) => (
								<div
									key={alias}
									className="bg-gray-800 p-3 rounded-lg border border-sky-500/30 flex items-center justify-between group hover:border-sky-500/50 transition-colors"
								>
									<JsonPathInput
										onDelete={(aliasToDelete: string) => {
											setShowAlert(true);
											setAlias(aliasToDelete);
											// handleRemoveSavedData(alias)
										}}
										alias={alias}
										path={path}
										// selectedCall={selectedCall}
										error={error}
										setError={setError}
										handleAdd={handleAdd}
										onView={(path: string) => {
											setIsViewActive(true);
											setViewPath(path);
										}}
									/>
								</div>
							))}
							{savedInfoLength > 0 && (
								<div className="my-6 border-t border-gray-700" />
							)}
							{savedInfoLength > 0 && (
								<h2 className="text-xl font-bold mb-4 text-sky-400">
									Tentative Save Data ({savedInfoLength})
								</h2>
							)}
							{Object.entries(savedInfo).map(([alias, path]) => (
								<div
									key={alias}
									className="bg-gray-800 p-3 rounded-lg border border-sky-500/30 flex items-center justify-between group hover:border-sky-500/50 transition-colors"
								>
									<JsonPathInput
										onDelete={() => {
											removePath(alias);
										}}
										alias={alias}
										path={path}
										// selectedCall={selectedCall}
										error={error}
										setError={setError}
										handleAdd={({
											oldAlias,
											currAlias,
											currPath,
										}: handleAddParam) =>
											editSavedInfo(oldAlias || "", currAlias, currPath)
										}
										onView={(path: string) => {
											setIsViewActive(true);
											setViewPath(path);
										}}
									/>
								</div>
							))}
						</div>
					)}

					{savedInfoLength > 0 && (
						<div className="mt-6 flex flex row gap-4">
							<button
								onClick={handleSave}
								className="w-full px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
							>
								Save
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
