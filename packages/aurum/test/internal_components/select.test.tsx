import * as sinon from 'sinon';
import { afterEach, assert, beforeEach, describe, it } from 'vitest';
import { Aurum, CancellationToken, DataSource, DuplexDataSource } from '../../src/aurumjs.js';

describe('Select', () => {
    let attachToken: CancellationToken | undefined;
    let clock: sinon.SinonFakeTimers;
    beforeEach(() => {
        clock = sinon.useFakeTimers();
    });
    afterEach(() => {
        clock.uninstall();
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('Should apply initial selection', () => {
        attachToken = Aurum.attach(
            <select selectedIndex={1}>
                <option>1</option>
                <option>2</option>
            </select>,
            document.getElementById('target')
        );
        assert((document.getElementById('target').firstChild as HTMLSelectElement).selectedIndex === 1);
    });

    it('Should apply selection source', () => {
        const source = new DataSource(1);
        attachToken = Aurum.attach(
            <select selectedIndex={source}>
                <option>1</option>
                <option>2</option>
                <option>3</option>
            </select>,
            document.getElementById('target')
        );
        assert((document.getElementById('target').firstChild as HTMLSelectElement).selectedIndex === 1);
        source.update(2);
        clock.tick(100);
        assert((document.getElementById('target').firstChild as HTMLSelectElement).selectedIndex === 2);
    });

    it('routes DOM changes upstream for duplex bindings and publications to the DOM', () => {
        const source = new DuplexDataSource(1, false);
        const writes: number[] = [];
        const publications: number[] = [];
        source.listenUpstream((value) => writes.push(value));
        source.listen((value) => publications.push(value));
        attachToken = Aurum.attach(
            <select selectedIndex={source}>
                <option>1</option>
                <option>2</option>
                <option>3</option>
            </select>,
            document.getElementById('target')
        );

        const select = document.getElementById('target').firstChild as HTMLSelectElement;
        select.selectedIndex = 2;
        select.dispatchEvent(new Event('change'));
        assert.deepEqual(writes, [2]);
        assert.deepEqual(publications, []);

        source.publish(0);
        assert.equal(select.selectedIndex, 0);
        assert.deepEqual(publications, [0]);
    });
});
