import { afterEach, assert, describe, it } from 'vitest';
import { Aurum, CancellationToken, DataSource, aurumToString, css, getAurumStyleText, keyframes } from '../../src/index.js';

describe('native reactive styling', () => {
    let attachment: CancellationToken | undefined;

    afterEach(() => {
        attachment?.cancel();
        attachment = undefined;
        document.getElementById('target')!.replaceChildren();
    });

    it('keeps a stable class while updating reactive CSS variables', () => {
        const color = new DataSource('rgb(255, 0, 0)');
        const style = css`
            color: ${color};

            .child {
                font-weight: 700;
            }
        `;

        attachment = Aurum.attach(
            <div class={style}>
                <span class="child">content</span>
            </div>,
            document.getElementById('target')!
        );
        const element = document.querySelector<HTMLElement>(`.${style.className}`)!;
        const className = element.className;

        assert.equal(getComputedStyle(element).color, 'rgb(255, 0, 0)');
        assert.equal(getComputedStyle(element.firstElementChild!).fontWeight, '700');

        color.update('rgb(0, 0, 255)');

        assert.equal(element.className, className);
        assert.equal(getComputedStyle(element).color, 'rgb(0, 0, 255)');
    });

    it('registers one stylesheet for a style shared by multiple elements', () => {
        const color = new DataSource('red');
        const createStyle = () => css`color: ${color};`;
        const first = createStyle();
        const second = createStyle();
        assert.strictEqual(first, second);

        attachment = Aurum.attach(
            <div>
                <span class={first}></span>
                <span class={[second, 'extra']}></span>
            </div>,
            document.getElementById('target')!
        );

        assert.equal(document.querySelectorAll(`style[data-aurum-style="${first.className}"]`).length, 1);
        assert.equal(document.querySelectorAll(`.${first.className}`).length, 2);
    });

    it('stops observing sources after the final attachment is cancelled and resumes on reattach', () => {
        const color = new DataSource('red');
        const style = css`color: ${color};`;
        attachment = Aurum.attach(<div class={style}></div>, document.getElementById('target')!);
        const styleElement = document.querySelector<HTMLStyleElement>(`style[data-aurum-style="${style.className}"]`)!;
        const variableRule = styleElement.sheet!.cssRules[0] as CSSStyleRule;

        color.update('blue');
        assert.include(variableRule.style.cssText, 'blue');

        attachment.cancel();
        attachment = undefined;
        color.update('green');
        assert.notInclude(variableRule.style.cssText, 'green');

        attachment = Aurum.attach(<div class={style}></div>, document.getElementById('target')!);
        assert.include(variableRule.style.cssText, 'green');
    });

    it('sets reactive values through CSSOM without allowing declaration injection', () => {
        const value = new DataSource('red');
        const style = css`color: ${value};`;
        attachment = Aurum.attach(<div class={style}></div>, document.getElementById('target')!);
        const styleElement = document.querySelector<HTMLStyleElement>(`style[data-aurum-style="${style.className}"]`)!;
        const variableRule = styleElement.sheet!.cssRules[0] as CSSStyleRule;

        value.update('blue; background-color: red');

        assert.equal(variableRule.style.backgroundColor, '');
        assert.notInclude(variableRule.style.cssText, 'background-color');
    });

    it('serializes stable class names and collected rules for SSR', async () => {
        const size = new DataSource('14px');
        const style = css`font-size: ${size};`;

        assert.equal(await aurumToString(<div class={[style, 'extra']}>content</div>), `<div class="${style.className} extra">content</div>`);
        const styleText = getAurumStyleText();
        assert.include(styleText, `.${style.className}`);
        assert.include(styleText, '14px');
        assert.include(styleText, `font-size: var(--${style.className}-0)`);
    });

    it('registers stable global keyframes for scoped animation rules', () => {
        const animation = keyframes`
            from { opacity: 0; }
            to { opacity: 1; }
        `;
        const style = css`animation: ${animation} 100ms linear;`;
        attachment = Aurum.attach(<div class={style}></div>, document.getElementById('target')!);

        assert.equal(document.querySelectorAll(`style[data-aurum-global-style="${animation}"]`).length, 1);
        assert.include(getAurumStyleText(), `@keyframes ${animation}`);
    });

    it('supports nested selector lists and nested state selectors', () => {
        const style = css`
            .wrapper {
                h1:first-child,
                h2:first-child {
                    margin-top: 0;
                }

                &.active {
                    color: rgb(1, 2, 3);
                }
            }
        `;
        attachment = Aurum.attach(
            <div class={style}>
                <div class="wrapper active">
                    <h1>Heading</h1>
                </div>
            </div>,
            document.getElementById('target')!
        );

        assert.equal(getComputedStyle(document.querySelector('.wrapper')!).color, 'rgb(1, 2, 3)');
        assert.equal(getComputedStyle(document.querySelector('h1')!).marginTop, '0px');
    });
});
