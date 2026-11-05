import { SubmitEventParams } from "@/types/flow-types";

export interface IFormItem {
    itemId: string;
    count: number;
    addOnId: string;
    addOnCount: number;
}

export interface IFormData {
    city_code?: string;
    provider: string;
    provider_id?: string;
    fulfillment: string;
    fulfillment_id?: string;
    items: IFormItem[];
}

export interface ICatalogItem {
    id: string;
    name: string;
    addOns: { id: string; name: string }[];
}

export interface ICatalogAddOn {
    id: string;
    descriptor?: { name?: string };
}

export interface ICatalogItemRaw {
    id: string;
    descriptor?: { name?: string };
    add_ons?: ICatalogAddOn[];
}

export interface ICatalogFulfillment {
    id: string;
    type?: string;
    [key: string]: unknown;
}

export interface ICatalogProvider {
    id: string;
    descriptor?: { name?: string };
    items?: ICatalogItemRaw[];
    fulfillments?: ICatalogFulfillment[];
    [key: string]: unknown;
}

export interface IOnSearchPayload {
    context?: {
        location?: {
            city?: {
                code?: string;
            };
        };
        city?: string;
        [key: string]: unknown;
    };
    message?: {
        catalog?: {
            providers?: ICatalogProvider[];
            fulfillments?: ICatalogFulfillment[];
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface IAirlineSelectProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    defaultValues?: IFormData;
}

export const DEFAULT_FORM_DATA: IFormData = {
    city_code: "std:080",
    provider: "",
    fulfillment: "",
    items: [{ itemId: "", count: 1, addOnId: "", addOnCount: 1 }],
};
