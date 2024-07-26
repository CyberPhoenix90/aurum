import { DataSource, DuplexDataSource, ReadOnlyDataSource, SetDataSource, dsMap, dsTap, dsUnique } from 'aurumjs';

export type FormSchema<T> = {
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

export type FieldSchema<T> = T extends string
    ? StringFieldSchema
    : T extends number
    ? NumberFieldSchema
    : T extends boolean
    ? BooleanFieldSchema
    : T extends Date
    ? DateFieldSchema
    : never;

export interface StringFieldSchema {
    source: DataSource<string> | DuplexDataSource<string>;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    match?: RegExp;
    oneOf?: string[];
    customValidator?: (value: string) => FormViolation | Promise<FormViolation> | undefined;
}

export interface NumberFieldSchema {
    source: DataSource<number> | DuplexDataSource<number>;
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    customValidator?: (value: number) => FormViolation | Promise<FormViolation> | undefined;
}

export interface BooleanFieldSchema {
    source: DataSource<boolean> | DuplexDataSource<boolean>;
    required?: boolean;
    customValidator?: (value: boolean) => FormViolation | Promise<FormViolation> | undefined;
}

export interface DateFieldSchema {
    source: DataSource<Date> | DuplexDataSource<Date>;
    required?: boolean;
    min?: Date;
    max?: Date;
    customValidator?: (value: Date) => FormViolation | Promise<FormViolation> | undefined;
}

export interface FormType<T, O> {
    submitting: ReadOnlyDataSource<boolean>;
    submitError: ReadOnlyDataSource<string>;
    submit();
    schema: FormSchema<T>;
    violation: {
        [key in keyof T]: ReadOnlyDataSource<FormViolation>;
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
    validateField(key: string): FormViolation | Promise<FormViolation>;
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

export function createForm<T, O = void>(schema: FormSchema<T>, onSubmit: (object: T, markAsFailed: (error: string) => void) => Promise<O>): FormType<T, O> {
    //@ts-ignore
    const validationState: { [key in keyof T]: DataSource<FormViolation> } = {};

    schema.defaultErrorMessages = Object.assign(
        {
            required: 'This field is required',
            minLength: 'Too short',
            maxLength: 'Too long',
            match: 'Value does not match the required pattern',
            oneOf: 'Value is not one of the allowed values',
            min: 'Value is too low',
            max: 'Value is too high',
            integer: 'Value is not an integer',
            custom: 'Invalid Value'
        },
        schema.defaultErrorMessages ?? {}
    );

    const api: FormType<T, O> = {
        submit: async () => {
            if ((await api.isFullyValid()) === false) {
                return undefined;
            }

            const object = api.getFormObject();

            (api.submitError as DataSource<string>).update('');
            (api.submitting as DataSource<boolean>).update(true);
            try {
                return await onSubmit(object, (error) => {
                    (api.submitError as DataSource<string>).update(error);
                    (api.submitting as DataSource<boolean>).update(false);
                });
            } catch (e) {
                (api.submitError as DataSource<string>).update(e.message);
            } finally {
                (api.submitting as DataSource<boolean>).update(false);
            }

            return undefined;
        },
        submitting: new DataSource(false),
        submitError: new DataSource(''),
        schema,
        // Proper object will be built in the next step
        isValid: {} as any,
        isInvalid: {} as any,
        violation: {} as any,
        fieldsWithViolations: new SetDataSource(),
        setValidationState(key: keyof T, violation: FormViolation | undefined): void {
            validationState[key].update(violation);
        },
        async isFullyValid(): Promise<boolean> {
            let isValid = true;
            for (const key in schema.fields) {
                if ((await api.validateField(key)) !== undefined) {
                    isValid = false;
                    // do not return early as validation can have side effects
                }
            }

            return isValid;
        },
        async validateAll(): Promise<ValidationResult<T>> {
            const result: Partial<ValidationResult<T>> = {};
            for (const key in schema.fields) {
                result[key] = await api.validateField(key);
            }

            return result as ValidationResult<T>;
        },
        getFormObject(): T {
            const result: { [key: string]: any } = {};
            for (const key in schema.fields) {
                result[key] = schema.fields[key].source.value;
            }

            return result as T;
        },
        validateField(key: string): FormViolation | Promise<FormViolation> | undefined {
            const field = schema.fields[key];
            if (field.required && (!field.source.value || Number.isNaN(field.source.value) || !Number.isFinite(field.source.value))) {
                validationState[key].update({
                    type: FormViolationType.Required
                });
                return validationState[key].value;
            }
            const value = field.source.value;
            if (field.customValidator) {
                const result = field.customValidator(value);

                if (result instanceof Promise) {
                    return result.then((r) => {
                        validationState[key].update(r);
                        return r;
                    });
                } else {
                    validationState[key].update(result);
                }

                return result;
            }

            if (value === undefined || value === null) {
                // we can't determine the type due to lack of input but if any assertion exists it's automatically invalid
                if ('minLength' in field) {
                    validationState[key as keyof T].update({ type: FormViolationType.MinLength, message: schema.defaultErrorMessages.minLength });
                    return validationState[key].value;
                }

                if ('maxLength' in field) {
                    validationState[key as keyof T].update({ type: FormViolationType.MaxLength, message: schema.defaultErrorMessages.maxLength });
                    return validationState[key].value;
                }

                if ('match' in field) {
                    validationState[key as keyof T].update({ type: FormViolationType.Match, message: schema.defaultErrorMessages.match });
                    return validationState[key].value;
                }

                if ('min' in field) {
                    validationState[key as keyof T].update({ type: FormViolationType.Min, message: schema.defaultErrorMessages.min });
                    return validationState[key].value;
                }

                if ('max' in field) {
                    validationState[key as keyof T].update({ type: FormViolationType.Max, message: schema.defaultErrorMessages.max });
                    return validationState[key].value;
                }

                if ('oneof' in field) {
                    validationState[key as keyof T].update({ type: FormViolationType.OneOf, message: schema.defaultErrorMessages.oneOf });
                    return validationState[key].value;
                }

                if ('integer' in field) {
                    validationState[key as keyof T].update({ type: FormViolationType.Integer, message: schema.defaultErrorMessages.integer });
                    return validationState[key].value;
                }
            }

            if (typeof value === 'string') {
                if ('minLength' in field && value.length < field.minLength) {
                    validationState[key as keyof T].update({ type: FormViolationType.MinLength, message: schema.defaultErrorMessages.minLength });
                    return validationState[key].value;
                }

                if ('maxLength' in field && value.length > field.maxLength) {
                    validationState[key as keyof T].update({ type: FormViolationType.MaxLength, message: schema.defaultErrorMessages.maxLength });
                    return validationState[key].value;
                }

                if ('match' in field && !field.match.test(value)) {
                    validationState[key as keyof T].update({ type: FormViolationType.Match, message: schema.defaultErrorMessages.match });
                    return validationState[key].value;
                }

                if ('oneOf' in field && !field.oneOf.includes(value)) {
                    validationState[key as keyof T].update({ type: FormViolationType.OneOf, message: schema.defaultErrorMessages.oneOf });
                    return validationState[key].value;
                }
            } else if (typeof value === 'number') {
                if ('min' in field && (value as number) < (field.min as number)) {
                    validationState[key as keyof T].update({ type: FormViolationType.Min, message: schema.defaultErrorMessages.min });
                    return validationState[key].value;
                }

                if ('max' in field && (value as number) > (field.max as number)) {
                    validationState[key as keyof T].update({ type: FormViolationType.Max, message: schema.defaultErrorMessages.max });
                    return validationState[key].value;
                }

                if ('integer' in field && field.integer && !Number.isInteger(value)) {
                    validationState[key as keyof T].update({ type: FormViolationType.Integer, message: schema.defaultErrorMessages.integer });
                    return validationState[key].value;
                }
            } else if (typeof value === 'boolean') {
                // nothing to validate
            } else if (value instanceof Date) {
                if ('min' in field && value < field.min) {
                    validationState[key as keyof T].update({ type: FormViolationType.Min, message: schema.defaultErrorMessages.min });
                    return validationState[key].value;
                }

                if ('max' in field && value > field.max) {
                    validationState[key as keyof T].update({ type: FormViolationType.Max, message: schema.defaultErrorMessages.max });
                    return validationState[key].value;
                }
            }

            validationState[key].update(undefined);
            return undefined;
        }
    };

    for (const key in schema.fields) {
        validationState[key] = new DataSource();
        api.violation[key] = validationState[key].transform(dsUnique());
        api.isValid[key] = validationState[key].transform(
            dsMap((v) => v === undefined),
            dsUnique(),
            dsTap((v) => (v ? api.fieldsWithViolations.delete(key) : api.fieldsWithViolations.add(key))),
            dsMap((v) => v === undefined)
        );
        api.isInvalid[key] = validationState[key].transform(
            dsUnique(),
            dsMap((v) => v !== undefined)
        );
    }

    return api;
}
