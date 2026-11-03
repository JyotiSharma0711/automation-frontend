import { ICheckboxOption } from "@components/Shadcn/Checkbox";
import { RJSFSchema } from "@rjsf/utils";

import type { IExpectedField } from "@components/Forms/utils/html-form-contract";

export interface FormFieldConfigType {
    name: string;
    label: string;
    type:
        | "text"
        | "select"
        | "textarea"
        | "list"
        | "date"
        | "checkbox"
        | "boolean"
        | "trv12_bus_seat_selection"
        | "airline_select"
        | "intercity_select"
        | "airline_seat_select"
        | "ret10_grocery_select"
        | "reteb2b_select"
        | "reteb2b_init_offers"
        | "ret11_nestedSelect"
        | "retinvl_init"
        | "retinvl_init_offers"
        | "retinvl_init_ilbp"
        | "nestedSelect"
        | "trv_select"
        | "trv10_select"
        | "trv10_schedule"
        | "trv10_schedule_rental"
        | "trv11_select"
        | "trv11_201_partial_select"
        | "hotel_select"
        | "HTML_FORM"
        | "HTML_FORM_MULTI"
        | "FINVU_REDIRECT"
        | "DYNAMIC_FORM"
        | "MANUAL_DYNAMIC_FORM"
        | "fis13_select"
        | "trv13_select_provider"
        | "trv10_201_select"
        | "search_accidental_fis13"
        | "search_hospicash_fis13"
        | "search_transit_fis13"
        | "search_discover_product_fis13"
        | "trv11_210_select"
        | "trv11_210_update_end_station"
        | "trv11_210_start_end_stop_selection"
        | "trv11_start_end_stop_selection_200"
        | "fis12_select_pl"
        | "fis12_personal_loan_select"
        | "fis12_search_pl"
        | "fis13_addon_select"
        | "select_metro_trv11"
        | "init_metro_trv11"
        | "datetime-local"
        | "fis14_mutul_fund_select"
        | "fis14_mf_redemption_select"
        | "fis14_mf_sip_select"
        | "fis14_mf_cart_sip_select"
        | "insurance_select"
        | "manual_id"
        | "trv11_200_metro_select"
        | "trv11_210_common_item_fulfillment_select"
        | "trv14_search_incremental_pull_form"
        | "trv14_select"
        | "trv13_201_select";

    payloadField: string;
    values?: string[];
    defaultValue?: string;
    input?: FormFieldConfigType[];
    options?: ICheckboxOption[];
    default?: string | string[] | number | boolean | null;
    display?: boolean;
    reference?: string;
    // HTML_FORM source: "reference" (default) reads embedded HTML from reference_data via `reference`;
    // "url" fetches the live seller form HTML from the URL resolved by `urlReference`.
    htmlSource?: "reference" | "url";
    // JSONPath into reference_data that resolves to the seller form URL (items[*].xinput.form.url).
    urlReference?: string;
    formIdReference?: string;
    expectedFields?: IExpectedField[];
    expectedFieldsRef?: string;
    schema?: RJSFSchema;
    required?: boolean;
}

export type FormConfigType = FormFieldConfigType[];
