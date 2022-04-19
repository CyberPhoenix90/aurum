import { assert } from 'chai';
import { Aurum, AurumRouter, Route } from '../../src/aurumjs';

describe('Router', () => {
    let attachToken;
    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('Should not break with undefined routes', () => {
        attachToken = Aurum.attach(
            <div>
                <AurumRouter>
                    <Route href={'/'} />
                    {undefined}
                </AurumRouter>
            </div>,
            document.getElementById('target')
        );
        assert(Array.from(document.getElementById('target').firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 0);
    });
});
