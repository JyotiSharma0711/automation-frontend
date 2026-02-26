import { useState } from "react";
import { useForm, useFieldArray, FieldPath } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

interface ExtractedItem {
    itemid: string;
    parentItemId: string;
    providerid: string;
    addOns: string[];
}

// Flow IDs where "Add Item" button should be visible
const FLOWS_WITH_ADD_ITEM_BUTTON: string[] = [
    "purchase_journey_with_form_Multiple_Tickets",
    "purchase_journey_without_form_Multiple_Tickets",
    "user_cancellation_partial",
];

type CatalogAddOn = { id: string };
type CatalogItem = { id: string; parent_item_id?: string; add_ons?: CatalogAddOn[] };
type CatalogFulfillment = { id: string };
type CatalogProvider = { id: string; fulfillments: CatalogFulfillment[]; items?: CatalogItem[] };
type OnSearchPayload = { message?: { catalog?: { providers?: CatalogProvider[] } } };

type FormItem = {
    itemId: string;
    count: number;
    addOns: string[];
    addOnsQuantity: number;
    parentItemId?: string;
};

type FormValues = {
    provider: string;
    fulfillment?: string;
    timestamp?: string;
    items: FormItem[];
};

export default function TRVSelect({
    submitEvent,
    flowId,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    flowId?: string;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");

    const { control, handleSubmit, watch, register, setValue, getValues } = useForm<FormValues>({
        defaultValues: {
            provider: "",
            timestamp: "",
            items: [{ itemId: "", count: 1, addOns: [], addOnsQuantity: 1 }],
        },
    });

    const { fields, append, remove } = useFieldArray<FormValues, "items">({
        control,
        name: "items",
    });

    const selectedItems = watch("items");
    const [itemOptions, setItemOptions] = useState<ExtractedItem[]>([]);

    const onSubmit = async (data: FormValues) => {
        // Convert timestamp to ISO format if present
        if (data.timestamp) {
            data.timestamp = new Date(data.timestamp).toISOString();
        }
        await submitEvent({ jsonPath: {}, formData: data as unknown as Record<string, string> });
    };

    const handlePaste = (payload: unknown) => {
        setErrorWhilePaste("");
        try {
            const parsed = payload as OnSearchPayload;
            if (!parsed?.message?.catalog?.providers) return [];

            const providers = parsed.message.catalog.providers;

            const results: ExtractedItem[] = [];

            providers.forEach((provider: CatalogProvider) => {
                const providerId = provider.id;
                const fulfillmentId = provider.fulfillments[0]!.id;
                if (!fulfillmentId) return;

                if (!provider.items) return;

                setValue("fulfillment", provider.fulfillments[0]!.id);

                provider.items.forEach((item: CatalogItem) => {
                    if (item.parent_item_id) {
                        results.push({
                            itemid: item.id,
                            parentItemId: item.parent_item_id,
                            providerid: providerId,
                            addOns: (item.add_ons || []).map((addon: CatalogAddOn) => addon.id),
                        });
                    }
                });
            });

            setItemOptions(results);
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure. Please check the pasted data.");
            console.error(err);
        }
        setIsPayloadEditorActive(false);
    };

    const inputStyle =
        "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
    const labelStyle = "mb-1 font-semibold";
    const fieldWrapperStyle = "flex flex-col mb-2";

    const renderSelectOrInput = (
        name: string,
        options: ExtractedItem[],
        index: number,
        placeholder = ""
    ) => {
        if (options.length === 0) {
            return (
                <input
                    type="text"
                    {...register(name as unknown as FieldPath<FormValues>)}
                    placeholder={placeholder}
                    className={inputStyle}
                />
            );
        }
        return (
            <select
                {...register(name as unknown as FieldPath<FormValues>)}
                onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedOption = options.find((opt) => opt.itemid === selectedId);

                    if (selectedOption) {
                        // update the other fields in the same row
                        setValue(
                            `items.${index}.parentItemId` as unknown as FieldPath<FormValues>,
                            selectedOption.parentItemId
                        );
                        setValue("provider", selectedOption.providerid);
                        setValue(
                            `items.${index}.addOns` as unknown as FieldPath<FormValues>,
                            [] as string[]
                        );
                    }
                }}
                className={inputStyle}
            >
                <option value="">Select...</option>
                {options.map((option) => (
                    <option key={option.itemid} value={option.itemid}>
                        {option.itemid}
                    </option>
                ))}
            </select>
        );
    };

    return (
        <div>
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}
            {errorWhilePaste && (
                <p className="text-red-500 text-sm italic mt-1">{errorWhilePaste}</p>
            )}
            <div>
                <button
                    type="button"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className="p-2 border rounded-full hover:bg-gray-100"
                >
                    <FaRegPaste size={14} />
                </button>
                {itemOptions.length === 0 && (
                    <span className="ml-1.5 text-red-600">
                        Please paste the on_search payload containing item details. Once available,
                        the item ID field will appear in the form for selection.
                    </span>
                )}
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 h-[500px] overflow-y-scroll p-4"
            >
                {fields.map((field, index) => (
                    <div key={field.id} className="border p-3 rounded space-y-2">
                        <div className={fieldWrapperStyle}>
                            <label className={labelStyle}>Select Item {index + 1}</label>
                            {renderSelectOrInput(`items.${index}.itemId`, itemOptions, index)}
                        </div>

                        <div className={fieldWrapperStyle}>
                            <label className={labelStyle}>Quantity</label>
                            <input
                                type="number"
                                {...register(`items.${index}.count`, {
                                    valueAsNumber: true,
                                })}
                                className={inputStyle}
                            />
                        </div>

                        {itemOptions && itemOptions[index]?.addOns?.length > 0 && (
                            <div className={fieldWrapperStyle}>
                                <label className={labelStyle}>Add Ons</label>
                                <select
                                    className={inputStyle}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) return;
                                        const prev = getValues().items[index]?.addOns ?? [];
                                        if (!prev.includes(val)) {
                                            setValue(
                                                `items.${index}.addOns` as unknown as FieldPath<FormValues>,
                                                [...prev, val]
                                            );
                                        }
                                    }}
                                >
                                    <option value="">Select Add Ons</option>
                                    {itemOptions[index].addOns.map((c: string) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>

                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedItems[index]?.addOns?.map((c: string, i: number) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </div>

                                {selectedItems[index]?.addOns?.length > 0 && (
                                    <div className={`mt-2 ${fieldWrapperStyle}`}>
                                        <label className={labelStyle}>Add Ons Quantity</label>
                                        <input
                                            type="number"
                                            {...register(`items.${index}.addOnsQuantity`, {
                                                valueAsNumber: true,
                                            })}
                                            className={inputStyle}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                <div className="flex gap-2">
                    {flowId && FLOWS_WITH_ADD_ITEM_BUTTON.includes(flowId) && (
                        <button
                            type="button"
                            onClick={() =>
                                append({ itemId: "", count: 1, addOns: [], addOnsQuantity: 1 })
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Add Item
                        </button>
                    )}
                    {fields.length > 1 && (
                        <button
                            type="button"
                            onClick={() => remove(fields.length - 1)}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Remove Item
                        </button>
                    )}
                </div>

                <div className={fieldWrapperStyle}>
                    <label className={labelStyle}>Timestamp</label>
                    <input
                        type="datetime-local"
                        {...register("timestamp")}
                        className={inputStyle}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                    Submit
                </button>
            </form>
        </div>
    );
}

// type FormData = {
//   provider: string;
//   provider_location: string[];
//   location_gps: string;
//   location_pin_code: string;
//   items: {
//     itemId: string;
//     quantity: number;
//     location: string;
//   }[];
//   [key: string]: any; // to allow dynamic offer keys like offers_FLAT50
// };

// function validateFormData(data: FormData): {
//   valid: boolean;
//   errors: string[];
// } {
//   const errors: string[] = [];

//   for (const key in data) {
//     if (data[key] === undefined || data[key] === null || data[key] === "") {
//       errors.push(`Field ${key} cannot be empty.`);
//     }
//   }

//   // Rule 1: At least 2 items
//   if (!data.items || data.items.length < 2) {
//     errors.push("At least 2 items must be selected.");
//   }

//   // Rule 2: All items must be unique
//   const itemIds = data.items.map((item) => item.itemId);
//   const uniqueItemIds = new Set(itemIds);
//   if (itemIds.length !== uniqueItemIds.size) {
//     errors.push("All selected items must be unique.");
//   }

//   // Rule 3: Only one offer can be selected (non-falsy)
//   const offerKeys = Object.keys(data).filter((key) =>
//     key.startsWith("offers_")
//   );
//   const selectedOffers = offerKeys.filter((key) => Boolean(data[key]));
//   if (selectedOffers.length > 1) {
//     errors.push("Only one offer can be selected.");
//   }

//   return {
//     valid: errors.length === 0,
//     errors,
//   };
// }
