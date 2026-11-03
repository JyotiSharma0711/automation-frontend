import { SubmitEventParams } from "@/types/flow-types";

export interface IHotelCatalogItem {
    id: string;
    name: string;
    locationIds: string[];
    time?: {
        label?: string;
        timestamp?: string;
        range?: {
            start?: string;
            end?: string;
        };
    };
    addOns: { id: string; name: string }[];
}

export interface IHotelProvider {
    id: string;
    name: string;
    time?: {
        label?: string;
        timestamp?: string;
        range?: {
            start?: string;
            end?: string;
        };
    };
    items: IHotelCatalogItem[];
}

export interface IHotel201FormData {
    city_code: string;
    provider_id: string;
    item_id: string;
    quantity: number | string;
    start_time: string;
    end_time: string;
    add_on_id?: string;
    adults_count: number | string;
    children_count: number | string;
    providerId?: string;
    locationId?: string;
    location_ids?: string[] | string;
}

export interface IHotel201SelectProps {
    submitEvent: (params: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_HOTEL_201_FORM_DATA: IHotel201FormData = {
    city_code: "std:080",
    provider_id: "",
    item_id: "",
    quantity: 1,
    start_time: "",
    end_time: "",
    add_on_id: "",
    adults_count: 1,
    children_count: 0,
    providerId: "",
    locationId: "",
    location_ids: [],
};
