import {
    forwardRef,
    type ChangeEvent,
    type ComponentPropsWithRef,
    type DragEvent,
    type HTMLAttributes
} from '../src/index.js';

const Div = forwardRef<HTMLDivElement, ComponentPropsWithRef<'div'>>((props, ref) => <div {...props} ref={ref} />);
const attributes: HTMLAttributes<HTMLDivElement> = {
    onClick: (event) => event.currentTarget.focus()
};

export const typecheck = (
    <Div
        ref={(node) => node?.focus()}
        onDrag={(event: DragEvent<HTMLDivElement>) => event.dataTransfer.setData('text/plain', 'value')}
        onChange={(event: ChangeEvent<HTMLDivElement>) => event.currentTarget.focus()}
        {...attributes}
    />
);
