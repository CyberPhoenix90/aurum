import { AurumComponentAPI, AurumElementModel, CancellationToken, DataSource, DuplexDataSource, Renderable } from 'aurumjs';
import { assert, describe, it } from 'vitest';
import { createForm } from '../src/form/form.js';
import { CheckboxField } from '../src/input/checkbox_field.js';
import { NumberField } from '../src/input/number_field.js';
import { TextField } from '../src/input/text_field.js';
import { Toggle, ToggleState } from '../src/input/toggle_component.js';

function componentApi(): AurumComponentAPI {
    return { cancellationToken: new CancellationToken() } as AurumComponentAPI;
}

describe('form controls', () => {
    it('passes a checkbox binding through without creating a stale mirror', () => {
        const value = new DataSource(false);
        const model = CheckboxField({ value }) as AurumElementModel<any>;
        assert.strictEqual(model.props.checked, value);
    });

    it('keeps number fields synchronized in both directions', () => {
        const value = new DuplexDataSource(1, false);
        const writes: number[] = [];
        value.listenUpstream((next) => writes.push(next));
        const model = NumberField({ value }, [], componentApi()) as AurumElementModel<any>;
        const renderedValue = model.props.value as DataSource<string>;

        value.publish(2);
        assert.equal(renderedValue.value, '2');
        assert.deepEqual(writes, []);

        renderedValue.update('3');
        assert.deepEqual(writes, [3]);
    });

    it('preserves an explicitly supplied toggle binding', () => {
        const state = new DuplexDataSource<ToggleState>('off', false);
        const writes: ToggleState[] = [];
        state.listenUpstream((next) => writes.push(next));
        const model = Toggle({ toggleState: state }, [], componentApi()) as AurumElementModel<any>;

        model.props.onClick({} as MouseEvent);
        assert.deepEqual(writes, ['on']);
    });

    it('forwards zero-valued constraints from a form schema', () => {
        const value = new DataSource(0);
        const form = createForm<{ value: number }>(
            { fields: { value: { source: value, min: 0, max: 0 } } },
            async (): Promise<void> => undefined
        );
        const rendered = NumberField({ form, name: 'value' }, [] as Renderable[], componentApi()) as AurumElementModel<any>;
        const inputWrapper = rendered as AurumElementModel<any>;
        const input = (inputWrapper.factory(inputWrapper.props, inputWrapper.children, componentApi()) as AurumElementModel<any>).children[0] as AurumElementModel<any>;

        assert.equal(input.props.min, 0);
        assert.equal(input.props.max, 0);
    });
});
