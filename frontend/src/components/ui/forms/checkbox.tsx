import { LabelWithToolTip } from "./form-input";

export interface CheckboxOption {
  name: string;
  code: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  label: string;
  labelInfo?: string;
  name: string; // form field name
  register: any;
  required?: boolean;
  disabled?: boolean;
  onChange?: (selectedCodes: string[]) => void;
}

const CheckboxGroup = ({
  register = (_: any) => {},
  options,
  name,
  label,
  labelInfo = "",
  required = false,
  disabled = false,
  onChange,
}: CheckboxGroupProps) => {
  return (
    <div className="space-y-3 p-4 rounded-lg border border-gray-200 shadow-md max-w-md bg-white">
      <LabelWithToolTip labelInfo={labelInfo} label={label} />
      {options.map(({ name: optionName, code }) => (
        <label
          key={code}
          className={`flex items-center space-x-2 cursor-pointer ${
            disabled ? "opacity-50" : ""
          }`}
        >
          <input
            type="checkbox"
            value={code}
            disabled={disabled}
            {...register(name, {
              required: required && "This field is required",
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const form = e.target.form;
                if (form && onChange) {
                  const data = new FormData(form);
                  const selectedValues = data.getAll(name) as string[];
                  onChange(selectedValues);
                }
              },
            })}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <span className="text-gray-700">
            {optionName} ({code})
          </span>
        </label>
      ))}
    </div>
  );
};

export default CheckboxGroup;
