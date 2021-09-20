import { assert } from 'chai';
import * as sinon from 'sinon';
import { CancellationToken, Renderable, Suspense, Aurum } from '../../src/aurumjs';
import { attachToTestRoot, getTestRoot, sleep } from '../test_utils';

export function generateSuspenseTests(renderSuspense: (fallback?: Renderable, children?: any) => Renderable) {
    let attachToken: CancellationToken;

    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('Should not add anything to the DOM', () => {
        attachToken = attachToTestRoot(renderSuspense());
        assert(Array.from(getTestRoot().firstChild.childNodes).filter((e) => !(e instanceof Comment)).length === 0);
    });

    it('Should not suspend if content is not a promise', () => {
        attachToken = attachToTestRoot(renderSuspense('1', '2'));
        assert(getTestRoot().firstChild.textContent === '2');
    });

    it('Should suspend if content is a promise', () => {
        attachToken = attachToTestRoot(renderSuspense('1', new Promise(() => void 0)));
        assert(getTestRoot().firstChild.textContent === '1');
    });

    it('Should remove suspense after promise resolves', async () => {
        attachToken = attachToTestRoot(renderSuspense('1', new Promise((r) => r('2'))));
        assert(getTestRoot().firstChild.textContent === '1');
        await sleep(0);
        assert(getTestRoot().firstChild.textContent === '2');
    });

    it('Should call onAttach and onDetach of child in correct order', async () => {
        const attachCallback = sinon.spy();
        const detachCallback = sinon.spy();

        attachToken = attachToTestRoot(renderSuspense('1', new Promise((r) => r(<div onAttach={() => attachCallback()} onDetach={() => detachCallback()} />))));
        await sleep(0);
        attachToken.cancel();

        assert(attachCallback.calledOnce, 'onAttach should get called once');
        assert(detachCallback.calledOnce, 'onDetach should get called once');
        assert(attachCallback.calledBefore(detachCallback), 'onAttach should get called before onDetach');
    });
}

describe('Suspense', () => {
    let attachToken: CancellationToken;

    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    generateSuspenseTests((fallback, children) => (
        <div>
            <Suspense fallback={fallback}>{children}</Suspense>
        </div>
    ));
});
