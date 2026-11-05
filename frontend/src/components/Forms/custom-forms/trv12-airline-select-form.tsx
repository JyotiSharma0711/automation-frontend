import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

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

                    {availableProviders.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                Select Provider from Catalog
                            </label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                value={
                                    availableProviders.some((p) => p.id === watch("provider"))
                                        ? watch("provider")
                                        : ""
                                }
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setValue("provider", e.target.value, {
                                            shouldValidate: true,
                                        });
                                    }
                                }}
                            >
                                <option value="">-- Choose a provider from catalog --</option>
                                {availableProviders.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <TextField
                        control={control}
                        name="provider"
                        label="Provider ID"
                        placeholder="Enter provider ID (from on_search or manual)"
                        required
                    />

                    {availableFulfillments.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                Select Fulfillment from Catalog
                            </label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                value={
                                    availableFulfillments.some((f) => f.id === watch("fulfillment"))
                                        ? watch("fulfillment")
                                        : ""
                                }
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setValue("fulfillment", e.target.value, {
                                            shouldValidate: true,
                                        });
                                    }
                                }}
                            >
                                <option value="">-- Choose a fulfillment from catalog --</option>
                                {availableFulfillments.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.type ? `${f.id} (${f.type})` : f.id}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <TextField
                        control={control}
                        name="fulfillment"
                        label="Fulfillment ID"
                        placeholder="Enter fulfillment ID (from on_search or manual)"
                        required
                    />
                </div>

                {fields.map((field, index) => {
                    const selectedItemId = watchedItems?.[index]?.itemId || "";
                    const itemAddons = getAddonsForItem(selectedItemId);

                    return (
                        <div
                            key={field.id}
                            className="space-y-2 rounded-lg border border-border p-4"
                        >
                            {availableItems.length > 0 && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Select Item from Catalog
                                    </label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                        value={
                                            availableItems.some(
                                                (item) => item.id === watchedItems?.[index]?.itemId
                                            )
                                                ? watchedItems?.[index]?.itemId
                                                : ""
                                        }
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val) {
                                                setValue(`items.${index}.itemId`, val, {
                                                    shouldValidate: true,
                                                });
                                                const found = availableItems.find(
                                                    (it) => it.id === val
                                                );
                                                if (found?.addOns?.[0]?.id) {
                                                    setValue(
                                                        `items.${index}.addOnId`,
                                                        found.addOns[0].id
                                                    );
                                                }
                                            }
                                        }}
                                    >
                                        <option value="">-- Choose an item from catalog --</option>
                                        {availableItems.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} ({item.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <TextField
                                control={control}
                                name={`items.${index}.itemId`}
                                label="Item ID"
                                placeholder="Enter item ID (e.g. I1, I5)"
                                required
                            />

                            <TextField
                                control={control}
                                name={`items.${index}.count`}
                                label="Item Quantity"
                                type="number"
                                min={1}
                                required
                            />

                            {itemAddons.length > 0 && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Select Add-On from Catalog
                                    </label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                        value={
                                            itemAddons.some(
                                                (addon) =>
                                                    addon.id === watchedItems?.[index]?.addOnId
                                            )
                                                ? watchedItems?.[index]?.addOnId
                                                : ""
                                        }
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                setValue(`items.${index}.addOnId`, e.target.value, {
                                                    shouldValidate: true,
                                                });
                                            }
                                        }}
                                    >
                                        <option value="">-- Choose an add-on --</option>
                                        {itemAddons.map((addon) => (
                                            <option key={addon.id} value={addon.id}>
                                                {addon.name} ({addon.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <TextField
                                control={control}
                                name={`items.${index}.addOnId`}
                                label="Add-On ID"
                                placeholder="Enter add-on ID (optional)"
                            />

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
