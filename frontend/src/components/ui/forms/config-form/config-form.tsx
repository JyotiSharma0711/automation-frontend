import { useContext } from "react";
import { FormInput } from "../form-input";
import FormSelect from "../form-select";
import CheckboxGroup, { CheckboxOption } from "../checkbox";
import ItemCustomisationSelector from "../nested-select";
import ItemCustomisationSelectorRET11 from "../ret11-nested-select";
import GenericForm from "../generic-form";
import GenericFormWithPaste from "../generic-form-with-paste";
import { SubmitEventParams } from "../../../../types/flow-types";
import Ret10GrocerySelect from "../custom-forms/ret10-grocery-select";
import RetINVLInit from "../custom-forms/retinvl-init";
import ProtocolHTMLForm from "../custom-forms/protocol-html-form";
import ProtocolHTMLFormMulti from "../custom-forms/protocol-html-form-multi";
import TRVSelect from "../custom-forms/trv-select";
import TRV10Select from "../custom-forms/trv10-select";
import TRV10ScheduleForm from "../custom-forms/trv10-schedule";
import TRV10ScheduleRentalForm from "../custom-forms/trv10-scheduleRental";
import TRV11Select from "../custom-forms/trv11-select";
import JsonSchemaForm from "../../../../pages/protocol-playground/ui/extras/rsjf-form";
import AirlineSelect from "@/components/ui/forms/custom-forms/airline-select";
import AirlineSeatSelect from "@/components/ui/forms/custom-forms/airline-seat-select";
import HotelSelect from "@/components/ui/forms/custom-forms/hotel-select";
import TRV12busSeatSelection from "../custom-forms/trv-seat-count";
import FinvuRedirectForm from "../custom-forms/finvu-redirect-form";
import DynamicFormHandler from "../custom-forms/dynamic-form-handler";
import { SessionContext } from "../../../../context/context";
import IntercitySelect from "../custom-forms/intercity-select";
import HotelSelectProvider from "../custom-forms/hotel-slect-provider";
import FIS13ItemSelection from "../custom-forms/fis13_select";
import RideHailingSelect from "../custom-forms/trv10-201-select";
import SearchAccidentalFis13 from "../custom-forms/search-accidental-fis13";
import SearchHospicashFis13 from "../custom-forms/search-hospicash-fis13";
import SearchTransitFis13 from "../custom-forms/search-transit-fis13";
import SearchDiscoverProductFis13 from "../custom-forms/search-discover-product-fis13";
import Metro210Select from "../custom-forms/metro-seat-select";
import Metro210EndStopUpdate from "../custom-forms/update-end-stop-update";
import Metro210StartEndStopSelection from "../custom-forms/trv11_start_end_stop_selection";
import FIS12Select from "../custom-forms/fis12-select";
import FIS12Search from "../custom-forms/fis12-search";
import { RJSFSchema } from "@rjsf/utils";

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
        | "ret11_nestedSelect"
        | "retinvl_init"
        | "nestedSelect"
        | "trv_select"
        | "trv10_select"
        | "trv10_schedule"
        | "trv10_schedule_rental"
        | "trv11_select"
        | "hotel_select"
        | "HTML_FORM"
        | "HTML_FORM_MULTI"
        | "FINVU_REDIRECT"
        | "DYNAMIC_FORM"
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
        | "fis12_select_pl"
        | "fis12_search_pl";
    payloadField: string;
    values?: string[];
    defaultValue?: string;
    input?: FormFieldConfigType[];
    options?: CheckboxOption[];
    default?: string | string[] | number | boolean | null;
    display?: boolean;
    reference?: string;
    schema?: RJSFSchema;
    required?: boolean;
}

export type FormConfigType = FormFieldConfigType[];

export default function FormConfig({
    formConfig,
    submitEvent,
    referenceData,
    flowId,
}: {
    formConfig: FormConfigType;
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
    flowId?: string;
}) {
    const sessionContext = useContext(SessionContext);
    const sessionId = sessionContext?.sessionId || "";
    const sessionData = sessionContext?.sessionData;

    const onSubmit = async (data: Record<string, string>) => {
        const formatedData: Record<string, string | number> = {};
        const formData: Record<string, string> = data;
        for (const key in data) {
            const payloadField = formConfig.find((field) => field.name === key)?.payloadField;
            if (payloadField) {
                if (payloadField.includes("count") || payloadField.includes("quantity")) {
                    formatedData[payloadField] = parseInt(data[key], 10) || 0;
                }
                // Convert date to ISO 8601 format if payloadField contains 'timestamp' or 'time'
                else if (payloadField.includes("timestamp") || payloadField.includes("time.")) {
                    const dateValue = data[key];
                    // Check if it's already in ISO format or just a date
                    if (dateValue && !dateValue.includes("T")) {
                        formatedData[payloadField] = `${dateValue}T00:00:00Z`;
                    } else {
                        formatedData[payloadField] = dateValue;
                    }
                } else {
                    formatedData[payloadField] = data[key];
                }
            }
        }
        await submitEvent({ jsonPath: formatedData, formData: formData });
    };

    const defaultValues: Record<string, unknown> = {};
    let isNoFieldVisible = false;

    formConfig.forEach((field) => {
        const { display = true } = field;

        if (field.default) {
            defaultValues[field.name] = field.default;
        }

        if (display) {
            isNoFieldVisible = true;
        }
    });

    // Check for DYNAMIC_FORM type
    if (formConfig.find((field) => field.type === "DYNAMIC_FORM")) {
        // Get transaction ID from session context using flowId
        let transactionId: string | undefined = undefined;
        if (flowId && sessionData && sessionData.flowMap) {
            transactionId = sessionData.flowMap[flowId] || undefined;
        }

        const dynamicFormField = formConfig.find((field) => field.type === "DYNAMIC_FORM");

        return (
            <DynamicFormHandler
                submitEvent={submitEvent}
                referenceData={referenceData}
                sessionId={sessionId}
                transactionId={transactionId || ""}
                formConfig={dynamicFormField}
            />
        );
    }

    // Check for FINVU_REDIRECT type
    if (formConfig.find((field) => field.type === "FINVU_REDIRECT")) {
        // Get transaction ID from session context using flowId
        let transactionId: string | undefined = undefined;
        if (flowId && sessionData && sessionData.flowMap) {
            transactionId = sessionData.flowMap[flowId] || undefined;
        }

        return (
            <FinvuRedirectForm
                submitEvent={submitEvent}
                referenceData={referenceData}
                sessionId={sessionId}
                transactionId={transactionId || ""}
            />
        );
    }

    if (formConfig.find((field) => field.type === "ret10_grocery_select")) {
        return <Ret10GrocerySelect submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "ret11_nestedSelect")) {
        const field = formConfig.find((field) => field.type === "ret11_nestedSelect")!;
        return (
            <ItemCustomisationSelectorRET11
                name={field.name}
                label={field.label}
                submitEvent={submitEvent}
            />
        );
    }
    if (formConfig.find((field) => field.type === "ret10_grocery_select")) {
        return <Ret10GrocerySelect submitEvent={submitEvent} />;
    }
    if (formConfig.find((field) => field.type === "retinvl_init")) {
        return <RetINVLInit submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "fis13_select")) {
        return <FIS13ItemSelection submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv12_bus_seat_selection")) {
        return <TRV12busSeatSelection submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "airline_seat_select")) {
        return <AirlineSeatSelect submitEvent={submitEvent} />;
    }
    if (formConfig.find((field) => field.type === "HTML_FORM_MULTI")) {
        return ProtocolHTMLFormMulti({
            submitEvent: submitEvent,
            referenceData: referenceData,
            HtmlFormConfigInFlow: formConfig.find(
                (field) => field.type === "HTML_FORM_MULTI"
            ) as FormFieldConfigType,
        });
    }
    if (formConfig.find((field) => field.type === "HTML_FORM")) {
        return ProtocolHTMLForm({
            submitEvent: submitEvent,
            referenceData: referenceData,
            HtmlFormConfigInFlow: formConfig.find(
                (field) => field.type === "HTML_FORM"
            ) as FormFieldConfigType,
        });
    }

    // Default: GenericForm
    if (formConfig.find((field) => field.type === "trv10_select")) {
        return <TRV10Select submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv10_schedule")) {
        return <TRV10ScheduleForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv10_schedule_rental")) {
        return <TRV10ScheduleRentalForm submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv_select")) {
        return <TRVSelect submitEvent={submitEvent} flowId={flowId} />;
    }

    if (formConfig.find((field) => field.type === "trv11_select")) {
        return <TRV11Select submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "airline_select")) {
        return <AirlineSelect submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "intercity_select")) {
        return <IntercitySelect submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "hotel_select")) {
        return <HotelSelect submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv13_select_provider")) {
        return <HotelSelectProvider submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv10_201_select")) {
        return <RideHailingSelect submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "search_accidental_fis13")) {
        return <SearchAccidentalFis13 submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "search_hospicash_fis13")) {
        return <SearchHospicashFis13 submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "search_transit_fis13")) {
        return <SearchTransitFis13 submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "search_discover_product_fis13")) {
        return <SearchDiscoverProductFis13 submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv11_210_select")) {
        return <Metro210Select submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv11_210_update_end_station")) {
        return <Metro210EndStopUpdate submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "trv11_210_start_end_stop_selection")) {
        return <Metro210StartEndStopSelection submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "fis12_select_pl")) {
        return <FIS12Select submitEvent={submitEvent} />;
    }

    if (formConfig.find((field) => field.type === "fis12_search_pl")) {
        return <FIS12Search submitEvent={submitEvent} />;
    }

    // NOTE: The JsonSchemaForm check must come after all other specific form type checks above.
    // Check for schema form
    if (formConfig.find((f) => f.schema)) {
        const schemaField = formConfig.find((f) => f.schema);
        return JsonSchemaForm({
            schema: schemaField!.schema as RJSFSchema,
            onSubmit: onSubmit as (data: Record<string, unknown>) => Promise<void>,
        });
    }

    // Check if form has fields that can be populated from on_search (like item_id for TRV13)
    const enablePaste = formConfig.some((field) => field.name === "item_id");
    const FormComponent = enablePaste ? GenericFormWithPaste : GenericForm;

    return (
        <FormComponent
            defaultValues={defaultValues}
            className="h-[500px] overflow-scroll"
            onSubmit={onSubmit}
            triggerSubmit={!isNoFieldVisible}
            enablePaste={enablePaste}
        >
            {formConfig.map((field) => {
                const { display = true } = field;
                if (!display) {
                    return <></>;
                }

                switch (field.type) {
                    case "text":
                        return (
                            <FormInput
                                name={field.name}
                                label={field.label}
                                required={field.required !== false}
                                // key={field.payloadField}
                            />
                        );
                    case "date":
                        return (
                            <FormInput
                                name={field.name}
                                label={field.label}
                                required={field.required !== false}
                                type="date"
                                // key={field.payloadField}
                            />
                        );
                    case "select":
                        return (
                            <FormSelect
                                name={field.name}
                                label={field.label}
                                options={field.values || []}
                                // key={field.payloadField}
                            />
                        );
                    case "checkbox":
                        return (
                            <CheckboxGroup
                                options={field.options || []}
                                label={field.label}
                                name={field.name}
                                defaultValue={field.default as string[] | undefined}
                            />
                        );
                    case "nestedSelect":
                        return <ItemCustomisationSelector label={field.label} name={field.name} />;
                    default:
                        return <></>;
                }
            })}
        </FormComponent>
    );
}
