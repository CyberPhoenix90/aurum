import { Aurum, AurumComponentAPI, DataSource, DuplexDataSource, Renderable } from 'aurumjs';
import { Button, ButtonComponentProps } from './button.js';
import { FormType } from '../form/form.js';

export interface SubmitButtonProps extends ButtonComponentProps {
    form: FormType<any, any>;
}

export function Submit(props: SubmitButtonProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const { disabled, form, onClick, ...rest } = props;

    return (
        <Button
            onClick={(e) => {
                form.submit();
                if (typeof onClick === 'function') {
                    onClick(e);
                } else if (onClick instanceof DataSource) {
                    onClick.update(e);
                } else if (onClick instanceof DuplexDataSource) {
                    onClick.updateDownstream(e);
                }
            }}
            disabled={props.disabled ?? form.submitting}
            {...rest}
        >
            {children}
        </Button>
    );
}
