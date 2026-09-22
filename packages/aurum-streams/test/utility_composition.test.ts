import { assert, describe, it, vi } from 'vitest';
import {
    ArrayDataSource,
    CancellationToken,
    Channel,
    DataSource,
    MapDataSource,
    aurumClassName,
    camelCaseToKebabCase,
    combineAttribute,
    combineClass,
    combineStyle,
    css,
    getAurumStyleText,
    getValueOf,
    isAurumStyleClass,
    keyframes,
    publishTo
} from '../src/index.js';

describe('class, attribute, and style composition utilities', () => {
    it('maps static and reactive class records', () => {
        const active = new DataSource(false);
        const token = new CancellationToken();
        const result = aurumClassName({ fixed: true, hidden: false, active }, token) as Array<string | DataSource<string>>;
        const dynamic = result[1] as DataSource<string>;

        assert.equal(result[0], 'fixed');
        assert.equal(dynamic.value, '');
        active.update(true);
        assert.equal(dynamic.value, 'active');
        token.cancel();
        active.update(false);
        assert.equal(dynamic.value, 'active');
    });

    it('maps observable class maps through additions, updates, and deletions', () => {
        const classes = new MapDataSource(new Map([['ready', true], ['hidden', false]]));
        const token = new CancellationToken();
        const result = aurumClassName(classes, token) as ArrayDataSource<string>;
        assert.deepEqual(result.toArray(), ['ready']);

        classes.set('hidden', true);
        classes.set('ready', false);
        classes.set('new', true);
        classes.delete('hidden');
        assert.deepEqual(result.toArray(), ['new']);

        token.cancel();
        classes.set('late', true);
        assert.deepEqual(result.toArray(), ['new']);
    });

    it('combines nested fixed classes without allocating a source', () => {
        const token = new CancellationToken();
        assert.equal(combineClass(token, 'one', ['two', 'three'], { enabled: true, disabled: false }), 'one two three enabled');
        assert.equal(combineClass(token, 'single'), 'single');
    });

    it('combines class sources, arrays, maps, and reactive record entries', () => {
        const token = new CancellationToken();
        const scalar = new DataSource<string | undefined>('dynamic');
        const list = new DataSource(['a', 'b']);
        const enabled = new DataSource(false);
        const map = new MapDataSource(new Map([['mapped', true], ['off', false]]));
        const result = combineClass(token, 'fixed', scalar, list, map, { enabled }) as DataSource<string>;

        assert.deepEqual(result.value.split(/\s+/), ['fixed', 'dynamic', 'a', 'b', 'mapped']);
        scalar.update('changed');
        list.update(['c']);
        enabled.update(true);
        map.set('mapped', false);
        map.set('new', true);
        assert.deepEqual(result.value.split(/\s+/), ['fixed', 'changed', 'c', 'enabled', 'new']);

        token.cancel();
        scalar.update('ignored');
        assert.deepEqual(result.value.split(/\s+/), ['fixed', 'changed', 'c', 'enabled', 'new']);
    });

    it('combines fixed and reactive attributes and detaches on cancellation', () => {
        const token = new CancellationToken();
        assert.equal(combineAttribute(token, 'label', true), 'label true');
        const first = new DataSource<string | undefined>('one');
        const second = new DataSource<string | undefined>('two');
        const result = combineAttribute(token, first, second, 'fixed') as DataSource<string>;

        assert.equal(result.value, 'one two fixed');
        second.update('changed');
        assert.equal(result.value, 'one changed fixed');
        token.cancel();
        first.update('ignored');
        assert.equal(result.value, 'one changed fixed');
    });

    it('combines fixed, object, source, and map styles reactively', () => {
        const token = new CancellationToken();
        const color = new DataSource('color:red;');
        const width = new DataSource<number>(10);
        const map = new MapDataSource<any, string | number>(new Map([['marginTop', 2], ['opacity', 0]]));
        const result = combineStyle(token, 'display:block', { backgroundColor: 'white', width }, color, map) as DataSource<string>;

        assert.equal(result.value, 'display:block;background-color:white;width:10;color:red;margin-top:2;');
        width.update(20);
        color.update('color:blue;');
        map.set('opacity', 1);
        assert.equal(result.value, 'display:block;background-color:white;width:20;color:blue;margin-top:2;opacity:1;');

        token.cancel();
        width.update(30);
        assert.equal(result.value, 'display:block;background-color:white;width:20;color:blue;margin-top:2;opacity:1;');
    });

    it('normalizes camel-case and acronym style properties', () => {
        assert.equal(camelCaseToKebabCase('backgroundColor'), 'background-color');
        assert.equal(camelCaseToKebabCase('WebkitLineClamp'), '-webkit-line-clamp');
        assert.equal(camelCaseToKebabCase('x'), 'x');
        assert.equal(camelCaseToKebabCase('backgroundColor'), 'background-color');
    });
});

describe('native styling utilities', () => {
    it('creates stable style identities and omits nullish literal interpolations', () => {
        const first = css`color:red; width:${10}px;${false}${null}${undefined}`;
        const second = css`color:red; width:${10}px;${false}${null}${undefined}`;
        const different = css`color:blue;`;

        assert.strictEqual(first, second);
        assert.notEqual(first.className, different.className);
        assert.match(first.className, /^aurum-/);
        assert.equal(first.cssText, 'color:red; width:10px;');
        assert.equal(first.toString(), first.className);
        assert.isTrue(isAurumStyleClass(first));
        assert.isFalse(isAurumStyleClass({ className: first.className }));
    });

    it('uses source identity for reactive CSS variables and serializes values safely for SSR', () => {
        const source = new DataSource<string | number | null | undefined>('red;{}<\\');
        const sameSource = css`color:${source};`;
        const cached = css`color:${source};`;
        const otherSource = css`color:${new DataSource('red;{}<\\')};`;

        assert.strictEqual(sameSource, cached);
        assert.notEqual(sameSource.className, otherSource.className);
        assert.include(sameSource.cssText, `var(--${sameSource.className}-0)`);
        const serialized = getAurumStyleText();
        assert.include(serialized, `.${sameSource.className}{--${sameSource.className}-0:red\\3B \\7B \\7D \\3C \\5C ;}`);
    });

    it('attaches style classes to a cancellation lifetime in non-DOM environments', () => {
        const source = new DataSource<string | number | null | undefined>('red');
        const style = css`color:${source};`;
        const token = new CancellationToken();
        assert.equal(style.attach(token), style.className);
        assert.isTrue(token.hasCancellables());
        source.update(null);
        token.cancel();
        assert.isTrue(token.isCancelled);
    });

    it('registers stable interpolated keyframe definitions', () => {
        const first = keyframes`from{opacity:${0}}to{opacity:${1}}`;
        const second = keyframes`from{opacity:${0}}to{opacity:${1}}`;
        assert.equal(first, second);
        assert.match(first, /^aurum-keyframes-/);
        assert.include(getAurumStyleText(), `@keyframes ${first}{from{opacity:0}to{opacity:1}}`);
    });

    it('attaches style classes when they participate in class composition', () => {
        const token = new CancellationToken();
        const style = css`display:grid;`;
        const result = combineClass(token, 'base', style);
        assert.equal(result, `base ${style.className}`);
        assert.isTrue(token.hasCancellables());
        token.cancel();
    });
});

describe('common source utilities', () => {
    it('extracts scalar, array, and channel values while preserving primitives', () => {
        const scalar = new DataSource(1);
        const array = new ArrayDataSource([1, 2]);
        const channel = Channel.fromFunction((value: number) => value * 2);
        channel.update(3);

        assert.equal(getValueOf(scalar), 1);
        assert.deepEqual(getValueOf(array), [1, 2]);
        assert.equal(getValueOf(channel), 6);
        assert.equal(getValueOf('plain'), 'plain');
    });

    it('publishes through the common publisher helper', () => {
        const target = { publish: vi.fn() };
        publishTo(target, 3);
        assert.deepEqual(target.publish.mock.calls, [[3]]);
    });
});
