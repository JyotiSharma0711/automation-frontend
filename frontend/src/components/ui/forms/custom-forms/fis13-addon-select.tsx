import { useState } from "react";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

interface AddOn {
    id: string;
    descriptor?: {
        name?: string;
        code?: string;
    };
    price?: {
        currency?: string;
        value?: string;
    };
    quantity?: {
        available?: { count?: number };
        maximum?: { count?: number };
    };
}

interface SelectedAddOn {
    id: string;
    quantity: number;
}

export default function FIS13AddonSelect({
    submitEvent,
    referenceData,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
}) {
    const addOns = (referenceData?.selected_add_ons ?? []) as AddOn[];
    const [selected, setSelected] = useState<SelectedAddOn[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleAddon = (addon: AddOn) => {
        setSelected((prev) => {
            const exists = prev.find((s) => s.id === addon.id);
            if (exists) {
                return prev.filter((s) => s.id !== addon.id);
            }
            return [...prev, { id: addon.id, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, quantity: number) => {
        setSelected((prev) => prev.map((s) => (s.id === id ? { ...s, quantity } : s)));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formData: Record<string, string> = {};
            if (selected.length > 0) {
                formData.addon_ids = selected.map((s) => s.id).join(",");
                formData.addon_quantities = selected.map((s) => s.quantity).join(",");
            }
            await submitEvent({ jsonPath: {}, formData });
        } catch (err) {
            toast.error("Error submitting addon selection");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <label className="mb-1 font-semibold block text-gray-700">
                    Select Add-ons (Optional)
                </label>

                {addOns.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-72 overflow-y-auto">
                        {addOns.map((addon) => {
                            const isSelected = selected.some((s) => s.id === addon.id);
                            const selectedItem = selected.find((s) => s.id === addon.id);
                            const maxCount = addon.quantity?.maximum?.count ?? 10;

                            return (
                                <div
                                    key={addon.id}
                                    className={`p-3 transition-colors ${
                                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                                    }`}
                                >
                                    <div
                                        className="flex items-center justify-between cursor-pointer"
                                        onClick={() => toggleAddon(addon)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {addon.descriptor?.name || addon.id}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    ID: {addon.id}
                                                    {addon.descriptor?.code &&
                                                        ` | ${addon.descriptor.code}`}
                                                </p>
                                            </div>
                                        </div>
                                        {addon.price?.value && (
                                            <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                                                {addon.price.currency || "INR"} {addon.price.value}
                                            </span>
                                        )}
                                    </div>

                                    {isSelected && (
                                        <div className="mt-2 ml-7 flex items-center gap-2">
                                            <label className="text-xs text-gray-600">Qty:</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={maxCount}
                                                value={selectedItem?.quantity ?? 1}
                                                onChange={(e) =>
                                                    updateQuantity(
                                                        addon.id,
                                                        Math.max(
                                                            1,
                                                            Math.min(
                                                                maxCount,
                                                                parseInt(e.target.value) || 1
                                                            )
                                                        )
                                                    )
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-16 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-gray-400">
                                                (max: {maxCount})
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-500">
                            No add-ons available. You can proceed without selecting any.
                        </p>
                    </div>
                )}

                {selected.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {selected.map((item) => {
                            const addon = addOns.find((a) => a.id === item.id);
                            return (
                                <span
                                    key={item.id}
                                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                                >
                                    {addon?.descriptor?.name || item.id} x{item.quantity}
                                </span>
                            );
                        })}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-lg font-semibold transition-all shadow-md ${
                        isSubmitting
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700 active:transform active:scale-[0.98]"
                    }`}
                >
                    {selected.length > 0
                        ? `Submit with ${selected.length} Add-on${selected.length > 1 ? "s" : ""}`
                        : "Continue without Add-ons"}
                </button>
            </div>
        </div>
    );
}
