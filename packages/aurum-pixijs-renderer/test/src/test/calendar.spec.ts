import { Calendar, Moment } from 'aurum-game-engine';
const { assert } = chai;

describe('calendar', () => {
	it('getDayOfTheYear', () => {
		const calendar = new Calendar({
			daysInAMonth: [31, 30],
			daysInAWeek: 7,
			monthsInAYear: 4
		});

		assert(calendar.getDayOfTheYear(new Moment(0)) === 0);
		assert(calendar.getDayOfTheYear(new Moment(24 * 60 * 60 * 1000)) === 1);
	});

	it('getMonth', () => {
		const calendar = new Calendar({
			daysInAMonth: [31, 30],
			daysInAWeek: 7,
			monthsInAYear: 4
		});

		assert(calendar.getMonth(new Moment(24 * 60 * 60 * 1000)) === 0);
		assert(calendar.getMonth(new Moment(30 * 24 * 60 * 60 * 1000)) === 0);
		assert(calendar.getMonth(new Moment(31 * 24 * 60 * 60 * 1000)) === 1);
	});

	it('hour of day', () => {
		assert(new Moment(0).hourOfTheDay === 0);
		assert(new Moment(60 * 60 * 1000).hourOfTheDay === 1);
		assert(new Moment(12 * 60 * 60 * 1000).hourOfTheDay === 12);
		assert(new Moment(36 * 60 * 60 * 1000).hourOfTheDay === 12);
	});

	it('hour of day base 18', () => {
		assert(new Moment(0).hourOfTheDayBase18 === 18);
		assert(new Moment(60 * 60 * 1000).hourOfTheDayBase18 === 19);
		assert(new Moment(6 * 60 * 60 * 1000).hourOfTheDayBase18 === 0);
		assert(new Moment(12 * 60 * 60 * 1000).hourOfTheDayBase18 === 6);
		assert(new Moment(36 * 60 * 60 * 1000).hourOfTheDayBase18 === 6);
	});

	it('minute of day', () => {
		assert(new Moment(0).minuteOfTheDay === 0);
		assert(new Moment(60 * 1000).minuteOfTheDay === 1);
		assert(new Moment(12 * 60 * 1000).minuteOfTheDay === 12);
		assert(new Moment(72 * 60 * 1000).minuteOfTheDay === 72);
	});

	it('minute of day base 18', () => {
		assert(new Moment(0).minuteOfTheDayBase18 === 1080);
		assert(new Moment(60 * 1000).minuteOfTheDayBase18 === 1081);
		assert(new Moment(12 * 60 * 1000).minuteOfTheDayBase18 === 1092);
		assert(new Moment(72 * 60 * 1000).minuteOfTheDayBase18 === 1152);
	});
});
