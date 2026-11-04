import { useEffect, useMemo } from "react";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { ComboBox } from "@components/Shadcn/ComboBox";
import type { IComboBoxOption } from "@components/Shadcn/ComboBox/combo-box-options";
import { useAuth } from "@hooks/useAuth";

export const ORGANISATION_LABEL = "Select Organisation";

/** The NP Portal organisations the logged-in user belongs to, as dropdown options. */
export const useOrganisationOptions = (): IComboBoxOption[] => {
    const { user } = useAuth();
    return useMemo(
        () =>
            (user?.organisations ?? []).map((org) => ({
                value: org.organisationId,
                label: org.organisationName
                    ? `${org.organisationName} (${org.organisationId})`
                    : org.organisationId,
            })),
        [user]
    );
};

interface IOrganisationFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
}

/**
 * Lets an ONDC user pick which of their organisations a session or config is
 * for. Hidden when the user has no organisations (logged out or GitHub login);
 * with exactly one, it is picked straight away.
 */
export const OrganisationField = <T extends FieldValues>({
    control,
    name,
}: IOrganisationFieldProps<T>) => {
    const options = useOrganisationOptions();
    const {
        field: { value, onChange },
    } = useController({ control, name });

    const onlyOption = options.length === 1 ? options[0].value : "";
    useEffect(() => {
        if (onlyOption && !value) {
            onChange(onlyOption);
        }
    }, [onlyOption, value, onChange]);

    if (options.length === 0) {
        return null;
    }

    return (
        <ComboBox
            control={control}
            name={name}
            label={ORGANISATION_LABEL}
            options={options}
            placeholder="Select your organisation"
            required
        />
    );
};
