import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@components/Shadcn/ComboBox";
import { Button } from "@components/Shadcn/Button";
import { DateTimePicker } from "@components/Shadcn/DateTimePicker";
import TextField from "@components/Shadcn/TextField";
import PayloadEditor from "@components/PayloadEditor/PastePayloadModal";
import FormDialogShell from "@components/Forms/form-dialog-shell";
import { PastePayloadButton } from "@components/Forms/paste-payload-button";
import type {
    IExtractedItem,
    IFormValues,
    IOnSearchPayload,
    ICatalogFulfillment,
    ITRVSelectFormProps,
} from "../types/trv-select-form-types";

interface ITimeRange {
    start?: string;
    end?: string;
}

interface IFulfillmentTime {
    timestamp?: string;
    range?: ITimeRange;
    [key: string]: unknown;
}

interface ITRV14FormValues extends IFormValues {
    city_code?: string;
    time?: {
        timestamp?: string;
        range?: {
            start?: string;
            end?: string;
        };
    };
}

const FLOWS_WITH_ADD_ITEM_BUTTON: string[] = [
    "purchase_journey_with_form_Multiple_Tickets",
    "purchase_journey_without_form_Multiple_Tickets",
    "user_cancellation_partial",
];

const formatToISO = (value?: string): string => {
    if (!value) return "";
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toISOString();
    } catch {
        return value;
    }
};

export default function TRV14SelectForm({ submitEvent, flowId }: ITRVSelectFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [providerOptions, setProviderOptions] = useState<string[]>([]);
    const [itemOptions, setItemOptions] = useState<IExtractedItem[]>([]);

    // ADDED: Store the complete original items array for each provider.
    const [payloadItemsByProvider, setPayloadItemsByProvider] = useState<Record<string, unknown[]>>(
        {}
    );

    const [fulfillmentOptions, setFulfillmentOptions] = useState<ICatalogFulfillment[]>([]);
    const [addOnPickerKeys, setAddOnPickerKeys] = useState<Record<number, number>>({});

    const { control, handleSubmit, watch, setValue, getValues } = useForm<ITRV14FormValues>({
        defaultValues: {
            provider: "",
            city_code: "std:080",
            items: [{ itemId: "", count: 1, addOns: [], addOnsQuantity: 1 }],
            fulfillmentId: "",
            time: {
                timestamp: new Date().toISOString(),
                range: {
                    start: new Date().toISOString(),
                    end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                },
            },
        },
    });

    const { fields, append, remove } = useFieldArray<ITRV14FormValues, "items">({
        control,
        name: "items",
    });

    const selectedItems = watch("items");
    const selectedItemIds = selectedItems.map((item) => item.itemId).filter((id) => id !== "");
    const selectedFulfillmentId = watch("fulfillmentId");

    const selectedFulfillment = fulfillmentOptions.find((f) => f.id === selectedFulfillmentId);

    const startStop = selectedFulfillment?.stops?.find(
        (stop) => stop.type?.trim().toLowerCase() === "start"
    );

    const timeObj = startStop?.time as IFulfillmentTime | undefined;

    const hasTimestamp = Boolean(
        timeObj && (timeObj.timestamp !== undefined || "timestamp" in timeObj)
    );
    const hasRange = Boolean(timeObj && (timeObj.range !== undefined || "range" in timeObj));

    const lastFulfillmentIdRef = useRef<string | null>(null);

    useEffect(() => {
        const fulfillmentKey = selectedFulfillment ? selectedFulfillment.id : "";
        if (fulfillmentKey !== lastFulfillmentIdRef.current) {
            lastFulfillmentIdRef.current = fulfillmentKey;
            if (!selectedFulfillment) {
                setValue("time.timestamp", "");
                setValue("time.range.start", "");
                setValue("time.range.end", "");
                return;
            }

            const stop = selectedFulfillment.stops?.find(
                (s) => s.type?.trim().toLowerCase() === "start"
            );
            const t = stop?.time as IFulfillmentTime | undefined;

            if (t?.timestamp !== undefined || (t && "timestamp" in t)) {
                setValue("time.timestamp", new Date().toISOString());
                setValue("time.range.start", "");
                setValue("time.range.end", "");
            } else if (t?.range !== undefined || (t && "range" in t)) {
                setValue("time.timestamp", "");
                setValue("time.range.start", new Date().toISOString());
                setValue(
                    "time.range.end",
                    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
                );
            } else {
                setValue("time.timestamp", "");
                setValue("time.range.start", "");
                setValue("time.range.end", "");
            }
        }
    }, [selectedFulfillment, setValue]);

    const filteredFulfillmentOptions =
        selectedItemIds.length === 0
            ? []
            : fulfillmentOptions.filter((fulfillment) =>
                  selectedItemIds.every((itemId) => {
                      const itemOpt = itemOptions.find((opt) => opt.itemid === itemId);
                      return itemOpt?.fulfillmentIds.includes(fulfillment.id);
                  })
              );

    const providerComboOptions = providerOptions.map((providerId) => ({
        value: providerId,
        label: providerId,
    }));

    const fulfillmentComboOptions = filteredFulfillmentOptions.map((fulfillment) => ({
        value: fulfillment.id,
        label: fulfillment.type ? `${fulfillment.id} (${fulfillment.type})` : fulfillment.id,
    }));

    const itemComboOptions = itemOptions.map((option) => ({
        value: option.itemid,
        label: option.itemid,
    }));

    const onSubmit = async (data: ITRV14FormValues) => {
        let timeData:
            | { timestamp: string }
            | { range: { start: string; end: string } }
            | undefined = undefined;

        if (hasTimestamp) {
            const rawTimestamp = data.time?.timestamp || new Date().toISOString();
            const isoTimestamp = formatToISO(rawTimestamp);
            if (!isoTimestamp) {
                toast.error("Please select a timestamp");
                return;
            }
            timeData = { timestamp: isoTimestamp };
        } else if (hasRange) {
            const rawStart = data.time?.range?.start || new Date().toISOString();
            const rawEnd =
                data.time?.range?.end ||
                new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
            const isoStart = formatToISO(rawStart);
            const isoEnd = formatToISO(rawEnd);
            if (!isoStart || !isoEnd) {
                toast.error("Please select both start and end range times");
                return;
            }
            timeData = {
                range: {
                    start: isoStart,
                    end: isoEnd,
                },
            };
        }

        const output: Record<string, unknown> = {
            provider: data.provider,
            city_code: data.city_code,

            // EXISTING FIELD: unchanged.
            items: data.items.map((item) => ({
                ...item,
                count: Number(item.count) || 1,
                addOnsQuantity: Number(item.addOnsQuantity) || 1,
            })),

            // ADDED: Complete original items array from pasted payload.
            catalog_items: payloadItemsByProvider[data.provider] || [],

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
            ...(timeData ? { time: timeData } : {}),
        };

        await submitEvent({
            jsonPath: {},
            formData: output as unknown as Record<string, unknown>,
        });
    };

    const handlePaste = (payload: unknown) => {
        setErrorWhilePaste("");
        try {
            const parsed = payload as IOnSearchPayload;
            if (!parsed?.message?.catalog?.providers) return;

            const providers = parsed.message.catalog.providers;
            const results: IExtractedItem[] = [];
            const allFulfillments: ICatalogFulfillment[] = [];
            const allProviders: string[] = [];

            // ADDED: Temporary storage for complete provider items arrays.
            const itemsByProvider: Record<string, unknown[]> = {};

            providers.forEach((provider) => {
                if (provider.id && !allProviders.includes(provider.id)) {
                    allProviders.push(provider.id);
                }
                if (provider.fulfillments) {
                    allFulfillments.push(...provider.fulfillments);
                }
                if (!provider.items) return;

                // ADDED: Preserve the complete original provider.items array.
                itemsByProvider[provider.id] = provider.items;

                provider.items.forEach((item) => {
                    if (item.parent_item_id) {
                        results.push({
                            itemid: item.id,
                            parentItemId: item.parent_item_id,
                            providerid: provider.id,
                            addOns: (item.add_ons || []).map((addon) => addon.id),
                            fulfillmentIds: item.fulfillment_ids || [],
                        });
                    }
                });
            });

            setProviderOptions(allProviders);

            // ADDED: Save original arrays by provider ID.
            setPayloadItemsByProvider(itemsByProvider);

            if (allProviders.length > 0) {
                setValue("provider", allProviders[0]);
            }
            setItemOptions(results);
            setFulfillmentOptions(allFulfillments);
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure. Please check the pasted data.");
            console.error(err);
        }
        setIsPayloadEditorActive(false);
    };

    const handleItemChange = (index: number, selectedId: string) => {
        const selectedOption = itemOptions.find((opt) => opt.itemid === selectedId);
        setValue(`items.${index}.itemId`, selectedId);

        if (selectedOption) {
            setValue(`items.${index}.parentItemId`, selectedOption.parentItemId);
            setValue("provider", selectedOption.providerid);
            setValue(`items.${index}.addOns`, []);

            const currentFulfillmentId = getValues("fulfillmentId");
            if (
                currentFulfillmentId &&
                !selectedOption.fulfillmentIds.includes(currentFulfillmentId)
            ) {
                setValue("fulfillmentId", "");
            }
        } else {
            setValue("fulfillmentId", "");
        }
    };

    const handleAddOnPick = (index: number, addOnId: string) => {
        if (!addOnId) return;

        const prev = getValues(`items.${index}.addOns`) ?? [];
        if (!prev.includes(addOnId)) {
            setValue(`items.${index}.addOns`, [...prev, addOnId]);
        }

        setAddOnPickerKeys((current) => ({
            ...current,
            [index]: (current[index] ?? 0) + 1,
        }));
    };

    return (
        <>
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={<Button type="submit">Submit</Button>}
            >
                <PastePayloadButton onClick={() => setIsPayloadEditorActive(true)} />
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}
                {itemOptions.length === 0 && (
                    <p className="text-sm text-destructive">
                        Please paste the on_search payload containing item details. Once available,
                        the item ID field will appear in the form for selection.
                    </p>
                )}

                <div className="space-y-3 rounded-lg border border-border-default p-3">
                    {providerOptions.length === 0 ? (
                        <TextField
                            control={control}
                            name="provider"
                            label="Provider ID"
                            placeholder="Provider ID"
                        />
                    ) : (
                        <Controller
                            name="provider"
                            control={control}
                            render={({ field }) => (
                                <ComboBoxControl
                                    label="Select Provider"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    options={providerComboOptions}
                                    placeholder="Select provider..."
                                />
                            )}
                        />
                    )}
                </div>

                <div className="space-y-3 rounded-lg border border-border-default p-3">
                    <TextField
                        control={control}
                        name="city_code"
                        label="City Code"
                        placeholder="std:080"
                    />
                </div>

                {fields.map((field, index) => {
                    const currentItemId = selectedItems[index]?.itemId;
                    const selectedExtracted = itemOptions.find(
                        (opt) => opt.itemid === currentItemId
                    );
                    const availableAddOns = selectedExtracted?.addOns ?? [];
                    const addOnComboOptions = availableAddOns.map((addonId) => ({
                        value: addonId,
                        label: addonId,
                    }));

                    return (
                        <div
                            key={field.id}
                            className="space-y-3 rounded-lg border border-border-default p-3"
                        >
                            {itemOptions.length === 0 ? (
                                <TextField
                                    control={control}
                                    name={`items.${index}.itemId`}
                                    label={`Select Item ${index + 1}`}
                                    placeholder="Paste on_search payload first"
                                />
                            ) : (
                                <Controller
                                    name={`items.${index}.itemId`}
                                    control={control}
                                    render={({ field: itemField }) => (
                                        <ComboBoxControl
                                            label={`Select Item ${index + 1}`}
                                            value={itemField.value}
                                            onValueChange={(value) => {
                                                itemField.onChange(value);
                                                handleItemChange(index, value);
                                            }}
                                            options={itemComboOptions}
                                            placeholder="Select..."
                                        />
                                    )}
                                />
                            )}

                            <TextField
                                control={control}
                                name={`items.${index}.count`}
                                label="Quantity"
                                type="number"
                                min={1}
                                required
                            />

                            {availableAddOns.length > 0 && (
                                <div className="space-y-2">
                                    <ComboBoxControl
                                        key={`addon-picker-${index}-${addOnPickerKeys[index] ?? 0}`}
                                        label="Add Ons"
                                        value=""
                                        onValueChange={(value) => handleAddOnPick(index, value)}
                                        options={addOnComboOptions}
                                        placeholder="Select add-on..."
                                    />

                                    {selectedItems[index]?.addOns?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItems[index].addOns.map((addonId) => (
                                                <span
                                                    key={addonId}
                                                    className="rounded-md bg-surface-muted px-2 py-1 text-sm text-text-primary"
                                                >
                                                    {addonId}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {selectedItems[index]?.addOns?.length > 0 && (
                                        <TextField
                                            control={control}
                                            name={`items.${index}.addOnsQuantity`}
                                            label="Add Ons Quantity"
                                            type="number"
                                            min={1}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="flex flex-wrap gap-2">
                    {flowId && FLOWS_WITH_ADD_ITEM_BUTTON.includes(flowId) && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                append({ itemId: "", count: 1, addOns: [], addOnsQuantity: 1 })
                            }
                        >
                            <PlusIcon className="size-4" />
                            Add Item
                        </Button>
                    )}
                    {fields.length > 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => remove(fields.length - 1)}
                        >
                            Remove Item
                        </Button>
                    )}
                </div>

                <div className="space-y-3 rounded-lg border border-border-default p-3">
                    {fulfillmentOptions.length === 0 ? (
                        <TextField
                            control={control}
                            name="fulfillmentId"
                            label="Select Fulfillment"
                            placeholder="Fulfillment ID"
                        />
                    ) : (
                        <Controller
                            name="fulfillmentId"
                            control={control}
                            render={({ field }) => (
                                <ComboBoxControl
                                    label="Select Fulfillment"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    options={fulfillmentComboOptions}
                                    placeholder="Select fulfillment..."
                                />
                            )}
                        />
                    )}
                    {selectedItemIds.length > 0 && filteredFulfillmentOptions.length === 0 && (
                        <p className="text-xs text-destructive">
                            No fulfillments available for the selected items.
                        </p>
                    )}
                </div>

                {hasTimestamp && (
                    <div className="space-y-3 rounded-lg border border-border-default p-3">
                        <DateTimePicker
                            control={control}
                            name="time.timestamp"
                            id="fulfillment-time-timestamp"
                            label="Timestamp"
                            placeholder="Select timestamp"
                            required
                        />
                    </div>
                )}

                {hasRange && (
                    <div className="space-y-3 rounded-lg border border-border-default p-3">
                        <h4 className="text-sm font-semibold text-text-primary">
                            Fulfillment Time Range
                        </h4>
                        <DateTimePicker
                            control={control}
                            name="time.range.start"
                            id="fulfillment-time-range-start"
                            label="Start Time"
                            placeholder="Select start date and time"
                            required
                        />
                        <DateTimePicker
                            control={control}
                            name="time.range.end"
                            id="fulfillment-time-range-end"
                            label="End Time"
                            placeholder="Select end date and time"
                            required
                        />
                    </div>
                )}
            </FormDialogShell>
        </>
    );
}
