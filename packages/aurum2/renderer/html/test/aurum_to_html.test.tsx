import { assert } from 'chai';
import { renderAsHTML } from '../src/render_plugin';
import { Aurum, Renderable } from '@aurum/core';

describe('Aurum To HTML', () => {
    it('Should render HTML in place', () => {
        const content = renderAsHTML(<a class="abc" id="bcd" href="test"></a>);

        assert.equal(content.tagName, 'A');
        assert.equal(content.className, 'abc');
        assert.equal(content.id, 'bcd');
        assert.equal(content.getAttribute('href'), 'test');
    });

    it('Should render nested HTML in place', () => {
        const content = renderAsHTML(
            <div>
                <a class="abc" id="bcd" href="test"></a>
            </div>
        );

        assert.equal(content.tagName, 'DIV');
        assert.equal(content.childNodes.length, 1);
        assert.equal((content.firstChild as HTMLElement).className, 'abc');
        assert.equal((content.firstChild as HTMLElement).id, 'bcd');
        assert.equal((content.firstChild as HTMLElement).getAttribute('href'), 'test');
    });

    it('Should render nested HTML in place 2', () => {
        const content = renderAsHTML(
            <div>
                <a class="abc" id="bcd" href="test"></a>
                <span>123</span>
            </div>
        );

        assert.equal(content.tagName, 'DIV');
        assert.equal(content.childNodes.length, 2);
        assert.equal((content.firstChild as HTMLElement).className, 'abc');
        assert.equal((content.firstChild as HTMLElement).id, 'bcd');
        assert.equal((content.firstChild as HTMLElement).getAttribute('href'), 'test');
        assert.equal((content.childNodes[1] as HTMLElement).innerText, '123');
    });

    it('Should render nested HTML in place with fragment', () => {
        const content = renderAsHTML(
            <div>
                <>
                    <a class="abc" id="bcd" href="test"></a>
                    <span>123</span>
                </>
            </div>
        );

        assert.equal(content.tagName, 'DIV');
        assert.equal(content.childElementCount, 2);
        assert.equal((content.firstChild as HTMLElement).className, 'abc');
        assert.equal((content.firstChild as HTMLElement).id, 'bcd');
        assert.equal((content.firstChild as HTMLElement).getAttribute('href'), 'test');
        assert.equal((content.childNodes[1] as HTMLElement).innerText, '123');
    });

    it('Should render components', () => {
        const content = renderAsHTML(
            <div>
                <TestComponent></TestComponent>
            </div>
        );

        function TestComponent(): Renderable {
            return (
                <>
                    <a class="abc" id="bcd" href="test"></a>
                    <span>123</span>
                </>
            );
        }

        assert.equal(content.tagName, 'DIV');
        assert.equal(content.childElementCount, 2);
        assert.equal((content.firstChild as HTMLElement).className, 'abc');
        assert.equal((content.firstChild as HTMLElement).id, 'bcd');
        assert.equal((content.firstChild as HTMLElement).getAttribute('href'), 'test');
        assert.equal((content.childNodes[1] as HTMLElement).innerText, '123');
    });

    it('Should render components 2', () => {
        const content = renderAsHTML(
            <div>
                <TestComponent></TestComponent>
            </div>
        );

        function TestComponent(): Renderable {
            return (
                <>
                    <a class="abc" id="bcd" href="test"></a>
                    <span>123</span>
                    {'test'}
                </>
            );
        }

        assert.equal(content.tagName, 'DIV');
        assert.equal(content.childNodes.length, 3);
        assert.equal((content.firstChild as HTMLElement).className, 'abc');
        assert.equal((content.firstChild as HTMLElement).id, 'bcd');
        assert.equal((content.firstChild as HTMLElement).getAttribute('href'), 'test');
        assert.equal((content.childNodes[1] as HTMLElement).innerText, '123');
    });
});
