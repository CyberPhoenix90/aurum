export class Moment {
    protected _timestamp: number;

    constructor(time: number) {
        this._timestamp = time;
    }

    public get timestamp(): number {
        return this._timestamp;
    }

    public get days() {
        return Math.floor(this._timestamp / 86400000);
    }

    public get hours() {
        return Math.floor(this._timestamp / 3600000);
    }

    public get minutes() {
        return Math.floor(this._timestamp / 60000);
    }

    public get seconds() {
        return Math.floor(this._timestamp / 1000);
    }

    public get percentageOfDayOver(): number {
        return this.hourOfTheDay / 24;
    }

    public get percentageOfDayOverBase18(): number {
        return this.hourOfTheDayBase18 / 24;
    }

    /**
     * Hour of the day where 0 = 6 PM, meaning night is 0 to 11 and day is 12 to 23
     */
    public get hourOfTheDayBase18(): number {
        return (this.hours + 18) % 24;
    }

    /**
     * Minute of the day where 0 = 6:00 PM, meaning night is 0 to 719 and day is 720 to 1439
     */
    public get minuteOfTheDayBase18(): number {
        return (this.minutes + 1080) % 1440;
    }

    public get hourOfTheDay(): number {
        return this.hours % 24;
    }

    public get hourOfTheDay12(): number {
        return ((this.hours - 1) % 12) + 1;
    }

    public get isAM(): boolean {
        return this.hourOfTheDay < 12;
    }

    public get isPM(): boolean {
        return this.hourOfTheDay >= 12;
    }

    public get minuteOfTheHour(): number {
        return this.minutes % 60;
    }

    public get minuteOfTheDay(): number {
        return this.minutes % 1440;
    }

    public get secondOfTheMinute(): number {
        return this.seconds % 60;
    }

    public isSameDay(otherMoment: Moment): boolean {
        return this.days === otherMoment.days;
    }

    public isSameHourOfDay(otherMoment: Moment): boolean {
        return this.hourOfTheDay === otherMoment.hourOfTheDay;
    }
}
