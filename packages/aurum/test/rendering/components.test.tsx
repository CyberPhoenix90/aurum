import { assert } from 'chai';
import { DataSource, dsMap } from '../../src/aurumjs';
import { Aurum } from '../../src/utilities/aurum';
import { CancellationToken } from '../../src/utilities/cancellation_token';

function TestComponent(props, children, api) {
    return <span>{children}</span>;
}

describe('Components', () => {
    let attachToken: CancellationToken;
    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('Should attach component', () => {
        attachToken = Aurum.attach(
            <div>
                <TestComponent></TestComponent>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').innerHTML === '<div><span></span></div>');
    });

    it('Should attach component with primitive transclusion', () => {
        attachToken = Aurum.attach(
            <div>
                <TestComponent>1234</TestComponent>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').innerHTML === '<div><span>1234</span></div>');
    });

    it('Should attach component with dom node transclusion', () => {
        attachToken = Aurum.attach(
            <div>
                <TestComponent>
                    <li></li>
                </TestComponent>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').innerHTML === '<div><span><li></li></span></div>');
    });

    it('Should attach component with component transclusion', () => {
        attachToken = Aurum.attach(
            <div>
                <TestComponent>
                    <TestComponent></TestComponent>
                </TestComponent>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').innerHTML === '<div><span><span></span></span></div>');
    });

    it('Should attach component with nested component transclusion', () => {
        attachToken = Aurum.attach(
            <div>
                <TestComponent>
                    <TestComponent>
                        <TestComponent>
                            <TestComponent></TestComponent>
                        </TestComponent>
                    </TestComponent>
                </TestComponent>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').innerHTML === '<div><span><span><span><span></span></span></span></span></div>');
    });

    const htmlComments = /<!--(.*?)-->/gm;

    it('Dynamic attaching and detaching', () => {
        const ds = new DataSource();
        attachToken = Aurum.attach(<div>{ds}</div>, document.getElementById('target'));

        assert(document.getElementById('target').innerHTML.replace(htmlComments, '') === '<div></div>');

        ds.update(<TestComponent></TestComponent>);

        assert(document.getElementById('target').innerHTML.replace(htmlComments, '') === '<div><span></span></div>');

        ds.update(undefined);

        assert(document.getElementById('target').innerHTML.replace(htmlComments, '') === '<div></div>');
    });

    it('Dynamic nested attaching and detaching', () => {
        const ds = new DataSource();
        attachToken = Aurum.attach(<div>{ds.transform(dsMap((v) => (v ? <div>{v}</div> : undefined)))}</div>, document.getElementById('target'));

        assert(document.getElementById('target').innerHTML.replace(htmlComments, '') === '<div></div>');

        ds.update(<TestComponent></TestComponent>);

        assert(document.getElementById('target').innerHTML.replace(htmlComments, '') === '<div><div><span></span></div></div>');

        ds.update(undefined);

        assert(document.getElementById('target').innerHTML.replace(htmlComments, '') === '<div></div>');
    });
});
