import { Aurum } from 'aurumjs';
import { FormType } from './form.js';

export interface ErrorIndicatorProps {
    form: FormType<Object, any>;
}

export function ErrorIndicator(props: ErrorIndicatorProps) {
    return (
        <div
            style={{
                color: 'red',
                fontSize: '12px'
            }}
        >
            <ol>
                {props.form.fieldsWithViolations.map((field) => (
                    <li>
                        {props.form.violation[field].value
                    </li>
                ))}
            </ol>
            {props.form.submitError}
        </div>
    );
}
