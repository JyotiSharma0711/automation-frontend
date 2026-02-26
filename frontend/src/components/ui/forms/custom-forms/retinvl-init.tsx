import { useState } from "react";
import { useForm, useFieldArray, Controller, FieldPath } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

type OfferKey = `offers_${string}`;

type CatalogItem = { id: string };
export type CatalogLocation = { id: string };
type CatalogOffer = { id: string };
export type CatalogProvider = {
    id: string;
    items: CatalogItem[];
    locations: CatalogLocation[];
    offers?: CatalogOffer[];
};

type OnSearchPayload = {
    message: {
        catalog: {
            "bpp/providers": CatalogProvider[];
        };
    };
};

type FormValues = {
    city_code: string;
    provider: string;
    provider_location: string[];
    location_gps: string;
    location_pin_code: string;
    order_type: "ILBN" | "ILFP" | "ILBP";
    items: {
        itemId: string;
        quantity: number;
        location: string;
        estimated_price: number;
    }[];
} & Partial<Record<OfferKey, boolean>>;

export default function RetINVLInit({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [isDataPasted, setIsDataPasted] = useState(false);

    const { control, handleSubmit, watch, register } = useForm<FormValues>({
        defaultValues: {
            city_code: "",
            provider: "",
            provider_location: [],
            location_gps: "",
            location_pin_code: "",
            order_type: "ILBN",
            items: [
                {
                    itemId: "",
                    quantity: 1,
                    location: "",
                    estimated_price: 0,
                },
                {
                    itemId: "",
                    quantity: 1,
                    location: "",
                    estimated_price: 0,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const [providerOptions, setProviderOptions] = useState<string[]>([]);
    const [itemOptions, setItemOptions] = useState<string[]>([]);
    const [locationOptions, setLocationOptions] = useState<string[]>([]);
    const [offerOptions, setOfferOptions] = useState<string[]>([]);
    const [providers, setProviders] = useState<CatalogProvider[]>([]);

    const selectedProvider = watch("provider");

    const onSubmit = async (data: FormValues) => {
        const { valid, errors } = validateFormData(data);
        if (!valid) {
            toast.error(`Form validation failed: ${errors[0]}`);
            return;
        }

        await submitEvent({
            jsonPath: {},
            formData: data as unknown as Record<string, string>,
        });
    };

    const handlePaste = (data: unknown) => {
        try {
            const providers = (data as OnSearchPayload).message.catalog["bpp/providers"];
            setProviders(providers);

            setProviderOptions(providers.map((p) => p.id));

            const provider = providers[0];
            if (provider) {
                setItemOptions(provider.items.map((i) => i.id));
                setLocationOptions(provider.locations.map((l) => l.id));
            }

            const offers = providers.flatMap((p) => p.offers || []).map((offer) => offer.id);

            setOfferOptions(offers);
            setIsDataPasted(true);
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure.");
            console.error(err);
        }

        setIsPayloadEditorActive(false);
    };

    const inputStyle =
        "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
    const labelStyle = "mb-1 font-semibold";
    const fieldWrapperStyle = "flex flex-col mb-2";

    const renderSelectOrInput = (name: string, options: string[], placeholder = "") => {
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
            <select {...register(name as unknown as FieldPath<FormValues>)} className={inputStyle}>
                <option value="">Select...</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        );
    };

    return (
        <div>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}
            {errorWhilePaste && (
                <p className="text-red-500 text-sm italic mt-1">{errorWhilePaste}</p>
            )}

            <button
                type="button"
                onClick={() => setIsPayloadEditorActive(true)}
                className="p-2 border rounded-full"
            >
                <FaRegPaste size={14} />
            </button>

            {!isDataPasted ? (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500">
                    Paste on_search payload to continue
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 p-4 h-[500px] overflow-y-scroll"
                >
                    {/* ORDER TYPE */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Order Type</label>
                        <select {...register("order_type")} className={inputStyle}>
                            <option value="ILBN">ILBN</option>
                            <option value="ILFP">ILFP</option>
                            <option value="ILBP">ILBP</option>
                        </select>
                    </div>

                    {/* PROVIDER */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Provider</label>
                        {renderSelectOrInput("provider", providerOptions)}
                    </div>

                    <Controller
                        name="provider_location"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => {
                            const provider = providers.find((p) => p.id === selectedProvider);
                            const locations = provider?.locations || [];

                            const handleCheckboxChange = (value: string) => {
                                const current = Array.isArray(field.value) ? field.value : [];
                                field.onChange(
                                    current.includes(value)
                                        ? current.filter((v) => v !== value)
                                        : [...current, value]
                                );
                            };

                            if (locations.length === 0) {
                                return (
                                    <>
                                        <label className={labelStyle}>Provider Location Id:</label>
                                        <input
                                            type="text"
                                            {...register("provider_location")}
                                            className={inputStyle}
                                        />
                                    </>
                                );
                            }

                            return (
                                <div className="flex flex-col gap-2">
                                    {locations.map((loc: CatalogLocation) => (
                                        <label
                                            key={loc.id}
                                            className="inline-flex gap-2 items-center"
                                        >
                                            <input
                                                type="checkbox"
                                                value={loc.id}
                                                checked={field.value.includes(loc.id)}
                                                onChange={() => handleCheckboxChange(loc.id)}
                                                className="accent-blue-600"
                                            />
                                            <span>{loc.id}</span>
                                        </label>
                                    ))}
                                </div>
                            );
                        }}
                    />

                    {/* CITY */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>City Code</label>
                        <input {...register("city_code")} className={inputStyle} />
                    </div>

                    {/* GPS */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>GPS</label>
                        <input {...register("location_gps")} className={inputStyle} />
                    </div>

                    {/* PIN */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Pin Code</label>
                        <input {...register("location_pin_code")} className={inputStyle} />
                    </div>
                    {offerOptions.length > 0 && (
                        <div className={fieldWrapperStyle}>
                            <label className={labelStyle}>Available Offers</label>
                            {offerOptions.map((offerId) => (
                                <label key={offerId} className="inline-flex gap-2 items-center">
                                    <input
                                        type="checkbox"
                                        value={offerId}
                                        {...register(`offers_${offerId}` as OfferKey)}
                                        className="accent-blue-600"
                                    />
                                    {offerId}
                                </label>
                            ))}
                        </div>
                    )}

                    {/* ITEMS */}
                    {fields.map((field, index) => (
                        <div key={field.id} className="border p-3 rounded">
                            <div className={fieldWrapperStyle}>
                                <label>Item ID</label>
                                {renderSelectOrInput(`items.${index}.itemId`, itemOptions)}
                            </div>

                            <div className={fieldWrapperStyle}>
                                <label>Quantity</label>
                                <input
                                    type="number"
                                    {...register(`items.${index}.quantity`, {
                                        valueAsNumber: true,
                                    })}
                                    className={inputStyle}
                                />
                            </div>

                            <div className={fieldWrapperStyle}>
                                <label>Estimated Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register(`items.${index}.estimated_price`, {
                                        valueAsNumber: true,
                                    })}
                                    className={inputStyle}
                                />
                            </div>

                            <div className={fieldWrapperStyle}>
                                <label>Item Location</label>
                                {renderSelectOrInput(`items.${index}.location`, locationOptions)}
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                append({
                                    itemId: "",
                                    quantity: 1,
                                    location: "",
                                    estimated_price: 0,
                                })
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Add Item
                        </button>

                        {fields.length > 2 && (
                            <button
                                type="button"
                                onClick={() => remove(fields.length - 1)}
                                className="px-4 py-2 bg-red-500 text-white rounded"
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
                        Submit
                    </button>
                </form>
            )}
        </div>
    );
}

// ================= VALIDATION =================

function validateFormData(data: FormValues) {
    const errors: string[] = [];

    if (!data.order_type) errors.push("Order type required.");

    if (!data.provider) errors.push("Provider required.");

    if (!data.city_code) errors.push("City code required.");

    if (!data.location_gps) errors.push("GPS required.");

    if (!data.location_pin_code) errors.push("Pin code required.");

    if (!data.provider_location?.length) errors.push("Select provider location.");

    if (!data.items || data.items.length < 2) errors.push("At least 2 items required.");

    data.items.forEach((item, index) => {
        if (!item.itemId) errors.push(`Item ${index + 1}: ID required`);
        if (!item.location) errors.push(`Item ${index + 1}: Location required`);
        if (!item.quantity || item.quantity <= 0)
            errors.push(`Item ${index + 1}: Quantity invalid`);
        if (!item.estimated_price || item.estimated_price <= 0)
            errors.push(`Item ${index + 1}: Estimated price invalid and must be greater than 1`);
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}
