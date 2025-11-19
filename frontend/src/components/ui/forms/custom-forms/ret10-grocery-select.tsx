import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

export default function Ret10GrocerySelect({
	submitEvent,
}: {
	submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
	const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
	const [errorWhilePaste, setErrorWhilePaste] = useState("");
	const [isDataPasted, setIsDataPasted] = useState(false)

	const { control, handleSubmit, watch, register } = useForm({
		defaultValues: {
			provider: "" as string,
			provider_location: [],
			location_gps: "",
			location_pin_code: "",
			items: [
				{ itemId: "", quantity: 1, location: "" },
				{ itemId: "", quantity: 1, location: "" },
			],
		} as any,
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "items",
	});

	const [providerOptions, setProviderOptions] = useState<string[]>([]);
	const [itemOptions, setItemOptions] = useState<string[]>([]);
	const [locationOptions, setLocationOptions] = useState<string[]>([]);
	const [offerOptions, setOfferOptions] = useState<string[]>([]);
	const [providers, setProviders] = useState<any[]>([]);

	const selectedProvider = watch("provider");

	const onSubmit = async (data: any) => {
		console.log("Form Data", data);
		const { valid, errors } = validateFormData(data);
		if (!valid) {
			toast.error(`Form validation failed: ${errors[0]}`);
			return;
		}
		await submitEvent({ jsonPath: {}, formData: data });
	};

	const handlePaste = (data: any) => {
		try {
			const providers = data.message.catalog["bpp/providers"];
			setProviders(providers);

			const providerIDs = providers.map((p: any) => p.id);
			setProviderOptions(providerIDs);

			const provider = providers[0];
			if (provider) {
				setItemOptions(provider.items.map((i: any) => i.id));
				setLocationOptions(provider.locations.map((l: any) => l.id));
			}

			const offers = providers
				.flatMap((p: any) => p.offers || [])
				.map((offer: any) => offer.id);
			setOfferOptions(offers);
			setIsDataPasted(true)
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
		options: string[],
		placeholder = ""
	) => {
		if (options.length === 0) {
			return (
				<input
					type="text"
					{...register(name)}
					placeholder={placeholder}
					className={inputStyle}
				/>
			);
		}
		return (
			<select {...register(name)} className={inputStyle}>
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
			{isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}
			{errorWhilePaste && (
				<p className="text-red-500 text-sm italic mt-1">{errorWhilePaste}</p>
			)}
			<button
				type="button"
				onClick={() => setIsPayloadEditorActive(true)}
				className="p-2 border rounded-full hover:bg-gray-100"
			>
				<FaRegPaste size={14} />
			</button>

			{
			!isDataPasted ? 
			<div className="flex items-start gap-3 border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
				<p className="text-sm text-blue-800 flex items-center gap-1">
					Paste <strong>on_search</strong> payload using the button
					<span className="p-2 border rounded-full hover:bg-gray-100">
					<FaRegPaste size={14} />
					</span>
					to select items
				</p>
			</div>
			:
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="space-y-4 h-[500px] overflow-y-scroll p-4"
			>
				<div className={fieldWrapperStyle}>
					<label className={labelStyle}>Select Provider Id</label>
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
								{locations.map((loc: any) => (
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

				<div className={fieldWrapperStyle}>
					<label className={labelStyle}>Delivery Location GPS</label>
					<input {...register("location_gps")} className={inputStyle} />
				</div>

				<div className={fieldWrapperStyle}>
					<label className={labelStyle}>Delivery Pin Code</label>
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
									{...register(`offers_${offerId}`)}
									className="accent-blue-600"
								/>
								{offerId}
							</label>
						))}
					</div>
				)}

				{fields.map((field, index) => (
					<div key={field.id} className="border p-3 rounded space-y-2">
						<div className={fieldWrapperStyle}>
							<label className={labelStyle}>Select Item ID: {index + 1}</label>
							{renderSelectOrInput(`items.${index}.itemId`, itemOptions)}
						</div>

						<div className={fieldWrapperStyle}>
							<label className={labelStyle}>Quantity</label>
							<input
								type="number"
								{...register(`items.${index}.quantity`, {
									valueAsNumber: true,
								})}
								className={inputStyle}
							/>
						</div>

						<div className={fieldWrapperStyle}>
							<label className={labelStyle}>Item Location Id:</label>
							{renderSelectOrInput(`items.${index}.location`, locationOptions)}
						</div>
					</div>
				))}

				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => append({ itemId: "", quantity: 1, location: "" })}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Add Item
					</button>
					{fields.length > 2 && (
						<button
							type="button"
							onClick={() => remove(fields.length - 1)}
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
						>
							Remove Item
						</button>
					)}
				</div>

				<button
					type="submit"
					className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
				>
					Submit
				</button>
			</form>
			}
		</div>
	);
}

type FormData = {
	provider: string;
	provider_location: string[];
	location_gps: string;
	location_pin_code: string;
	items: {
		itemId: string;
		quantity: number;
		location: string;
	}[];
	[key: string]: any; // to allow dynamic offer keys like offers_FLAT50
};

function validateFormData(data: FormData): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Validate top-level fields (excluding items and offer checkboxes)
	const fieldsToValidate = ['provider', 'location_gps', 'location_pin_code'];
	for (const key of fieldsToValidate) {
		if (data[key] === undefined || data[key] === null || data[key] === "") {
			errors.push(`Field ${key} cannot be empty.`);
		}
	}

	// Validate provider_location (must have at least one selection)
	if (!data.provider_location || data.provider_location.length === 0) {
		errors.push("At least one provider location must be selected.");
	}

	// Rule 1: At least 2 items
	if (!data.items || data.items.length < 2) {
		errors.push("At least 2 items must be selected.");
	}

	// Rule 2: Validate each item's fields
	if (data.items) {
		data.items.forEach((item, index) => {
			if (!item.itemId || item.itemId === "") {
				errors.push(`Item ${index + 1}: Item ID cannot be empty.`);
			}
			if (!item.location || item.location === "") {
				errors.push(`Item ${index + 1}: Location cannot be empty.`);
			}
			if (!item.quantity || item.quantity <= 0) {
				errors.push(`Item ${index + 1}: Quantity must be greater than 0.`);
			}
		});
	}

	// Rule 3: All items must be unique
	const itemIds = data.items.map((item) => item.itemId).filter(id => id !== "");
	const uniqueItemIds = new Set(itemIds);
	if (itemIds.length > 0 && itemIds.length !== uniqueItemIds.size) {
		errors.push("All selected items must be unique.");
	}

	// Rule 4: Only one offer can be selected (non-falsy)
	const offerKeys = Object.keys(data).filter((key) =>
		key.startsWith("offers_")
	);
	const selectedOffers = offerKeys.filter((key) => Boolean(data[key]));
	if (selectedOffers.length > 1) {
		errors.push("Only one offer can be selected.");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
