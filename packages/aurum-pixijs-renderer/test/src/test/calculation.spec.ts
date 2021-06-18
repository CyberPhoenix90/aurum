import { Calculation } from 'aurum-game-engine';
const { assert } = chai;

describe('calculation', () => {
	it('ternary', () => {
		const calc = new Calculation(`(50% > 100px)? 100px : 50%`);
		assert.equal(calc.toPixels(0, 1000, 0), 100);
		assert.equal(calc.toPixels(0, 100, 0), 50);
	});

	it('Math.min', () => {
		const calc = new Calculation(`Math.min(10%, 50px)`);
		assert.equal(calc.toPixels(0, 1000, 0), 50);
		assert.equal(calc.toPixels(0, 100, 0), 10);
	});

	it('Math.max', () => {
		const calc = new Calculation(`Math.max(10%, 50px)`);
		assert.equal(calc.toPixels(0, 1000, 0), 100);
		assert.equal(calc.toPixels(0, 100, 0), 50);
	});

	it('Math.log2', () => {
		const calc = new Calculation(`Math.log2(75%)`);
		assert.equal(calc.toPixels(0, 1000, 0), Math.log2(750));
		assert.equal(calc.toPixels(0, 100, 0), Math.log2(75));
	});
});
