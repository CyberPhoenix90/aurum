import { assert, describe, it } from 'vitest';
import { Aurum, AurumComponentAPI, DataSource, Renderable, aurumToString } from '../../src/index.js';

describe('aurumToString extended inputs', () => {
    it('serializes promises, primitive arrays, and empty renderables', async () => {
        const bigint = (globalThis as unknown as { BigInt(value: number): unknown }).BigInt(12);
        const content = [undefined, null, false, true, 0, bigint, Promise.resolve('ready')] as unknown as Renderable;

        assert.equal(await aurumToString(content), '012ready');
        assert.equal(await aurumToString(new DataSource('reactive')), 'reactive');
    });

    it('renders components and disposes their render session afterward', async () => {
        let disposed = false;
        function ServerComponent(_: object, __: Renderable[], api: AurumComponentAPI): Renderable {
            api.cancellationToken.addCancellable(() => {
                disposed = true;
            });
            return <strong>server</strong>;
        }

        assert.equal(await aurumToString(<ServerComponent />), '<strong>server</strong>');
        assert.isTrue(disposed);
    });

    it('applies tag and attribute filtering during serialization', async () => {
        const content = (
            <main id="page" title="title">
                <span>visible</span>
                <script>hidden</script>
            </main>
        );

        assert.equal(
            await aurumToString(content, { tagBlacklist: ['script'], attributeWhitelist: ['id'] }),
            '<main id="page"><span>visible</span></main>'
        );
        assert.equal(await aurumToString(content, { tagWhitelist: ['main'] }), '<main id="page" title="title"></main>');
        assert.equal(
            await aurumToString(<div id="kept" title="removed" />, { attributeBlacklist: ['title'] }),
            '<div id="kept"></div>'
        );
    });

    it('resolves data-source, array, and map class representations', async () => {
        const classSource = new DataSource(['first', '', 'second']);
        const enabled = new DataSource(true);

        assert.equal(await aurumToString(<div class={classSource} />), '<div class="first second"></div>');
        assert.equal(
            await aurumToString(<div class={{ fixed: true, omitted: false, reactive: enabled }} />),
            '<div class="fixed reactive"></div>'
        );
        assert.equal(await aurumToString(<div class={42 as never} />), '<div class="42"></div>');
    });

    it('skips nullish properties without serializing placeholder text', async () => {
        const model = Aurum.factory('div', { id: undefined, title: null });

        assert.equal(await aurumToString(model), '<div></div>');
    });
});
