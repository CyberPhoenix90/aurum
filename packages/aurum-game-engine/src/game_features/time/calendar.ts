import { Instant } from './instant';

export interface CalendarConfig {
    daysInAWeek: number;
    daysInAMonth: number[];
    monthsInAYear: number;
}

export class Calendar {
    private config: CalendarConfig;
    private _daysInAYear: number;

    constructor(config: CalendarConfig) {
        this.config = config;
        this._daysInAYear = 0;
        for (let i = 0; i < config.monthsInAYear; i++) {
            this._daysInAYear += config.daysInAMonth[i % config.daysInAMonth.length];
        }
    }

    public getDayOfTheWeek(moment: Instant): number {
        return moment.days % this.config.daysInAWeek;
    }

    public getDayOfTheMonth(moment: Instant): number {
        return this.getDayOfTheYear(moment) - this.getDayOfTheYearForStartOfMonth(this.getMonthOfTheYear(moment));
    }

    public getDayOfTheYearForStartOfMonth(monthNumber: number): number {
        if (monthNumber >= this.config.monthsInAYear) {
            throw new Error('out of bounds');
        }

        let total = 0;
        for (let i = 0; i < monthNumber; i++) {
            total += this.config.daysInAMonth[i % this.config.daysInAMonth.length];
        }
        return total;
    }

    public getDayOfTheYear(moment: Instant): number {
        return moment.days % this.daysInAYear();
    }

    public getWeek(moment: Instant): number {
        return Math.floor(moment.days / this.config.daysInAWeek);
    }

    public getMonth(moment: Instant): number {
        return this.getYear(moment) * this.config.monthsInAYear + this.getMonthOfTheYear(moment);
    }

    public getYear(moment: Instant): number {
        return Math.floor(moment.days / this.daysInAYear());
    }

    public getMonthOfTheYear(moment: Instant): number {
        let total = this.getDayOfTheYear(moment);
        for (let i = 0; i < this.config.monthsInAYear; i++) {
            if (total < this.config.daysInAMonth[i % this.config.daysInAMonth.length]) {
                return i;
            }
            total -= this.config.daysInAMonth[i % this.config.daysInAMonth.length];
        }
        throw new Error('unexpected state');
    }

    public getWeekOfTheYear(moment: Instant): number {
        return Math.floor(this.getDayOfTheYear(moment) / this.config.daysInAWeek);
    }

    public getWeekOfTheMonth(moment: Instant): number {
        return Math.floor(this.getDayOfTheMonth(moment) / 7);
    }

    public getDaysInCurrentMonth(moment): number {
        return this.config.daysInAMonth[this.getMonthOfTheYear(moment) % this.config.daysInAMonth.length];
    }

    public getPercentageOfTheWeek(moment: Instant): number {
        return this.getDayOfTheWeek(moment) / (this.config.daysInAWeek - 1);
    }

    public getPercentageOfTheMonth(moment: Instant): number {
        return this.getDayOfTheMonth(moment) / (this.getDaysInCurrentMonth(moment) - 1);
    }

    public getPercentageOfTheYear(moment: Instant): number {
        return this.getDayOfTheYear(moment) / (this._daysInAYear - 1);
    }

    public daysInAYear(): number {
        return this._daysInAYear;
    }
}
