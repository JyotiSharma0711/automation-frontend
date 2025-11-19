interface GistFile {
	filename: string;
	content: string;
	language: string;
	size: number;
	raw_url: string;
	type: string;
}

interface GistData {
	id: string;
	description: string;
	files: Record<string, GistFile>;
	owner: {
		login: string;
		avatar_url: string;
	} | null;
	created_at: string;
	updated_at: string;
	public: boolean;
}

interface GistResponse {
	success: boolean;
	data?: GistData;
	error?: string;
}

/**
 * Fetches data from a GitHub Gist URL
 * @param gistUrl - Full gist URL or just the gist ID
 * @returns Promise with gist data or error
 */
export async function fetchGistData(gistUrl: string): Promise<GistResponse> {
	try {
		// Extract gist ID from URL
		const gistId = extractGistId(gistUrl);

		if (!gistId) {
			return {
				success: false,
				error: "Invalid Gist URL or ID provided",
			};
		}

		// Fetch from GitHub API
		const response = await fetch(`https://api.github.com/gists/${gistId}`, {
			headers: {
				Accept: "application/vnd.github.v3+json",
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				return {
					success: false,
					error: "Gist not found",
				};
			}
			return {
				success: false,
				error: `Failed to fetch gist: ${response.statusText}`,
			};
		}

		const gistData = await response.json();

		// Transform files object to include content
		const files: Record<string, GistFile> = {};
		for (const [filename, fileData] of Object.entries(gistData.files || {})) {
			const file = fileData as any;
			files[filename] = {
				filename: file.filename,
				content: file.content || "",
				language: file.language || "text",
				size: file.size || 0,
				raw_url: file.raw_url || "",
				type: file.type || "",
			};
		}

		return {
			success: true,
			data: {
				id: gistData.id,
				description: gistData.description || "",
				files,
				owner: gistData.owner
					? {
							login: gistData.owner.login,
							avatar_url: gistData.owner.avatar_url,
						}
					: null,
				created_at: gistData.created_at,
				updated_at: gistData.updated_at,
				public: gistData.public,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

/**
 * Extracts gist ID from various URL formats
 * @param input - Gist URL or ID
 * @returns Extracted gist ID or null
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

// Helper function to get specific file content from gist
export function getGistFileContent(
	gistData: GistData,
	filename: string
): string | null {
	return gistData.files[filename]?.content || null;
}

// Helper function to get first file content (useful for single-file gists)
export function getFirstGistFile(gistData: GistData): GistFile | null {
	const files = Object.values(gistData.files);
	return files.length > 0 ? files[0] : null;
}
