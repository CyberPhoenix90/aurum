import { Aurum } from 'aurumjs';
import { FormType } from './form.js';

export interface ErrorIndicatorProps<T extends object = Record<string, unknown>, O = unknown> {
    form: FormType<T, O>;
}

export function ErrorIndicator<T extends object = Record<string, unknown>, O = unknown>(props: ErrorIndicatorProps<T, O>) {
    return (
        <div
            style={{
                color: 'red',
                fontSize: '12px'
            }}
        >
            <ul>
                {props.form.fieldsWithViolations.map((field) => (
                    <li>
                        [{field}] {props.form.violation[field].value.message}
                    </li>
                ))}
            </ul>
            {props.form.submitError}
        </div>
    );
}
