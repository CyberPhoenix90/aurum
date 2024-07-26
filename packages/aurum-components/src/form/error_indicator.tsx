import { Aurum } from 'aurumjs';
import { FormType } from './form.js';

export interface ErrorIndicatorProps<T extends Object = Object> {
    form: FormType<T, any>;
}

export function ErrorIndicator<T extends Object = Object>(props: ErrorIndicatorProps<T>) {
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
