import { BindableSource, DataSource, ReadOnlyDataSource, SetDataSource, dsMap, dsUnique } from '@aurum/html';

export type FormSchema<T extends object> = {
    defaultErrorMessages?: {
        required?: string;
        minLength?: string;
        maxLength?: string;
        match?: string;
        oneOf?: string;
        min?: string;
        max?: string;
        integer?: string;
        custom?: string;
    };
    fields: { [key in keyof T]: FieldSchema<T[key]> };
};

export type ValidationResult<T> = {
    [key in keyof T]: FormViolation | undefined;
};

export type FieldSchema<T> = [T] extends [string]
    ? StringFieldSchema<Extract<T, string>>
    : [T] extends [number]
    ? NumberFieldSchema<Extract<T, number>>
    : [T] extends [boolean]
    ? BooleanFieldSchema<Extract<T, boolean>>
    : [T] extends [Date]
    ? DateFieldSchema<Extract<T, Date>>
    : never;

export interface StringFieldSchema<T extends string = string> {
    source: BindableSource<T>;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    match?: RegExp;
    oneOf?: readonly T[];
    customValidator?: (value: T) => FormViolation | Promise<FormViolation> | undefined;
}

export interface NumberFieldSchema<T extends number = number> {
    source: BindableSource<T>;
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    customValidator?: (value: T) => FormViolation | Promise<FormViolation> | undefined;
}

export interface BooleanFieldSchema<T extends boolean = boolean> {
    source: BindableSource<T>;
    required?: boolean;
    customValidator?: (value: T) => FormViolation | Promise<FormViolation> | undefined;
}

export interface DateFieldSchema<T extends Date = Date> {
    source: BindableSource<T>;
    required?: boolean;
    min?: Date;
    max?: Date;
    customValidator?: (value: T) => FormViolation | Promise<FormViolation> | undefined;
}

export type FormFieldName<T extends object, V> = Extract<
    { [K in keyof T]-?: [T[K]] extends [V] ? ([V] extends [T[K]] ? K : never) : never }[keyof T],
    string
>;

export function getFormFieldSource<T extends object, V>(form: FormType<T, unknown>, key: FormFieldName<T, V>): BindableSource<V> {
    // FormFieldName requires the model field and requested value type to be
    // mutually assignable. Keep the conditional-type cast at this boundary so
    // controls do not need to weaken their public contracts.
    return form.schema.fields[key].source as unknown as BindableSource<V>;
}

export interface FormType<T extends object, O> {
    submitting: ReadOnlyDataSource<boolean>;
    submitError: ReadOnlyDataSource<string>;
    submit(): Promise<O | undefined>;
    schema: FormSchema<T>;
    violation: {
        [key in keyof T]: ReadOnlyDataSource<FormViolation | undefined>;
    };
    isValid: {
        [key in keyof T]: ReadOnlyDataSource<boolean>;
    };
    isInvalid: {
        [key in keyof T]: ReadOnlyDataSource<boolean>;
    };
    setValidationState(key: keyof T, violation: FormViolation | undefined): void;
    fieldsWithViolations: SetDataSource<keyof T>;
    isFullyValid(): Promise<boolean>;
    validateAll(): Promise<ValidationResult<T>>;
    getFormObject(): T;
    validateField(key: keyof T): FormViolation | Promise<FormViolation> | undefined;
}

export interface FormViolation {
    type: FormViolationType;
    message: string;
}

export enum FormViolationType {
    Min = 'min',
    Max = 'max',
    MinLength = 'minLength',
    MaxLength = 'maxLength',
    Match = 'match',
    OneOf = 'oneOf',
    Required = 'required',
    Integer = 'integer',
    Custom = 'custom'
}

export function createForm<T extends object, O = void>(
    schema: FormSchema<T>,
    onSubmit: (object: T, markAsFailed: (error: string) => void) => Promise<O>
): FormType<T, O> {
    const validationState = {} as { [key in keyof T]: DataSource<FormViolation | undefined> };
    const validationEpoch = {} as { [key in keyof T]: number };
    const pendingValidation = {} as { [key in keyof T]: Promise<FormViolation | undefined> | undefined };
    let activeSubmission: Promise<O | undefined> | undefined;

    const messages = {
        required: 'This field is required',
        minLength: 'Too short',
        maxLength: 'Too long',
        match: 'Value does not match the required pattern',
        oneOf: 'Value is not one of the allowed values',
        min: 'Value is too low',
        max: 'Value is too high',
        integer: 'Value is not an integer',
        custom: 'Invalid Value',
        ...schema.defaultErrorMessages
    };
    schema.defaultErrorMessages = messages;

    const api: FormType<T, O> = {
        submit: () => {
            if (activeSubmission) {
                return activeSubmission;
            }

            activeSubmission = (async () => {
                if (!(await api.isFullyValid())) {
                    return undefined;
                }

                const object = api.getFormObject();
                (api.submitError as DataSource<string>).update('');
                (api.submitting as DataSource<boolean>).update(true);
                try {
                    return await onSubmit(object, (error) => {
                        (api.submitError as DataSource<string>).update(error);
                    });
                } catch (error) {
                    (api.submitError as DataSource<string>).update(error instanceof Error ? error.message : String(error));
                    return undefined;
                } finally {
                    (api.submitting as DataSource<boolean>).update(false);
                }
            })().finally(() => {
                activeSubmission = undefined;
            });

            return activeSubmission;
        },
        submitting: new DataSource(false),
        submitError: new DataSource(''),
        schema,
        // Proper object will be built in the next step
        isValid: {} as FormType<T, O>['isValid'],
        isInvalid: {} as FormType<T, O>['isInvalid'],
        violation: {} as FormType<T, O>['violation'],
        fieldsWithViolations: new SetDataSource(),
        setValidationState(key: keyof T, violation: FormViolation | undefined): void {
            validationEpoch[key] = (validationEpoch[key] ?? 0) + 1;
            pendingValidation[key] = undefined;
            commitValidationState(key, violation);
        },
        async isFullyValid(): Promise<boolean> {
            let isValid = true;
            for (const key in schema.fields) {
                if ((await api.validateField(key as keyof T)) !== undefined) {
                    isValid = false;
                    // do not return early as validation can have side effects
                }
            }

            return isValid;
        },
        async validateAll(): Promise<ValidationResult<T>> {
            const result: Partial<ValidationResult<T>> = {};
            for (const key in schema.fields) {
                result[key] = await api.validateField(key as keyof T);
            }

            return result as ValidationResult<T>;
        },
        getFormObject(): T {
            const result = {} as T;
            for (const key in schema.fields) {
                const fieldName = key as keyof T;
                result[fieldName] = schema.fields[fieldName].source.value as T[keyof T];
            }

            return result;
        },
        validateField(key: keyof T): FormViolation | Promise<FormViolation> | undefined {
            const field = schema.fields[key];
            const value = field.source.value;
            const epoch = (validationEpoch[key] ?? 0) + 1;
            validationEpoch[key] = epoch;
            pendingValidation[key] = undefined;

            const optionalValueIsEmpty =
                value === undefined ||
                value === null ||
                (typeof value === 'string' && value.length === 0) ||
                (typeof value === 'number' && Number.isNaN(value)) ||
                (value instanceof Date && Number.isNaN(value.getTime()));
            if (!field.required && optionalValueIsEmpty) {
                commitValidationState(key, undefined);
                return undefined;
            }

            const builtInViolation = validateBuiltIn(field, value);
            if (builtInViolation) {
                commitValidationState(key, builtInViolation);
                return builtInViolation;
            }

            if (field.customValidator) {
                const customValidator = field.customValidator as (value: T[keyof T]) => FormViolation | Promise<FormViolation> | undefined;
                const result = customValidator(value as T[keyof T]);

                if (result instanceof Promise) {
                    const validation = result.then((violation) => {
                        if (validationEpoch[key] !== epoch) {
                            return pendingValidation[key] ?? validationState[key].value;
                        }
                        if (field.source.value !== value) {
                            return api.validateField(key);
                        }
                        commitValidationState(key, violation);
                        return violation;
                    }).finally(() => {
                        if (pendingValidation[key] === validation) {
                            pendingValidation[key] = undefined;
                        }
                    });
                    pendingValidation[key] = validation;
                    return validation;
                }

                commitValidationState(key, result);
                return result;
            }

            commitValidationState(key, undefined);
            return undefined;

            function validateBuiltIn(
                currentField: StringFieldSchema | NumberFieldSchema | BooleanFieldSchema | DateFieldSchema,
                currentValue: unknown
            ): FormViolation | undefined {
                const missing =
                    currentValue === undefined ||
                    currentValue === null ||
                    (typeof currentValue === 'string' && currentValue.length === 0) ||
                    (typeof currentValue === 'number' && !Number.isFinite(currentValue)) ||
                    (typeof currentValue === 'boolean' && currentValue === false) ||
                    (currentValue instanceof Date && Number.isNaN(currentValue.getTime()));

                if (currentField.required && missing) {
                    return { type: FormViolationType.Required, message: messages.required };
                }
                if (currentValue === undefined || currentValue === null) {
                    return undefined;
                }
                if (typeof currentValue === 'string') {
                    if ('minLength' in currentField && currentField.minLength !== undefined && currentValue.length < currentField.minLength) {
                        return { type: FormViolationType.MinLength, message: messages.minLength };
                    }
                    if ('maxLength' in currentField && currentField.maxLength !== undefined && currentValue.length > currentField.maxLength) {
                        return { type: FormViolationType.MaxLength, message: messages.maxLength };
                    }
                    if ('match' in currentField && currentField.match !== undefined && !currentField.match.test(currentValue)) {
                        return { type: FormViolationType.Match, message: messages.match };
                    }
                    if ('oneOf' in currentField && currentField.oneOf !== undefined && !currentField.oneOf.includes(currentValue)) {
                        return { type: FormViolationType.OneOf, message: messages.oneOf };
                    }
                } else if (typeof currentValue === 'number') {
                    if (!Number.isFinite(currentValue)) {
                        return { type: FormViolationType.Integer, message: messages.integer };
                    }
                    if ('min' in currentField && typeof currentField.min === 'number' && currentValue < currentField.min) {
                        return { type: FormViolationType.Min, message: messages.min };
                    }
                    if ('max' in currentField && typeof currentField.max === 'number' && currentValue > currentField.max) {
                        return { type: FormViolationType.Max, message: messages.max };
                    }
                    if ('integer' in currentField && currentField.integer && !Number.isInteger(currentValue)) {
                        return { type: FormViolationType.Integer, message: messages.integer };
                    }
                } else if (currentValue instanceof Date) {
                    if ('min' in currentField && currentField.min instanceof Date && currentValue < currentField.min) {
                        return { type: FormViolationType.Min, message: messages.min };
                    }
                    if ('max' in currentField && currentField.max instanceof Date && currentValue > currentField.max) {
                        return { type: FormViolationType.Max, message: messages.max };
                    }
                }
                return undefined;
            }
        }
    };

    for (const key in schema.fields) {
        validationEpoch[key] = 0;
        validationState[key] = new DataSource<FormViolation | undefined>(undefined);
        api.violation[key] = validationState[key].transform(dsUnique());
        api.isValid[key] = validationState[key].transform(
            dsMap((v) => v === undefined),
            dsUnique()
        );
        api.isInvalid[key] = validationState[key].transform(
            dsUnique(),
            dsMap((v) => v !== undefined)
        );
    }

    return api;

    function commitValidationState(key: keyof T, violation: FormViolation | undefined): void {
        validationState[key].update(violation);
        if (violation === undefined) {
            api.fieldsWithViolations.delete(key);
        } else {
            api.fieldsWithViolations.add(key);
        }
    }
}
