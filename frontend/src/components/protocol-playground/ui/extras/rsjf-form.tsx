import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import {
	RJSFSchema,
	FieldTemplateProps,
	ObjectFieldTemplateProps,
	ArrayFieldTemplateProps,
} from "@rjsf/utils";
import "./rsjs.css";
import { GrAdd } from "react-icons/gr";
import { MdDeleteOutline } from "react-icons/md";

interface JsonSchemaFormProps {
	schema: RJSFSchema;
	formData?: any;
	onSubmit: (data: any) => void;
	onChange?: (data: any) => void;
	title?: string;
}

// Custom Field Template with improved layout
function CustomFieldTemplate(props: FieldTemplateProps) {
	const {
		id,
		label,
		required,
		description,
		errors,
		help,
		children,
		hidden,
		displayLabel,
	} = props;

	if (hidden) {
		return <div className="field-hidden">{children}</div>;
	}

	return (
		<div className="form-group">
			{displayLabel && label && (
				<label htmlFor={id} className={required ? "required" : ""}>
					{label}
				</label>
			)}
			{description && <div className="field-description">{description}</div>}
			<div className="field-input">{children}</div>
			{errors && <div className="field-error">{errors}</div>}
			{help && <div className="help-block">{help}</div>}
		</div>
	);
}

// Custom Object Field Template with automatic grid layout
function CustomObjectFieldTemplate(props: ObjectFieldTemplateProps) {
	const { title, description, properties } = props;

	// Determine if this object should use grid layout
	const useGrid = properties.length > 1;
	const gridClass = useGrid ? "field-object" : "field-object single-field";

	return (
		<fieldset className={gridClass}>
			{title && <legend>{title}</legend>}
			{description && <div className="field-description">{description}</div>}
			<div className="object-properties">
				{properties.map((element) => (
					<div key={element.name} className="property-wrapper">
						{element.content}
					</div>
				))}
			</div>
		</fieldset>
	);
}

// Custom Array Field Template with improved styling
function CustomArrayFieldTemplate(props: ArrayFieldTemplateProps) {
	const { title, items, canAdd, onAddClick } = props;

	return (
		<div className="array-field">
			{title && <span className="array-title">{title}</span>}
			<div className="array-items">
				{items.map((element) => (
					<div key={element.key} className="array-item">
						<div className="array-item-content">{element.children}</div>
						{element.hasRemove && (
							<button
								type="button"
								className="array-item-remove"
								onClick={element.onDropIndexClick(element.index)}
								aria-label={`Remove item ${element.index + 1}`}
							>
								<MdDeleteOutline size={16} />
							</button>
						)}
					</div>
				))}
			</div>
			{canAdd && (
				<button
					type="button"
					className="array-add-button"
					onClick={onAddClick}
					aria-label="Add new item"
				>
					<GrAdd size={14} />
					Add
				</button>
			)}
		</div>
	);
}

export default function JsonSchemaForm({
	schema,
	formData,
	onSubmit,
	onChange,
	title,
}: JsonSchemaFormProps) {
	const handleSubmit = ({ formData }: any) => {
		onSubmit(formData);
	};

	const handleChange = ({ formData }: any) => {
		onChange?.(formData);
	};

	return (
		<div className="rjsf-custom-form">
			{title && <h2 className="form-title">{title}</h2>}
			<Form
				schema={schema}
				formData={formData}
				validator={validator}
				onSubmit={handleSubmit}
				onChange={handleChange}
				templates={{
					FieldTemplate: CustomFieldTemplate,
					ObjectFieldTemplate: CustomObjectFieldTemplate,
					ArrayFieldTemplate: CustomArrayFieldTemplate,
				}}
				showErrorList={false}
			/>
		</div>
	);
}
