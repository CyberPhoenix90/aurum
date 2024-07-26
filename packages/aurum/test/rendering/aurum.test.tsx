import { assert, describe, beforeEach, afterEach, it } from 'vitest';
import * as sinon from 'sinon';
import { Aurum, DataSource, CancellationToken, MapDataSource, combineStyle, combineClass } from '../../src/aurumjs.js';

describe('Aurum', () => {
    let clock: sinon.SinonFakeTimers;
    beforeEach(() => {
        clock = sinon.useFakeTimers();
    });

    let attachToken: CancellationToken;
    afterEach(() => {
        clock.uninstall();
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('should attach dom node', () => {
        assert(document.getElementById('target').firstChild === null);
        attachToken = Aurum.attach(<div></div>, document.getElementById('target'));
        assert(document.getElementById('target').firstChild !== null);
    });

    it('should attach data source', () => {
        const ds = new DataSource(<div>Hello World</div>);
        attachToken = Aurum.attach(ds, document.getElementById('target'));
        assert.equal(document.getElementById('target').textContent, 'Hello World');
        ds.update('Hello World 2');
        assert.equal(document.getElementById('target').textContent, 'Hello World 2');
    });

    it('Should set inner text', () => {
        attachToken = Aurum.attach(<div>Hello World</div>, document.getElementById('target'));
        assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === 'Hello World');
    });

    it('Should work with svg', () => {
        attachToken = Aurum.attach(
            <div>
                <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
                </svg>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').firstChild.childNodes.length === 1);
        assert(document.getElementById('target').firstChild.firstChild.nodeName === 'svg');
        assert(document.getElementById('target').firstChild.firstChild.firstChild.nodeName === 'circle');
        assert((document.getElementById('target').firstChild.firstChild.firstChild as SVGElement).getAttribute('cx') === '50');
    });

    it('Should fire onAttach when connected to dom', () => {
        return new Promise<void>((resolve) => {
            attachToken = Aurum.attach(
                <div
                    onAttach={(ele) => {
                        assert(ele.isConnected);
                        resolve();
                    }}
                >
                    Hello World
                </div>,
                document.getElementById('target')
            );
            clock.tick(100);
        });
    });

    it('Should fire onDetach when disconnected from dom', () => {
        return new Promise<void>((resolve) => {
            attachToken = Aurum.attach(
                <div
                    onDetach={(ele) => {
                        assert(!ele.isConnected);
                        resolve();
                    }}
                >
                    Hello World
                </div>,
                document.getElementById('target')
            );
            clock.tick(100);
            attachToken.cancel();
            attachToken = undefined;
        });
    });

    it('Should support fragments', () => {
        attachToken = Aurum.attach(
            <div>
                <>Hello World</>
            </div>,
            document.getElementById('target')
        );
        clock.tick(100);
        assert(document.getElementById('target').firstChild.childNodes.length === 1);
        assert((document.getElementById('target').firstChild as HTMLDivElement).innerHTML === 'Hello World');
    });

    it('Should support nested fragments', () => {
        attachToken = Aurum.attach(
            <div>
                <>
                    <>Hello World</>
                </>
            </div>,
            document.getElementById('target')
        );
        clock.tick(100);
        assert(document.getElementById('target').firstChild.childNodes.length === 1);
        assert((document.getElementById('target').firstChild as HTMLDivElement).innerHTML === 'Hello World');
    });

    it('Should support components in fragments', () => {
        function TestComponent() {
            return 'Hello World';
        }

        attachToken = Aurum.attach(
            <div>
                <>
                    <>
                        <TestComponent></TestComponent>
                    </>
                </>
            </div>,
            document.getElementById('target')
        );
        clock.tick(100);
        assert(document.getElementById('target').firstChild.childNodes.length === 1);
        assert((document.getElementById('target').firstChild as HTMLDivElement).innerHTML === 'Hello World');
    });

    it('Should support fragments in transclusion', () => {
        function TestComponent(_, c) {
            return c;
        }

        attachToken = Aurum.attach(
            <div>
                <>
                    <>
                        <TestComponent>
                            <>
                                <>Test1</>
                                <>Test2</>
                            </>
                        </TestComponent>
                    </>
                </>
            </div>,
            document.getElementById('target')
        );
        clock.tick(100);
        assert(document.getElementById('target').firstChild.childNodes.length === 2);
        assert((document.getElementById('target').firstChild as HTMLDivElement).innerHTML === 'Test1Test2');
    });

    it('Should support datasources in fragments in transclusion', () => {
        const ds = new DataSource('State1');
        function TestComponent(_, c) {
            return c;
        }

        attachToken = Aurum.attach(
            <div>
                <>
                    <>
                        <TestComponent>
                            <>
                                <>{ds}</>
                                <>Test2</>
                            </>
                        </TestComponent>
                    </>
                </>
            </div>,
            document.getElementById('target')
        );
        clock.tick(100);
        assert(document.getElementById('target').firstChild.childNodes.length === 4);
        assert((document.getElementById('target').firstChild as HTMLDivElement).innerText === 'State1Test2');
        ds.update('State2');
        assert((document.getElementById('target').firstChild as HTMLDivElement).innerText === 'State2Test2');
    });

    it('Should set child node', () => {
        attachToken = Aurum.attach(
            <div>
                <p>Hello World</p>
            </div>,
            document.getElementById('target')
        );
        clock.tick(100);
        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).textContent === 'Hello World');
    });

    it('should accept booleans for attributes 1', () => {
        attachToken = Aurum.attach(
            <div>
                <p id={false}>Hello World</p>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === false);
    });

    it('should accept booleans for attributes 2', () => {
        attachToken = Aurum.attach(
            <div>
                <p id={true}>Hello World</p>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).getAttribute('id') === '');
    });

    it('should accept numbers for attributes', () => {
        attachToken = Aurum.attach(
            <div>
                <progress max={100} value={50}></progress>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLProgressElement);
        assert.equal((document.getElementById('target').firstChild.firstChild as HTMLProgressElement).max, 100);
        assert.equal((document.getElementById('target').firstChild.firstChild as HTMLProgressElement).value, 50);
    });

    it('should accept number datasources for attributes', () => {
        const ds = new DataSource(50);
        attachToken = Aurum.attach(
            <div>
                <progress max={100} value={ds}></progress>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLProgressElement);
        assert.equal((document.getElementById('target').firstChild.firstChild as HTMLProgressElement).max, 100);
        assert.equal((document.getElementById('target').firstChild.firstChild as HTMLProgressElement).value, 50);

        ds.update(75);

        assert.equal((document.getElementById('target').firstChild.firstChild as HTMLProgressElement).max, 100);
        assert.equal((document.getElementById('target').firstChild.firstChild as HTMLProgressElement).value, 75);
    });

    it('should accept booleans datasources for attributes', () => {
        const ds = new DataSource(false);
        attachToken = Aurum.attach(
            <div>
                <p id={ds}>Hello World</p>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === false);

        ds.update(true);

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).getAttribute('id') === '');

        ds.update(false);

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === false);
    });

    it('should accept text for attributes', () => {
        attachToken = Aurum.attach(
            <div>
                <p id="test">Hello World</p>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).getAttribute('id') === 'test');
    });

    it('should accept string datasources for attributes', () => {
        const ds = new DataSource('');
        attachToken = Aurum.attach(
            <div>
                <p id={ds}>Hello World</p>
            </div>,
            document.getElementById('target')
        );
        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).getAttribute('id') === '');

        ds.update('test');

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).hasAttribute('id') === true);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).getAttribute('id') === 'test');
    });

    it('should accept maps for class attribute', () => {
        attachToken = Aurum.attach(
            <div>
                <p
                    class={{
                        red: true,
                        green: false
                    }}
                >
                    Hello World
                </p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('red') === true);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('green') === false);
    });

    it('should accept maps with datasources for class attribute', () => {
        const ds = new DataSource(false);
        attachToken = Aurum.attach(
            <div>
                <p
                    class={{
                        red: true,
                        green: false,
                        blue: ds
                    }}
                >
                    Hello World
                </p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('red') === true);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('green') === false);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('blue') === false);

        ds.update(true);

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('red') === true);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('green') === false);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('blue') === true);
    });

    it('should accept arrays for class attribute', () => {
        attachToken = Aurum.attach(
            <div>
                <p class={['red', 'green']}>Hello World</p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('red') === true);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('green') === true);
    });

    it('should accept map data sources for class', () => {
        const ds = new MapDataSource<string, boolean>();
        ds.set('red', true);
        ds.set('green', false);

        attachToken = Aurum.attach(
            <div>
                <p class={ds}>Hello World</p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('red') === true);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('green') === false);

        ds.set('red', false);

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('red') === false);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('green') === false);

        ds.set('green', true);

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('red') === false);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).classList.contains('green') === true);
    });

    it('should accept style objects for style attribute', () => {
        attachToken = Aurum.attach(
            <div>
                <p
                    style={{
                        color: 'red',
                        backgroundColor: 'green'
                    }}
                >
                    Hello World
                </p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === 'red');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'green');
    });

    it('should accept style objects with datasources for style attribute', () => {
        const ds = new DataSource('red');
        attachToken = Aurum.attach(
            <div>
                <p
                    style={{
                        color: ds,
                        backgroundColor: 'green'
                    }}
                >
                    Hello World
                </p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === 'red');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'green');

        ds.update('blue');

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === 'blue');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'green');
    });

    it('should accept map data sources for style', () => {
        const ds = new MapDataSource<string, string>();
        ds.set('color', 'red');
        ds.set('backgroundColor', 'green');

        attachToken = Aurum.attach(
            <div>
                <p style={ds}>Hello World</p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === 'red');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'green');

        ds.set('color', 'blue');

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === 'blue');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'green');

        ds.set('backgroundColor', 'yellow');

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === 'blue');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'yellow');

        ds.delete('color');

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === '');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'yellow');
    });

    it('should be able to combine style objects and datasources', () => {
        const ds = new DataSource('color:red');
        attachToken = Aurum.attach(
            <div>
                <p
                    style={combineStyle(
                        attachToken,
                        {
                            backgroundColor: 'blue'
                        },
                        ds
                    )}
                >
                    Hello World
                </p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === 'red');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'blue');

        ds.update('color:yellow');

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === 'yellow');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'blue');
    });

    it('should be able to combine style objects and datasources with map datasources', () => {
        const ds = new MapDataSource<string, string>();
        ds.set('color', 'red');

        attachToken = Aurum.attach(
            <div>
                <p
                    style={combineStyle(
                        attachToken,
                        {
                            backgroundColor: 'blue'
                        },
                        ds
                    )}
                >
                    Hello World
                </p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === 'red');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'blue');

        ds.set('color', 'yellow');

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.color === 'yellow');
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).style.backgroundColor === 'blue');
    });

    it('should be able to combine classnames and constant classes', () => {
        attachToken = Aurum.attach(
            <div>
                <p
                    class={combineClass(attachToken, 'red', 'green', {
                        blue: true,
                        yellow: false
                    })}
                >
                    Hello World
                </p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).className === 'red green blue');
    });

    it('should be able to combine classnames and datasources', () => {
        const ds = new DataSource('red');
        attachToken = Aurum.attach(
            <div>
                <p
                    class={combineClass(attachToken, ds, 'green', {
                        blue: true,
                        yellow: false
                    })}
                >
                    Hello World
                </p>
            </div>,
            document.getElementById('target')
        );

        assert(document.getElementById('target').firstChild.firstChild instanceof HTMLParagraphElement);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).className === 'green blue red');

        ds.update('yellow');

        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).className === 'green blue yellow');
    });

    it('Should accept data sources', () => {
        const ds = new DataSource('123');
        attachToken = Aurum.attach(
            <div>
                <p>{ds}</p>
            </div>,
            document.getElementById('target')
        );
        clock.tick(100);
        assert((document.getElementById('target').firstChild.firstChild as HTMLDivElement).textContent === '123');
    });

    it('Should accept functional components', () => {
        const FuncComp = () => <div>Functional</div>;
        attachToken = Aurum.attach(<FuncComp></FuncComp>, document.getElementById('target'));
        clock.tick(100);
        assert((document.getElementById('target').firstChild as HTMLDivElement).textContent === 'Functional');
    });
});
