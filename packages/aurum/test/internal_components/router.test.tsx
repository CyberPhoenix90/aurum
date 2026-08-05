import { afterEach, assert, describe, it } from 'vitest';
import { Aurum, AurumRouter, CancellationToken, DataSource, Route } from '../../src/aurumjs.js';

describe('Router', () => {
    let attachToken: CancellationToken | undefined;
    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('Should not break with undefined routes', () => {
        attachToken = Aurum.attach(
            <div>
                <AurumRouter urlProvider={new DataSource('/')}>
                    <Route href={'/'} />
                </AurumRouter>
            </div>,
            document.getElementById('target')
        );
        assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 0);
    });
});
