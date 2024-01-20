import { assert } from 'chai';
import { ArrayDataSource, aurumToVDOM, CancellationToken, DataSource } from '../../src/aurumjs.js';
import { Aurum } from '../../src/utilities/aurum.js';

describe('Aurum To VDOM', () => {
    let sessionToken;

    beforeEach(() => {
        sessionToken = new CancellationToken();
    });

    afterEach(() => {
        sessionToken.cancel();
    });

    it('Should render simple VDOM', () => {
        const vdom = aurumToVDOM(<a class="abc" id="bcd" href="test"></a>, new CancellationToken());
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'a');
        assert(vdom.roots[0].attributes?.class === 'abc');
        assert(vdom.roots[0].attributes?.id === 'bcd');
        assert(vdom.roots[0].attributes?.href === 'test');
        assert(vdom.roots[0].children?.length === 0);
    });

    it('Should render nested VDOM', () => {
        const vdom = aurumToVDOM(
            <a class="abc" id="bcd" href="test">
                <div></div>
            </a>,
            new CancellationToken()
        );
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'a');
        assert(vdom.roots[0].attributes?.class === 'abc');
        assert(vdom.roots[0].attributes?.id === 'bcd');
        assert(vdom.roots[0].attributes?.href === 'test');
        assert(vdom.roots[0].children?.length === 1);
        assert(vdom.roots[0].children[0].tag === 'div');
        assert(vdom.roots[0].children[0].children?.length === 0);
    });

    it('Should render nested VDOM with text', () => {
        const vdom = aurumToVDOM(
            <a class="abc" id="bcd" href="test">
                <div>test</div>
            </a>,
            new CancellationToken()
        );
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'a');
        assert(vdom.roots[0].attributes?.class === 'abc');
        assert(vdom.roots[0].attributes?.id === 'bcd');
        assert(vdom.roots[0].attributes?.href === 'test');
        assert(vdom.roots[0].children?.length === 1);
        assert(vdom.roots[0].children[0].tag === 'div');
        assert(vdom.roots[0].children[0].children?.length === 1);
        assert(vdom.roots[0].children[0].children[0].text === 'test');
    });

    it('Should detect changes', async () => {
        const dataSource = new DataSource('test');

        const vdom = aurumToVDOM(
            <a class="abc" id="bcd" href="test">
                <div>{dataSource}</div>
                {dataSource}
            </a>,
            sessionToken
        );

        //@ts-ignore
        assert(dataSource.updateEvent.subscriptions === 2);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'a');
        assert(vdom.roots[0].attributes?.class === 'abc');
        assert(vdom.roots[0].attributes?.id === 'bcd');
        assert(vdom.roots[0].attributes?.href === 'test');
        assert(vdom.roots[0].children?.length === 2);
        assert(vdom.roots[0].children[0].tag === 'div');
        assert(vdom.roots[0].children[0].children?.length === 1);
        assert(vdom.roots[0].children[0].children[0].type === 'virtual');
        assert(vdom.roots[0].children[0].children[0].children?.[0].text === 'test');

        let called = false;
        vdom.onChange.subscribe(() => {
            called = true;
        });

        dataSource.update('test2');
        assert(called);

        //@ts-ignore
        assert(dataSource.updateEvent.subscriptions === 2);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'a');
        assert(vdom.roots[0].attributes?.class === 'abc');
        assert(vdom.roots[0].attributes?.id === 'bcd');
        assert(vdom.roots[0].attributes?.href === 'test');
        assert(vdom.roots[0].children?.length === 2);
        assert(vdom.roots[0].children[0].tag === 'div');
        assert(vdom.roots[0].children[0].children?.length === 1);
        //@ts-ignore
        assert(vdom.roots[0].children[0].children[0].children?.[0].text === 'test2');

        sessionToken.cancel();

        //@ts-ignore
        assert(dataSource.updateEvent.subscriptions === 0);
    });

    it('Should support structured styles', () => {
        const vdom = aurumToVDOM(
            <a
                style={{
                    color: 'red',
                    backgroundColor: 'blue'
                }}
            ></a>,
            sessionToken
        );

        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'a');
        assert(vdom.roots[0].attributes?.style === 'color:red;background-color:blue;');
    });

    it('Should detect changes in attributes', async () => {
        const dataSource = new DataSource('test');

        const vdom = aurumToVDOM(<a class="abc" id="bcd" href={dataSource}></a>, sessionToken);

        //@ts-ignore
        assert(dataSource.updateEvent.subscriptions === 1);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'a');
        assert(vdom.roots[0].attributes?.class === 'abc');
        assert(vdom.roots[0].attributes?.id === 'bcd');
        assert(vdom.roots[0].attributes?.href === 'test');

        let called = false;
        vdom.onChange.subscribe(() => {
            called = true;
        });

        dataSource.update('test2');
        assert(called);

        //@ts-ignore
        assert(dataSource.updateEvent.subscriptions === 1);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'a');
        assert(vdom.roots[0].attributes?.class === 'abc');
        assert(vdom.roots[0].attributes?.id === 'bcd');
        //@ts-ignore
        assert(vdom.roots[0].attributes?.href === 'test2');

        sessionToken.cancel();
        //@ts-ignore
        assert(dataSource.updateEvent.subscriptions === 0);
    });

    it('Should support array data sources', async () => {
        const dataSource = new ArrayDataSource(['test', 'test2']);

        const vdom = aurumToVDOM(
            <a>
                <div>{dataSource}</div>
            </a>,
            sessionToken
        );

        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'a');
        assert(vdom.roots[0].children?.length === 1);
        assert(vdom.roots[0].children[0].tag === 'div');
        assert(vdom.roots[0].children[0].children?.length === 1);
        assert(vdom.roots[0].children[0].children[0].children?.length === 2);
        assert(vdom.roots[0].children[0].children[0].children[0].text === 'test');
        assert(vdom.roots[0].children[0].children[0].children[1].text === 'test2');

        let called = false;
        vdom.onChange.subscribe(() => {
            called = true;
        });

        dataSource.push('test3');

        assert(called);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'a');
        assert(vdom.roots[0].children?.length === 1);
        assert(vdom.roots[0].children[0].tag === 'div');
        //@ts-ignore
        assert(vdom.roots[0].children[0].children[0].children?.length === 3);
        assert(vdom.roots[0].children[0].children[0].children[0].text === 'test');
        assert(vdom.roots[0].children[0].children[0].children[1].text === 'test2');
        assert(vdom.roots[0].children[0].children[0].children[2].text === 'test3');
    });

    it('should not rebuild components when they rerender', async () => {
        const state = new DataSource(0);
        let callCount = 0;
        function TestComponent() {
            callCount++;
            return <div>{state}</div>;
        }

        const vdom = aurumToVDOM(<TestComponent></TestComponent>, sessionToken);

        assert(callCount === 1);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'div');
        assert(vdom.roots[0].children?.length === 1);
        //@ts-ignore
        assert(vdom.roots[0].children[0].children[0].text === '0');

        state.update(1);

        assert(callCount === 1);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'div');
        assert(vdom.roots[0].children?.length === 1);
        //@ts-ignore
        assert(vdom.roots[0].children[0].children[0].text === '1');
    });

    it('should rebuild components when if they are removed and put back onto the VDOM', async () => {
        const state = new DataSource(0);
        const component = new DataSource(<TestComponent></TestComponent>);
        let callCount = 0;
        function TestComponent() {
            callCount++;
            return <div>{state}</div>;
        }

        const vdom = aurumToVDOM(<div>{component}</div>, sessionToken);

        assert(callCount === 1);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'div');
        //@ts-ignore
        assert(vdom.roots[0].children[0].children[0].children?.length === 1);
        //@ts-ignore
        assert(vdom.roots[0].children[0].children[0].children[0].children[0].text === '0');

        state.update(1);

        assert(callCount === 1);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'div');
        //@ts-ignore
        assert(vdom.roots[0].children[0].children?.length === 1);
        //@ts-ignore
        assert(vdom.roots[0].children[0].children[0].children[0].children[0].text === '1');

        component.update(undefined);

        assert(callCount === 1);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'div');
        //@ts-ignore
        assert(vdom.roots[0].children[0].children?.length === 0);

        component.update(<TestComponent></TestComponent>);

        //@ts-ignore
        assert(callCount === 2);
        assert(vdom.roots.length === 1);
        assert(vdom.roots[0].tag === 'div');
        //@ts-ignore
        assert(vdom.roots[0].children[0].children?.length === 1);
        //@ts-ignore
        assert(vdom.roots[0].children[0].children[0].children[0].children[0].text === '1');
    });

    it('should cancel api token of component when unmounted', async () => {
        let token: CancellationToken;
        const component = new DataSource(<TestComponent></TestComponent>);
        function TestComponent(props, children, api) {
            token = api.cancellationToken;
            return <div>0</div>;
        }

        aurumToVDOM(<div>{component}</div>, sessionToken);

        assert(token.isCancelled === false);

        component.update(undefined);

        //@ts-ignore
        assert(token.isCancelled === true);
    });

    it('should call onAttach and onDetach on api', async () => {
        let attached = false;
        let detached = false;
        const component = new DataSource(<TestComponent></TestComponent>);
        function TestComponent(props, children, api) {
            api.onAttach(() => {
                attached = true;
            });
            api.onDetach(() => {
                detached = true;
            });
            return <div>0</div>;
        }

        aurumToVDOM(<div>{component}</div>, sessionToken);

        //@ts-ignore
        assert(attached === true);
        assert(detached === false);

        component.update(undefined);

        assert(attached === true);
        //@ts-ignore
        assert(detached === true);
    });

    it('should call onAttach and onDetach on dom nodes', async () => {
        let attached = false;
        let detached = false;
        const component = new DataSource(<TestComponent></TestComponent>);
        function TestComponent(props, children, api) {
            return <div onAttach={() => (attached = true)} onDetach={() => (detached = true)}></div>;
        }

        aurumToVDOM(<div>{component}</div>, sessionToken);

        //@ts-ignore
        assert(attached === true);
        assert(detached === false);

        component.update(undefined);

        assert(attached === true);
        //@ts-ignore
        assert(detached === true);
    });
});
