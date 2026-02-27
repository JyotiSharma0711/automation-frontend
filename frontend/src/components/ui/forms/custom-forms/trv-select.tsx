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
type CatalogFulfillmentStop = {
    type: string;
    instructions?: Record<string, unknown>;
    time?: Record<string, unknown>;
};
type CatalogFulfillment = {
    id: string;
    type?: string;
    stops?: CatalogFulfillmentStop[];
    agent?: Record<string, unknown>;
    vehicle?: Record<string, unknown>;
};
type CatalogProvider = { id: string; items?: CatalogItem[]; fulfillments?: CatalogFulfillment[] };
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
    items: FormItem[];
    fulfillmentId: string;
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
            items: [{ itemId: "", count: 1, addOns: [], addOnsQuantity: 1 }],
            fulfillmentId: "",
        },
    });

    const { fields, append, remove } = useFieldArray<FormValues, "items">({
        control,
        name: "items",
    });

    const selectedItems = watch("items");
    const [itemOptions, setItemOptions] = useState<ExtractedItem[]>([]);
    const [fulfillmentOptions, setFulfillmentOptions] = useState<CatalogFulfillment[]>([]);

    const onSubmit = async (data: FormValues) => {
        const selectedFulfillment = fulfillmentOptions.find((f) => f.id === data.fulfillmentId);
        const output = {
            provider: data.provider,
            items: data.items,
            fulfillments: selectedFulfillment
                ? [
                      {
                          id: selectedFulfillment.id,
                          stops: (selectedFulfillment.stops || []).map((stop) => ({
                              type: stop.type,
                              time: stop.time,
                          })),
                      },
                  ]
                : [],
        };
        await submitEvent({ jsonPath: {}, formData: output as unknown as Record<string, string> });
    };

    const handlePaste = (payload: unknown) => {
        setErrorWhilePaste("");
        try {
            const parsed = payload as OnSearchPayload;
            if (!parsed?.message?.catalog?.providers) return [];

            const providers = parsed.message.catalog.providers;

            const results: ExtractedItem[] = [];
            const allFulfillments: CatalogFulfillment[] = [];

            providers.forEach((provider: CatalogProvider) => {
                const providerId = provider.id;

                if (provider.fulfillments) {
                    allFulfillments.push(...provider.fulfillments);
                }

                if (!provider.items) return;

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
            setFulfillmentOptions(allFulfillments);
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

                {/* Fulfillment Selection */}
                <div className="border p-3 rounded space-y-2">
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Select Fulfillment</label>
                        {fulfillmentOptions.length === 0 ? (
                            <input
                                type="text"
                                {...register("fulfillmentId")}
                                placeholder="Fulfillment ID"
                                className={inputStyle}
                            />
                        ) : (
                            <select {...register("fulfillmentId")} className={inputStyle}>
                                <option value="">Select Fulfillment...</option>
                                {fulfillmentOptions.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.id}
                                        {f.type ? ` (${f.type})` : ""}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
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
