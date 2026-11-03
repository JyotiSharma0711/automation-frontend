import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ComboBoxControl } from "@components/Shadcn/ComboBox";
import { Button } from "@components/Shadcn/Button";
import TextField from "@components/Shadcn/TextField";
import PayloadEditor from "@components/PayloadEditor/PastePayloadModal";
import FormDialogShell from "@components/Forms/form-dialog-shell";
import { PastePayloadButton } from "@components/Forms/paste-payload-button";
import {
    IHotelCatalogItem,
    IHotel201FormData,
    IHotel201SelectProps,
    DEFAULT_HOTEL_201_FORM_DATA,
} from "../types/trv13-201-hotel-select-form-types";
import { cn } from "@/lib/utils";

export default function TRV13_201HotelSelectForm({ submitEvent }: IHotel201SelectProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [availableItems, setAvailableItems] = useState<IHotelCatalogItem[]>([]);

    const { control, handleSubmit, watch, reset, register, getValues } = useForm<IHotel201FormData>(
        {
            defaultValues: DEFAULT_HOTEL_201_FORM_DATA,
        }
    );

    const selectedItemId = watch("item_id");
    const selectedItem = availableItems.find((item) => item.id === selectedItemId);
    const availableAddons = selectedItem?.addOns || [];

    const handlePaste = (payload: Record<string, unknown>) => {
        try {
            const message = payload?.message as Record<string, unknown> | undefined;
            const catalog = message?.catalog as Record<string, unknown> | undefined;
            const providers = catalog?.providers as Record<string, unknown>[] | undefined;

            if (!providers || !providers.length) {
                throw new Error(
                    "Invalid Schema - Expected on_search payload with catalog.providers"
                );
            }

            const provider = providers[0] as Record<string, unknown>;
            const items = (provider.items || []) as Record<string, unknown>[];

            const catalogItems: IHotelCatalogItem[] = items.map((item) => {
                const descriptor = item.descriptor as Record<string, unknown> | undefined;
                const addOns = (item.add_ons || []) as Record<string, unknown>[];

                return {
                    id: (item.id as string) || "",
                    name: (descriptor?.name as string) || (item.id as string) || "",
                    locationIds: (item.location_ids as string[]) || [],
                    time: item.time as IHotelCatalogItem["time"],
                    addOns: addOns.map((addon) => {
                        const addonDescriptor = addon.descriptor as
                            | Record<string, unknown>
                            | undefined;
                        return {
                            id: (addon.id as string) || "",
                            name:
                                (addonDescriptor?.name as string) ||
                                (addonDescriptor?.short_desc as string) ||
                                (addon.id as string) ||
                                "",
                        };
                    }),
                };
            });

            setAvailableItems(catalogItems);

            const firstItem = catalogItems[0];
            if (!firstItem) {
                throw new Error("No items found in catalog");
            }

            const itemTimeRange = (
                firstItem.time as { range?: { start?: string; end?: string } } | undefined
            )?.range;
            const providerTimeRange = (
                provider.time as { range?: { start?: string; end?: string } } | undefined
            )?.range;
            const startTimeRaw = itemTimeRange?.start || providerTimeRange?.start;
            const endTimeRaw = itemTimeRange?.end || providerTimeRange?.end;

            const formatToDateStr = (dateVal?: string) => {
                if (!dateVal) return "";
                try {
                    return dateVal.split("T")[0];
                } catch {
                    return dateVal;
                }
            };

            const defaultStartTime =
                formatToDateStr(startTimeRaw) || new Date().toISOString().split("T")[0];
            const nextDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const defaultEndTime =
                formatToDateStr(endTimeRaw) || nextDay.toISOString().split("T")[0];

            reset({
                city_code: getValues("city_code") || "std:080",
                providerId: (provider.id as string) || "",
                locationId: firstItem.locationIds[0] || "",
                item_id: firstItem.id,
                quantity: 1,
                start_time: defaultStartTime,
                end_time: defaultEndTime,
                add_on_id: firstItem.addOns?.[0]?.id || "",
                adults_count: 1,
                children_count: 0,
            });

            setErrorWhilePaste("");
            toast.success(`Found ${catalogItems.length} items in catalog`);
        } catch (err) {
            const error = err as Error;
            setErrorWhilePaste(error.message || "Invalid payload structure");
            toast.error(error.message || "Invalid payload structure");
            console.error(err);
        }

        setIsPayloadEditorActive(false);
    };

    const onSubmit = async (data: IHotel201FormData) => {
        const formatIso = (dateStr?: string) => {
            if (!dateStr) return "";
            try {
                if (dateStr.includes("T")) return dateStr;
                return new Date(dateStr).toISOString();
            } catch {
                return dateStr;
            }
        };

        const selectPayload = {
            context: {
                location: {
                    city: {
                        code: data.city_code || "std:080",
                    },
                },
            },
            provider: {
                id: data.providerId || "",
                ...(data.start_time || data.end_time
                    ? {
                          time: {
                              range: {
                                  ...(data.start_time ? { start: formatIso(data.start_time) } : {}),
                                  ...(data.end_time ? { end: formatIso(data.end_time) } : {}),
                              },
                          },
                      }
                    : {}),
            },
            items: [
                {
                    id: data.item_id,
                    location_ids: data.locationId ? [data.locationId] : [],
                    quantity: {
                        selected: {
                            count: Number(data.quantity) || 1,
                        },
                    },
                    ...(data.add_on_id && {
                        add_ons: [{ id: data.add_on_id }],
                    }),
                },
            ],
            fulfillments: [
                {
                    tags: [
                        {
                            descriptor: { code: "GUESTS" },
                            list: [
                                {
                                    descriptor: { code: "ADULTS" },
                                    value: String(data.adults_count ?? 1),
                                },
                                {
                                    descriptor: { code: "CHILDREN" },
                                    value: String(data.children_count ?? 0),
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const jsonPath: Record<string, unknown> = {
            "$.context.location.city.code": data.city_code || "std:080",
            "$.message.order.items[0].id": data.item_id,
            "$.message.order.items[0].quantity.selected.count": Number(data.quantity) || 1,
            "$.message.order.provider.time.range.start": formatIso(data.start_time),
            "$.message.order.provider.time.range.end": formatIso(data.end_time),
            "$.message.order.fulfillments[0].tags[0].list[0].value": String(data.adults_count ?? 1),
            "$.message.order.fulfillments[0].tags[0].list[1].value": String(
                data.children_count ?? 0
            ),
        };

        if (data.add_on_id) {
            jsonPath["$.message.order.items[0].add_ons[0].id"] = data.add_on_id;
        }

        const formData: Record<string, unknown> = {
            city_code: data.city_code || "std:080",
            item_id: data.item_id,
            quantity: String(data.quantity),
            start_time: data.start_time,
            end_time: data.end_time,
            ...(data.add_on_id ? { add_on_id: data.add_on_id } : {}),
            adults_count: String(data.adults_count ?? 1),
            children_count: String(data.children_count ?? 0),
            provider_id: data.providerId || "",
            location_id: data.locationId || "",
            data: JSON.stringify(selectPayload),
        };

        await submitEvent({
            jsonPath,
            formData,
        });
    };

    const itemOptions = availableItems.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
    }));

    const addonOptions = availableAddons.map((addon) => ({
        value: addon.id,
        label: `${addon.name} (${addon.id})`,
    }));

    return (
        <>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste as (payload: unknown) => void}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={<Button type="submit">Submit Select Request</Button>}
            >
                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label="Paste on_search payload"
                />

                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <div
                    className={cn(
                        "space-y-4 rounded-lg border border-border-default bg-surface-muted/20 p-4"
                    )}
                >
                    <h3 className="font-semibold text-text-primary">Location Details</h3>

                    <TextField
                        control={control}
                        name="city_code"
                        label="City Code"
                        required
                        placeholder="Enter city code (e.g. std:080)"
                        rules={{ required: "City code is required" }}
                    />
                </div>

                <div
                    className={cn(
                        "space-y-4 rounded-lg border border-border-default bg-surface-muted/20 p-4"
                    )}
                >
                    <h3 className="font-semibold text-text-primary">Room Selection</h3>

                    {availableItems.length > 0 ? (
                        <Controller
                            name="item_id"
                            control={control}
                            rules={{ required: "Item ID is required" }}
                            render={({ field }) => (
                                <ComboBoxControl
                                    label="Item ID"
                                    required
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    options={itemOptions}
                                    placeholder="Select a room/item"
                                />
                            )}
                        />
                    ) : (
                        <TextField
                            control={control}
                            name="item_id"
                            label="Item ID"
                            required
                            placeholder="Enter item id (from on_search catalog)"
                            rules={{ required: "Item ID is required" }}
                        />
                    )}

                    <TextField
                        control={control}
                        name="quantity"
                        label="Quantity"
                        type="number"
                        required
                        rules={{ required: "Quantity is required" }}
                    />

                    {availableAddons.length > 0 ? (
                        <Controller
                            name="add_on_id"
                            control={control}
                            render={({ field }) => (
                                <ComboBoxControl
                                    label="Add-On (optional)"
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                    options={addonOptions}
                                    placeholder="No add-on"
                                />
                            )}
                        />
                    ) : (
                        <TextField
                            control={control}
                            name="add_on_id"
                            label="Add-On (optional)"
                            placeholder="Enter add-on id (optional)"
                        />
                    )}
                </div>

                <div
                    className={cn(
                        "space-y-4 rounded-lg border border-border-default bg-surface-muted/20 p-4"
                    )}
                >
                    <h3 className="font-semibold text-text-primary">Stay Duration</h3>

                    <TextField
                        control={control}
                        name="start_time"
                        label="Check In Time (YYYY-MM-DD)"
                        required
                        placeholder="YYYY-MM-DD"
                        rules={{ required: "Check In Time is required" }}
                    />

                    <TextField
                        control={control}
                        name="end_time"
                        label="Check Out Time (YYYY-MM-DD)"
                        required
                        placeholder="YYYY-MM-DD"
                        rules={{ required: "Check Out Time is required" }}
                    />
                </div>

                <div
                    className={cn(
                        "space-y-4 rounded-lg border border-border-default bg-surface-muted/20 p-4"
                    )}
                >
                    <h3 className="font-semibold text-text-primary">Guest Details</h3>

                    <TextField
                        control={control}
                        name="adults_count"
                        label="Number of Adults"
                        type="number"
                        required
                        rules={{ required: "Number of adults is required" }}
                    />

                    <TextField
                        control={control}
                        name="children_count"
                        label="Number of Children"
                        type="number"
                    />
                </div>

                <input type="hidden" {...register("providerId")} />
                <input type="hidden" {...register("locationId")} />
            </FormDialogShell>
        </>
    );
}
