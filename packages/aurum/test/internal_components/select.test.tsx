import { assert } from 'chai';
import * as sinon from 'sinon';
import { Aurum, DataSource } from '../../src/aurumjs.js';

describe('Select', () => {
    let attachToken;
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
});
