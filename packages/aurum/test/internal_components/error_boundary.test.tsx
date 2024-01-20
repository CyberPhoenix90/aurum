import { afterEach, assert, describe, it } from 'vitest';
import { Aurum, CancellationToken, ErrorBoundary, Renderable } from '../../src/aurumjs.js';
import { attachToTestRoot, getTestRoot, sleep } from '../test_utils.js';
import { generateSuspenseTests } from './suspense.test.js';

const errorMessage = "I'm an error";

describe('ErrorBoundary', () => {
    let attachToken: CancellationToken;

    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    generateSuspenseTests((fallback, children) => (
        <div>
            <ErrorBoundary suspenseFallback={fallback}>{children}</ErrorBoundary>
        </div>
    ));

    it('Should show error fallback when promise rejects', async () => {
        attachToken = attachToTestRoot(
            <div>
                <ErrorBoundary errorFallback="1">
                    {
                        new Promise((resolve, reject) => {
                            reject('2');
                        })
                    }
                </ErrorBoundary>
            </div>
        );
        await sleep(0);
        assert(getTestRoot().firstChild.textContent === '1');
    });

    it('Should show error fallback when a child throws', async () => {
        attachToken = attachToTestRoot(
            <div>
                <ErrorBoundary errorFallback={(error: Error) => error.message}>
                    <ThrowComponent />
                </ErrorBoundary>
            </div>
        );
        assert(getTestRoot().firstChild.textContent === errorMessage);
    });

    it('Should show error fallback when a nested component throws', async () => {
        attachToken = attachToTestRoot(
            <div>
                <ErrorBoundary errorFallback={(error: Error) => error.message}>
                    <WrappedThrowComponent />
                </ErrorBoundary>
            </div>
        );
        assert(getTestRoot().firstChild.textContent === errorMessage);
    });
});

function ThrowComponent(): Renderable {
    throw new Error(errorMessage);
}

function WrappedThrowComponent(): Renderable {
    return (
        <div>
            <ThrowComponent />
        </div>
    );
}
