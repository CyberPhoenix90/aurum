import { ColorPicker, JSONRenderer, NumberField, TextField } from 'aurum-components';
import {
    ArraySchemaFieldTypeDescriptor,
    EnumSchemaFieldTypeDescriptor,
    MultipleChoiceSchemaFieldTypeDescriptor,
    NumberSchemaFieldTypeDescriptor,
    ObjectSchema,
    ObjectSchemaFieldTypeDescriptor,
    SchemaField,
    SchemaFieldType,
    SchemaFieldTypeDescriptor,
    TextSchemaFieldTypeDescriptor
} from 'aurum-game-editor-api';
import { Aurum, DataSource, dsMap } from 'aurumjs';
import { SceneEntityDataReactive } from '../../editor_components/scene/scene_edit_model';

export function sceneEntityToEntityEditor(entity: SceneEntityDataReactive, schema: ObjectSchema) {
    const object: any = {
        name: entity.name,
        ...entity.properties
    };

    if ('innerText' in entity) {
        object.text = entity.innerText;
    }
    for (const key in schema) {
        if (key === 'onAttach' || key === 'onDetach') {
            continue;
        }
        if (!(key in object)) {
            object[key] = new DataSource(undefined);
            entity.properties[key] = object[key];
        }
    }

    return {
        object,
        schema
    };
}

export function EntityEditor(props: {
    editTarget: DataSource<{
        schema: ObjectSchema;
        object: any;
    }>;
}) {
    const { editTarget } = props;

    return (
        <JSONRenderer
            allowEdit={{
                isEditable: (key) => key in editTarget.value.schema,
                inputComponent: (key: string, value: any, callbacks) => {
                    const fieldSchema: SchemaField = editTarget.value.schema[key];
                    const { onEditDone, onEditCancelled } = callbacks;
                    const applyValue = (valueToApply: any) => {
                        onEditDone(castValue(fieldSchema, valueToApply));
                    };
                    let lock = false;
                    const commonProps: any = {
                        onAttach: (i) => {
                            i.focus();
                        },
                        style: 'width:100%',
                        onKeyDown: (e) => {
                            lock = true;
                            switch (e.key) {
                                case 'Enter':
                                    applyValue((e.target as HTMLInputElement).value);
                                    break;
                                case 'Escape':
                                    onEditCancelled();
                                    break;
                            }
                            lock = false;
                        },
                        onBlur: (e) => {
                            if (!lock) {
                                applyValue((e.target as HTMLInputElement).value);
                            }
                        },
                        value
                    };

                    switch (resolveInputType(fieldSchema.allowedTypes)) {
                        case SchemaFieldType.BOOL:
                            return (
                                <TextField
                                    checked={value}
                                    type="checkbox"
                                    {...commonProps}
                                    onKeyDown={(e) => {
                                        lock = true;
                                        switch (e.key) {
                                            case 'Enter':
                                                applyValue((e.target as HTMLInputElement).checked);
                                                break;
                                            case 'Escape':
                                                onEditCancelled();
                                                break;
                                        }
                                        lock = false;
                                    }}
                                    onBlur={(e) => {
                                        if (!lock) {
                                            applyValue((e.target as HTMLInputElement).checked);
                                        }
                                    }}
                                ></TextField>
                            );
                        case SchemaFieldType.COLOR:
                            return <ColorPicker {...commonProps}></ColorPicker>;
                        case SchemaFieldType.ASSETS_FILE_PATH:
                        case SchemaFieldType.IMAGE:
                        case SchemaFieldType.SOUND:
                            return <TextField {...commonProps}></TextField>;
                        case SchemaFieldType.NUMBER:
                        case SchemaFieldType.PERCENTAGE:
                            return <NumberField {...commonProps}></NumberField>;
                        default:
                            return <TextField {...commonProps}></TextField>;
                    }
                }
            }}
            maxStringSize={100}
        >
            {editTarget.transform(dsMap((et) => et.object))}
        </JSONRenderer>
    );
}

function resolveInputType(allowedTypes: SchemaFieldTypeDescriptor<any>[]): SchemaFieldType {
    if (allowedTypes.some((e) => e.type === SchemaFieldType.BOOL)) {
        return SchemaFieldType.BOOL;
    }
    if (allowedTypes.some((e) => e.type === SchemaFieldType.COLOR)) {
        return SchemaFieldType.COLOR;
    }
    if (allowedTypes.some((e) => e.type === SchemaFieldType.ASSETS_FILE_PATH)) {
        return SchemaFieldType.ASSETS_FILE_PATH;
    }
    if (allowedTypes.some((e) => e.type === SchemaFieldType.IMAGE)) {
        return SchemaFieldType.IMAGE;
    }
    if (allowedTypes.some((e) => e.type === SchemaFieldType.SOUND)) {
        return SchemaFieldType.SOUND;
    }
    if (allowedTypes.every((e) => e.type === SchemaFieldType.NUMBER)) {
        return SchemaFieldType.NUMBER;
    }

    return SchemaFieldType.TEXT;
}

function validate(
    fieldType:
        | MultipleChoiceSchemaFieldTypeDescriptor
        | EnumSchemaFieldTypeDescriptor
        | ObjectSchemaFieldTypeDescriptor
        | ArraySchemaFieldTypeDescriptor
        | NumberSchemaFieldTypeDescriptor
        | TextSchemaFieldTypeDescriptor
        | SchemaFieldTypeDescriptor<any>,
    value: string
): boolean {
    if (fieldType.validate) {
        if (!fieldType.validate(value)) {
            return false;
        }
    }

    switch (fieldType.type) {
        case SchemaFieldType.TEXT:
            const textField = fieldType as TextSchemaFieldTypeDescriptor;
            if (textField.maxLength !== undefined && value.length > textField.maxLength) {
                return false;
            }
            if (textField.minLength !== undefined && value.length < textField.minLength) {
                return false;
            }
            if (textField.allowedValues !== undefined && !textField.allowedValues.includes(value)) {
                return false;
            }
            break;
        case SchemaFieldType.NUMBER:
            const numberField = fieldType as NumberSchemaFieldTypeDescriptor;
            let parsedValue;
            if (numberField.integerOnly) {
                parsedValue = parseInt(value);
            } else {
                parsedValue = parseFloat(value);
            }

            if (isNaN(parsedValue)) {
                return false;
            }

            if (numberField.maxValue !== undefined && parsedValue > numberField.maxValue) {
                return false;
            }
            if (numberField.minValue !== undefined && parsedValue < numberField.minValue) {
                return false;
            }
            if (numberField.allowedValues !== undefined && !numberField.allowedValues.includes(parsedValue)) {
                return false;
            }
            break;
    }

    return true;
}

function castValue(fieldSchema: SchemaField, value: any): any {
    for (const allowedType of fieldSchema.allowedTypes) {
        if (value === '' && fieldSchema.optional) {
            return undefined;
        }

        if (validate(allowedType, value)) {
            switch (allowedType.type) {
                case SchemaFieldType.TEXT:
                case SchemaFieldType.COLOR:
                case SchemaFieldType.ASSETS_FILE_PATH:
                case SchemaFieldType.IMAGE:
                case SchemaFieldType.SOUND:
                    return value;
                case SchemaFieldType.NUMBER:
                    if ((allowedType as NumberSchemaFieldTypeDescriptor).integerOnly) {
                        return parseInt(value);
                    } else {
                        return parseFloat(value);
                    }
                case SchemaFieldType.PERCENTAGE:
                    return parseFloat(value);
                case SchemaFieldType.BOOL:
                    return Boolean(value);
                default:
                    throw new Error(`Unhandled case`);
            }
        }
    }
}
