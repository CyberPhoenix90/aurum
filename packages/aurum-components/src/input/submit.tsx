import { Aurum, AurumComponentAPI, Renderable, writeTo } from '@aurum/html';
import { Button, ButtonComponentProps } from './button.js';
import { FormType } from '../form/form.js';

export interface SubmitButtonProps<T extends object = Record<string, unknown>, O = unknown> extends ButtonComponentProps {
    form: FormType<T, O>;
}

export function Submit<T extends object = Record<string, unknown>, O = unknown>(
    props: SubmitButtonProps<T, O>,
    children: Renderable[],
    api: AurumComponentAPI
): Renderable {
    const { disabled, form, onClick, ...rest } = props;

    return (
        <Button
            onClick={(e) => {
                form.submit();
                if (typeof onClick === 'function') {
                    onClick(e);
                } else if (onClick) {
                    writeTo(onClick, e);
                }
            }}
            disabled={props.disabled ?? form.submitting}
            {...rest}
        >
            {children}
        </Button>
    );
}
