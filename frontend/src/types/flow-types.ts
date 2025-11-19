import { FormConfigType } from "../components/ui/forms/config-form/config-form";

// Define your data types
export interface FetchFlowsResponse {
	domain: Domain[];
}

export interface Domain {
	name: string;
	flows: Flow[];
}

export interface Flow {
	id: string;
	title?: string;
	description: string;
	sequence: SequenceStep[];
	metadata?: MetadataField[];
	tags?: [string]
}

export interface MetadataField {
	path: string;
	description: {
		code: string;
		name: string;
		short_desc: string;
	};
}

export interface SequenceStep {
	key: string;
	type: string;
	unsolicited: boolean;
	description: string;
	pair: string | null;
	owner: "BAP" | "BPP";
	input?: FormConfigType;
	expect?: boolean;
	label?: string;
	force_proceed?: boolean;
	metadata?: MetadataField[];
	'meta-data'?: MetadataField[];

}

export interface SubmitEventParams {
	jsonPath: Record<string, string>;
	formData: Record<string, string>;
}
