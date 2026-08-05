import { AurumComponentAPI, CancellationToken, DataSource } from 'aurumjs';
import { createForm, FormSchema } from '../src/form/form.js';
import { CheckboxField } from '../src/input/checkbox_field.js';
import { DropDownMenu } from '../src/input/drop_down_menu.js';
import { ListSelect } from '../src/input/list_select.js';
import { NumberField } from '../src/input/number_field.js';
import { TextField } from '../src/input/text_field.js';
import { Toggle, ToggleState } from '../src/input/toggle_component.js';

interface FormModel {
    title: string;
    count: number;
    accepted: boolean;
    state: ToggleState;
    choice: 'first' | 'second';
}

const schema: FormSchema<FormModel> = {
    fields: {
        title: { source: new DataSource('') },
        count: { source: new DataSource(0) },
        accepted: { source: new DataSource(false) },
        state: { source: new DataSource<ToggleState>('off'), oneOf: ['on', 'off'] },
        choice: { source: new DataSource<FormModel['choice']>('first'), oneOf: ['first', 'second'] }
    }
};
const form = createForm<FormModel>(schema, async () => undefined);
const api = { cancellationToken: new CancellationToken() } as AurumComponentAPI;

TextField({ form, name: 'title' }, [], api);
TextField({ form, name: new DataSource<'title'>('title') }, [], api);
NumberField({ form, name: 'count' }, [], api);
CheckboxField({ form, name: 'accepted' });
Toggle({ form, name: 'state' }, [], api);
ListSelect<FormModel['choice'], FormModel>({ form, name: 'choice' }, [], api);
DropDownMenu<FormModel['choice'], FormModel>({ form, name: 'choice' }, [], api);

// @ts-expect-error Text controls may only bind to unrestricted string fields.
TextField({ form, name: 'count' }, [], api);
// @ts-expect-error A literal union cannot safely receive arbitrary text input.
TextField({ form, name: 'choice' }, [], api);
// @ts-expect-error Number controls may only bind to number fields.
NumberField({ form, name: 'title' }, [], api);
// @ts-expect-error Checkbox controls may only bind to boolean fields.
CheckboxField({ form, name: 'title' });
// @ts-expect-error Toggle controls require the exact ToggleState field type.
Toggle({ form, name: 'title' }, [], api);
// @ts-expect-error Select value and form field types must agree.
ListSelect<number, FormModel>({ form, name: 'choice' }, [], api);

const invalidSchema: FormSchema<Pick<FormModel, 'title'>> = {
    fields: {
        // @ts-expect-error The field source must produce the model property's value type.
        title: { source: new DataSource(1) }
    }
};
void invalidSchema;
