import { DataSource } from 'aurumjs';
import { assert, describe, it } from 'vitest';
import { createForm, FormViolation, FormViolationType } from '../src/form/form.js';

describe('form validation', () => {
    it('validates required values according to their type', async () => {
        const name = new DataSource('Aurum');
        const count = new DataSource(1);
        const accepted = new DataSource(true);
        const date = new DataSource(new Date('2025-01-01'));
        const form = createForm<{ name: string; count: number; accepted: boolean; date: Date }>(
            {
                fields: {
                    name: { source: name, required: true },
                    count: { source: count, required: true },
                    accepted: { source: accepted, required: true },
                    date: { source: date, required: true }
                }
            },
            async (): Promise<void> => undefined
        );

        assert.isTrue(await form.isFullyValid());
        assert.isTrue(form.isValid.name.value);

        name.update('');
        count.update(Number.NaN);
        accepted.update(false);
        date.update(new Date(Number.NaN));
        const result = await form.validateAll();

        assert.equal(result.name?.type, FormViolationType.Required);
        assert.equal(result.count?.type, FormViolationType.Required);
        assert.equal(result.accepted?.type, FormViolationType.Required);
        assert.equal(result.date?.type, FormViolationType.Required);
        assert.sameMembers(Array.from(form.fieldsWithViolations), ['name', 'count', 'accepted', 'date']);
    });

    it('runs built-in validation before custom validation and keeps both active', async () => {
        const value = new DataSource('a');
        let customCalls = 0;
        const customViolation: FormViolation = { type: FormViolationType.Custom, message: 'custom' };
        const form = createForm<{ value: string }>(
            {
                fields: {
                    value: {
                        source: value,
                        minLength: 2,
                        customValidator: () => {
                            customCalls++;
                            return customViolation;
                        }
                    }
                }
            },
            async (): Promise<void> => undefined
        );

        assert.equal((await form.validateField('value'))?.type, FormViolationType.MinLength);
        assert.equal(customCalls, 0);

        value.update('ab');
        assert.strictEqual(await form.validateField('value'), customViolation);
        assert.equal(customCalls, 1);
    });

    it('treats absent optional values as valid and validates oneOf when present', async () => {
        const value = new DataSource<string>(undefined);
        const form = createForm<{ value: string }>(
            { fields: { value: { source: value, minLength: 2, oneOf: ['ok'] } } },
            async (): Promise<void> => undefined
        );

        assert.isUndefined(await form.validateField('value'));
        value.update('no');
        assert.equal((await form.validateField('value'))?.type, FormViolationType.OneOf);
        value.update('ok');
        assert.isUndefined(await form.validateField('value'));
        assert.isTrue(form.isValid.value.value);
        assert.isFalse(form.isInvalid.value.value);
    });

    it('does not let stale asynchronous validation overwrite a newer result', async () => {
        const value = new DataSource('first');
        const pending = new Map<string, (violation?: FormViolation) => void>();
        const form = createForm<{ value: string }>(
            {
                fields: {
                    value: {
                        source: value,
                        customValidator: (current: string) => new Promise<FormViolation | undefined>((resolve) => pending.set(current, resolve))
                    }
                }
            },
            async (): Promise<void> => undefined
        );

        const first = form.validateField('value') as Promise<FormViolation | undefined>;
        value.update('second');
        const second = form.validateField('value') as Promise<FormViolation | undefined>;
        pending.get('second')?.(undefined);
        await second;
        pending.get('first')?.({ type: FormViolationType.Custom, message: 'stale' });
        await first;

        assert.isUndefined(form.violation.value.value);
        assert.isTrue(form.isValid.value.value);
    });

    it('coalesces concurrent submissions and preserves failure state until completion', async () => {
        const value = new DataSource('ready');
        let submitCalls = 0;
        let finish: (value: string) => void;
        const form = createForm<{ value: string }, string>(
            { fields: { value: { source: value, required: true } } },
            (_object, markAsFailed) => {
                submitCalls++;
                markAsFailed('server rejected');
                return new Promise<string>((resolve) => (finish = resolve));
            }
        );

        const first = form.submit();
        const second = form.submit();
        assert.strictEqual(first, second);
        await Promise.resolve();
        await Promise.resolve();
        assert.equal(submitCalls, 1);
        assert.isTrue(form.submitting.value);
        assert.equal(form.submitError.value, 'server rejected');

        finish!('done');
        assert.equal(await first, 'done');
        assert.isFalse(form.submitting.value);
    });
});
