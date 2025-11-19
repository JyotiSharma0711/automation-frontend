import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

export interface SavedConfigMetadata {
	domain: string;
	version: string;
	flowId: string;
	savedAt: string;
	configId: string;
}

export interface SavedConfig extends SavedConfigMetadata {
	config: MockPlaygroundConfigType;
}

const STORAGE_PREFIX = "playground_config_";
const METADATA_KEY = "playground_configs_metadata";

/**
 * Generate a unique config ID from domain, version, and flowId
 */
export function generateConfigId(
	domain: string,
	version: string,
	flowId: string,
	isGist?: boolean
): string {
	const baseId = `${domain}_${version}_${flowId}`.replace(
		/[^a-zA-Z0-9_]/g,
		"_"
	);
	return isGist ? `gist_${baseId}` : baseId;
}

/**
 * Generate a unique config ID for gist-based configs using gist URL
 */
export function generateGistConfigId(gistUrl: string): string {
	// Extract gist ID from URL for consistent naming
	const gistId = extractGistId(gistUrl);
	return `gist_${gistId}`;
}

/**
 * Extract gist ID from various URL formats
 */
function extractGistId(input: string): string | null {
	if (!input || input.trim().length === 0) {
		return null;
	}

	const trimmed = input.trim();

	// If it's already just an ID (alphanumeric string)
	if (/^[a-f0-9]+$/i.test(trimmed)) {
		return trimmed;
	}

	// Extract from various Gist URL formats
	const patterns = [
		/gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]+)/i, // https://gist.github.com/username/id or https://gist.github.com/id
		/\/([a-f0-9]+)$/i, // Any URL ending with gist ID
	];

	for (const pattern of patterns) {
		const match = trimmed.match(pattern);
		if (match && match[1]) {
			return match[1];
		}
	}

	return null;
}

/**
 * Save a config to localStorage with metadata
 */
export function saveConfig(
	domain: string,
	version: string,
	flowId: string,
	config: MockPlaygroundConfigType,
	isGist?: boolean
): boolean {
	try {
		const configId = generateConfigId(domain, version, flowId, isGist);
		const savedConfig: SavedConfig = {
			domain,
			version,
			flowId,
			configId,
			savedAt: new Date().toISOString(),
			config,
		};

		// Save the config
		localStorage.setItem(
			`${STORAGE_PREFIX}${configId}`,
			JSON.stringify(savedConfig)
		);

		// Update metadata list
		const metadata = getSavedConfigsMetadata();
		const existingIndex = metadata.findIndex((m) => m.configId === configId);

		if (existingIndex >= 0) {
			metadata[existingIndex] = {
				domain,
				version,
				flowId,
				configId,
				savedAt: savedConfig.savedAt,
			};
		} else {
			metadata.push({
				domain,
				version,
				flowId,
				configId,
				savedAt: savedConfig.savedAt,
			});
		}

		localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
		return true;
	} catch (error) {
		console.error("Failed to save config:", error);
		return false;
	}
}

/**
 * Save a gist-based config to localStorage
 */
export function saveGistConfig(
	gistUrl: string,
	config: MockPlaygroundConfigType
): boolean {
	try {
		const gistId = extractGistId(gistUrl);
		if (!gistId) {
			console.error("Invalid gist URL");
			return false;
		}

		const configId = generateGistConfigId(gistUrl);
		const savedConfig: SavedConfig = {
			domain: config.meta.domain,
			version: config.meta.version,
			flowId: config.meta.flowId,
			configId,
			savedAt: new Date().toISOString(),
			config,
		};

		// Save the config
		localStorage.setItem(
			`${STORAGE_PREFIX}${configId}`,
			JSON.stringify(savedConfig)
		);

		// Update metadata list
		const metadata = getSavedConfigsMetadata();
		const existingIndex = metadata.findIndex((m) => m.configId === configId);

		if (existingIndex >= 0) {
			metadata[existingIndex] = {
				domain: config.meta.domain,
				version: config.meta.version,
				flowId: config.meta.flowId,
				configId,
				savedAt: savedConfig.savedAt,
			};
		} else {
			metadata.push({
				domain: config.meta.domain,
				version: config.meta.version,
				flowId: config.meta.flowId,
				configId,
				savedAt: savedConfig.savedAt,
			});
		}

		localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
		return true;
	} catch (error) {
		console.error("Failed to save gist config:", error);
		return false;
	}
}

/**
 * Load a specific config by ID
 */
export function loadConfig(configId: string): SavedConfig | null {
	try {
		const saved = localStorage.getItem(`${STORAGE_PREFIX}${configId}`);
		if (!saved) return null;
		return JSON.parse(saved);
	} catch (error) {
		console.error("Failed to load config:", error);
		return null;
	}
}

/**
 * Load a config by domain, version, and flowId
 */
export function loadConfigByIdentifiers(
	domain: string,
	version: string,
	flowId: string
): SavedConfig | null {
	const configId = generateConfigId(domain, version, flowId);
	return loadConfig(configId);
}

/**
 * Get all saved configs metadata
 */
export function getSavedConfigsMetadata(): SavedConfigMetadata[] {
	try {
		const metadata = localStorage.getItem(METADATA_KEY);
		return metadata ? JSON.parse(metadata) : [];
	} catch (error) {
		console.error("Failed to load configs metadata:", error);
		return [];
	}
}

/**
 * Get all saved configs with their full data
 */
export function getAllSavedConfigs(): SavedConfig[] {
	const metadata = getSavedConfigsMetadata();
	const configs: SavedConfig[] = [];

	for (const meta of metadata) {
		const config = loadConfig(meta.configId);
		if (config) {
			configs.push(config);
		}
	}

	return configs;
}

/**
 * Delete a config by ID
 */
export function deleteConfig(configId: string): boolean {
	try {
		localStorage.removeItem(`${STORAGE_PREFIX}${configId}`);

		// Update metadata
		const metadata = getSavedConfigsMetadata();
		const filteredMetadata = metadata.filter((m) => m.configId !== configId);
		localStorage.setItem(METADATA_KEY, JSON.stringify(filteredMetadata));

		return true;
	} catch (error) {
		console.error("Failed to delete config:", error);
		return false;
	}
}

/**
 * Check if a config exists
 */
export function configExists(
	domain: string,
	version: string,
	flowId: string
): boolean {
	const configId = generateConfigId(domain, version, flowId);
	return localStorage.getItem(`${STORAGE_PREFIX}${configId}`) !== null;
}

/**
 * Clear all saved configs
 */
export function clearAllConfigs(): boolean {
	try {
		const metadata = getSavedConfigsMetadata();

		// Remove all config entries
		for (const meta of metadata) {
			localStorage.removeItem(`${STORAGE_PREFIX}${meta.configId}`);
		}

		// Clear metadata
		localStorage.removeItem(METADATA_KEY);
		return true;
	} catch (error) {
		console.error("Failed to clear all configs:", error);
		return false;
	}
}
