import { assert } from 'chai';
import { AurumElementModel, Renderable, attachNotifier } from '../../src/aurumjs.js';
import { Aurum } from '../../src/utilities/aurum.js';
import { CancellationToken } from '../../src/utilities/cancellation_token.js';
import { sleep } from '../test_utils.js';

function TestComponent(props, children, api) {
    return <span>{children}</span>;
}

describe('Decorators', () => {
    let attachToken: CancellationToken | undefined;
    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('Should call decorator', () => {
        let i = 0;
        function testDecorator(model: AurumElementModel<any>): AurumElementModel<any> {
            i++;
            assert.equal(model.name, 'TestComponent');
            return model;
        }

        attachToken = Aurum.attach(
            <div>
                <TestComponent decorate={testDecorator}></TestComponent>
                <TestComponent></TestComponent>
            </div>,
            document.getElementById('target')!
        );

        assert(i === 1);
    });

    it('Should be able to decorate intrinsic elements', () => {
        let i = 0;
        function testDecorator(model: AurumElementModel<any>): AurumElementModel<any> {
            i++;
            assert.equal(model.name, 'div');
            return model;
        }

        attachToken = Aurum.attach(<div decorate={testDecorator}></div>, document.getElementById('target')!);

        assert(i === 1);
    });

    it('decorator should be able to replace component', () => {
        function testDecorator(model: AurumElementModel<any>): Renderable {
            return <div></div>;
        }

        attachToken = Aurum.attach(
            <div>
                <TestComponent decorate={testDecorator}></TestComponent>
            </div>,
            document.getElementById('target')!
        );

        assert(document.getElementById('target')!.innerHTML === '<div><div></div></div>');
    });

    it('decorator should be able to replace component with primitive', () => {
        function testDecorator(model: AurumElementModel<any>): Renderable {
            return 1234;
        }

        attachToken = Aurum.attach(
            <div>
                <TestComponent decorate={testDecorator}></TestComponent>
            </div>,
            document.getElementById('target')!
        );

        assert.equal(document.getElementById('target')!.innerHTML, '<div>1234</div>');
    });

    it('decorator should be able to replace component with async component', async () => {
        function testDecorator(model: AurumElementModel<any>): Renderable {
            return <AsyncComponent></AsyncComponent>;
        }

        async function AsyncComponent() {
            await sleep(10);

            return <div></div>;
        }

        attachToken = Aurum.attach(
            <div>
                <TestComponent decorate={testDecorator}></TestComponent>
            </div>,
            document.getElementById('target')!
        );

        assert.equal(document.getElementById('target')!.innerHTML.replace(/<!--.*?-->/g, ''), '<div></div>');
        await sleep(20);
        assert.equal(document.getElementById('target')!.innerHTML.replace(/<!--.*?-->/g, ''), '<div><div></div></div>');
    });

    it('decorator should be able to replace children of component', async () => {
        function testDecorator(model: AurumElementModel<any>): Renderable {
            model.children = [<div>5678</div>];
            return model;
        }

        attachToken = Aurum.attach(
            <div>
                <TestComponent decorate={[testDecorator]}>1234</TestComponent>
            </div>,
            document.getElementById('target')!
        );

        assert.equal(document.getElementById('target')!.innerHTML, '<div><span><div>5678</div></span></div>');
    });

    it('attachNotifier', () => {
        let attachCalled = false;
        let detachCalled = false;

        attachToken = Aurum.attach(
            <div>
                <TestComponent
                    decorate={attachNotifier(
                        () => (attachCalled = true),
                        () => (detachCalled = true)
                    )}
                ></TestComponent>
            </div>,
            document.getElementById('target')!
        );

        assert(attachCalled);
        assert(!detachCalled);

        attachToken.cancel();

        assert(detachCalled);
    });
});
