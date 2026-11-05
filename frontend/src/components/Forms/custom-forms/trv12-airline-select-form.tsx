import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBox } from "@components/Shadcn/ComboBox";
import { Button } from "@components/Shadcn/Button";
import TextField from "@components/Shadcn/TextField";
import PayloadEditor from "@components/PayloadEditor/PastePayloadModal";
import FormDialogShell from "@components/Forms/form-dialog-shell";
import { PastePayloadButton } from "@components/Forms/paste-payload-button";
import {
    IFormData,
    ICatalogItem,
    ICatalogAddOn,
    ICatalogItemRaw,
    ICatalogFulfillment,
    IOnSearchPayload,
    IAirlineSelectProps,
    DEFAULT_FORM_DATA,
} from "../types/trv12-airline-select-form-types";

export default function TRV12AirlineSelectForm({
    submitEvent,
    defaultValues = DEFAULT_FORM_DATA,
}: IAirlineSelectProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [availableItems, setAvailableItems] = useState<ICatalogItem[]>([]);
    const [availableProviders, setAvailableProviders] = useState<{ id: string; name: string }[]>(
        []
    );
    const [availableFulfillments, setAvailableFulfillments] = useState<ICatalogFulfillment[]>([]);

    const { control, handleSubmit, setValue, reset, watch } = useForm<IFormData>({
        defaultValues,
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const watchedItems = watch("items");

    const getAddonsForItem = (itemId: string) => {
        const item = availableItems.find((i) => i.id === itemId);
        return item?.addOns || [];
    };

    const handlePaste = (payload: unknown) => {
        try {
            const parsed = payload as IOnSearchPayload;
            if (!parsed?.message?.catalog?.providers || !parsed.message.catalog.providers.length) {
                throw new Error("Invalid Schema");
            }

            const providers = parsed.message.catalog.providers;
            const provider = providers[0];

            const catalogItems: ICatalogItem[] = (provider.items || []).map(
                (item: ICatalogItemRaw) => ({
                    id: item.id,
                    name: item.descriptor?.name || item.id,
                    addOns: (item.add_ons || []).map((addon: ICatalogAddOn) => ({
                        id: addon.id,
                        name: addon.descriptor?.name || addon.id,
                    })),
                })
            );

            const extractedProviders = providers.map((p) => ({
                id: p.id,
                name: p.descriptor?.name ? `${p.descriptor.name} (${p.id})` : p.id,
            }));
            setAvailableProviders(extractedProviders);

            const fulfillments: ICatalogFulfillment[] = [];
            if (provider.fulfillments) {
                fulfillments.push(...provider.fulfillments);
            }
            if (parsed.message?.catalog?.fulfillments) {
                parsed.message.catalog.fulfillments.forEach((f) => {
                    if (!fulfillments.some((existing) => existing.id === f.id)) {
                        fulfillments.push(f);
                    }
                });
            }
            setAvailableFulfillments(fulfillments);

            setAvailableItems(catalogItems);
            setErrorWhilePaste("");

            const cityCode =
                parsed.context?.location?.city?.code || parsed.context?.city || "std:080";
            const initialProviderId = provider.id || "";
            const initialFulfillmentId =
                fulfillments[0]?.id || provider.fulfillments?.[0]?.id || "";

            setValue("city_code", cityCode);
            setValue("provider", initialProviderId);
            setValue("fulfillment", initialFulfillmentId);

            if (catalogItems.length > 0) {
                reset({
                    city_code: cityCode,
                    provider: initialProviderId,
                    fulfillment: initialFulfillmentId,
                    items: [
                        {
                            itemId: catalogItems[0].id,
                            count: 1,
                            addOnId: catalogItems[0].addOns?.[0]?.id || "",
                            addOnCount: 1,
                        },
                    ],
                });
                toast.success(`Found ${catalogItems.length} items in catalog`);
            }
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure");
            console.error(err);
        }

        setIsPayloadEditorActive(false);
    };

    const onSubmit = async (data: IFormData) => {
        const finalItems = data.items.map((item) => ({
            itemId: item.itemId,
            count:
                typeof item.count === "number" ? item.count : parseInt(String(item.count), 10) || 1,
            addOns: item.addOnId
                ? [
                      {
                          id: item.addOnId,
                          count:
                              typeof item.addOnCount === "number"
                                  ? item.addOnCount
                                  : parseInt(String(item.addOnCount), 10) || 1,
                      },
                  ]
                : [],
        }));

        const providerId = data.provider || data.provider_id || "";
        const fulfillmentId = data.fulfillment || data.fulfillment_id || "";
        const cityCode = data.city_code || "std:080";

        const selectedFulfillment =
            availableFulfillments.find((f) => f.id === fulfillmentId) ||
            (fulfillmentId ? { id: fulfillmentId } : undefined);

        const finalPayload = {
            provider: providerId,
            fulfillment: fulfillmentId,
            items: finalItems,
        };

        await submitEvent({
            jsonPath: {},
            formData: {
                data: JSON.stringify(finalPayload),
                provider: providerId,
                provider_id: providerId,
                fulfillment_id: fulfillmentId,
                city_code: cityCode,
                fulfillment: selectedFulfillment,
                fulfillments:
                    availableFulfillments.length > 0
                        ? availableFulfillments
                        : selectedFulfillment
                          ? [selectedFulfillment]
                          : [],
            },
        });
    };

    return (
        <>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-1"
                            onClick={() =>
                                append({
                                    itemId: "",
                                    count: 1,
                                    addOnId: "",
                                    addOnCount: 1,
                                })
                            }
                        >
                            <PlusIcon className="size-4" />
                            Add Another Item
                        </Button>
                        <Button type="submit">Submit</Button>
                    </>
                }
            >
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <PastePayloadButton
                    label="Paste on_search"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className="mb-0"
                />

                <div className="space-y-4 rounded-lg border border-border p-4">
                    <TextField
                        control={control}
                        name="city_code"
                        label="City Code"
                        required
                        placeholder="std:080"
                    />

                    {availableProviders.length > 0 ? (
                        <ComboBox
                            control={control}
                            name="provider"
                            label="Provider ID"
                            required
                            options={availableProviders.map((p) => ({
                                label: p.name,
                                value: p.id,
                            }))}
                        />
                    ) : (
                        <TextField
                            control={control}
                            name="provider"
                            label="Provider ID"
                            placeholder="Paste on_search payload or enter provider ID"
                            required
                        />
                    )}

                    {availableFulfillments.length > 0 ? (
                        <ComboBox
                            control={control}
                            name="fulfillment"
                            label="Fulfillment ID"
                            required
                            options={availableFulfillments.map((f) => ({
                                label: f.type ? `${f.id} (${f.type})` : f.id,
                                value: f.id,
                            }))}
                        />
                    ) : (
                        <TextField
                            control={control}
                            name="fulfillment"
                            label="Fulfillment ID"
                            placeholder="Paste on_search payload or enter fulfillment ID"
                            required
                        />
                    )}
                </div>

                {fields.map((field, index) => {
                    const selectedItemId = watchedItems?.[index]?.itemId || "";
                    const itemAddons = getAddonsForItem(selectedItemId);

                    return (
                        <div
                            key={field.id}
                            className="space-y-2 rounded-lg border border-border p-4"
                        >
                            {availableItems.length > 0 ? (
                                <ComboBox
                                    control={control}
                                    name={`items.${index}.itemId`}
                                    label="Item ID"
                                    required
                                    options={availableItems.map((item) => ({
                                        label: `${item.name} (${item.id})`,
                                        value: item.id,
                                    }))}
                                />
                            ) : (
                                <TextField
                                    control={control}
                                    name={`items.${index}.itemId`}
                                    label="Item ID"
                                    placeholder="Paste on_search payload to populate items"
                                    required
                                />
                            )}

                            <TextField
                                control={control}
                                name={`items.${index}.count`}
                                label="Item Quantity"
                                type="number"
                                min={1}
                                required
                            />

                            {itemAddons.length > 0 ? (
                                <ComboBox
                                    control={control}
                                    name={`items.${index}.addOnId`}
                                    label="Add-On ID"
                                    options={itemAddons.map((addon) => ({
                                        label: `${addon.name} (${addon.id})`,
                                        value: addon.id,
                                    }))}
                                />
                            ) : (
                                <TextField
                                    control={control}
                                    name={`items.${index}.addOnId`}
                                    label="Add-On ID"
                                    placeholder="No add-ons available or select an item first"
                                />
                            )}

                            <TextField
                                control={control}
                                name={`items.${index}.addOnCount`}
                                label="Add-On Quantity"
                                type="number"
                            />

                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    className="gap-1"
                                >
                                    <TrashIcon className="size-4" />
                                    Remove Item
                                </Button>
                            )}
                        </div>
                    );
                })}
            </FormDialogShell>
        </>
    );
}
