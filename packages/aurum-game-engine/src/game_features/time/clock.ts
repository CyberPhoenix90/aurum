import { Instant } from './instant';
import { CancellationToken, DataSource } from 'aurumjs';
import { onBeforeRender } from '../../core/stage';

export interface ClockConfig {
    timestamp?: number;
    speed?: number;
    autoStart?: boolean;
}

export class Clock extends Instant {
    public speed: number;

    public hourSource: DataSource<number>;
    public minuteSource: DataSource<number>;
    public secondSource: DataSource<number>;
    public daySource: DataSource<number>;

    private cancelationToken: CancellationToken;
    private timeouts: Array<{ time: number; cb: () => void }>;
    private intervals: Array<{ next: number; delay: number; cb: () => void }>;

    constructor(config: ClockConfig) {
        let { speed = 0, autoStart = false, timestamp = 0 } = config;
        super(timestamp);
        this.speed = speed;
        this.intervals = [];
        this.timeouts = [];

        this.daySource = new DataSource();
        this.hourSource = new DataSource();
        this.minuteSource = new DataSource();
        this.secondSource = new DataSource();

        if (autoStart) {
            this.start();
        }
    }

    public getCurrentTimeAsMoment(): Instant {
        return new Instant(this.timestamp);
    }

    public start(): void {
        if (this.cancelationToken === undefined || this.cancelationToken.isCanceled) {
            this.cancelationToken = new CancellationToken();
            let lastTs = Date.now();
            onBeforeRender.subscribe(() => {
                const delta = Date.now() - lastTs;
                lastTs += delta;
                this.update(delta);
            }, this.cancelationToken);
        } else {
            throw new Error('clock started twice without stopping');
        }
    }

    public stop(): void {
        if (this.cancelationToken !== undefined) {
            this.cancelationToken.cancel();
        }
    }

    public setInterval(cb: () => void, time: number, cancellationToken?: CancellationToken): void {
        const entry = {
            next: this.timestamp + time,
            delay: time,
            cb
        };
        this.intervals.push(entry);
        if (cancellationToken) {
            cancellationToken.addCancelable(() => {
                if (this.intervals.includes(entry)) {
                    this.intervals.splice(this.intervals.indexOf(entry), 1);
                }
            });
        }
    }

    public setTimeout(cb: () => void, time: number, cancellationToken?: CancellationToken): void {
        const entry = {
            time: this.timestamp + time,
            cb
        };
        this.timeouts.push(entry);
        if (cancellationToken) {
            cancellationToken.addCancelable(() => {
                if (this.timeouts.includes(entry)) {
                    this.timeouts.splice(this.timeouts.indexOf(entry), 1);
                }
            });
        }
    }

    public update(delta: number): void {
        const second = Math.floor(this._timestamp / 1000);
        const minute = Math.floor(this._timestamp / 60000);
        const hour = Math.floor(this._timestamp / 3600000);
        const day = Math.floor(this._timestamp / (3600000 * 24));

        this._timestamp += delta * this.speed;

        const newSecond = Math.floor(this._timestamp / 1000);
        const newMinute = Math.floor(this._timestamp / 60000);
        const newHour = Math.floor(this._timestamp / 3600000);
        const newDay = Math.floor(this._timestamp / (3600000 * 24));

        for (let i = this.timeouts.length - 1; i >= 0; i--) {
            if (this.timeouts[i].time <= this.timestamp) {
                try {
                    this.timeouts[i].cb();
                } catch (e) {
                    console.error(e);
                }
                this.timeouts.splice(i, 1);
            }
        }

        for (let i = this.intervals.length - 1; i >= 0; i--) {
            if (this.intervals[i].next <= this.timestamp) {
                this.intervals[i].next = this.timestamp + this.intervals[i].delay;
                try {
                    this.intervals[i].cb();
                } catch (e) {
                    console.error(e);
                }
            }
        }

        if (newSecond != second) {
            this.secondSource.update(this.secondOfTheMinute);
        }

        if (newMinute != minute) {
            this.minuteSource.update(this.minuteOfTheHour);
        }

        if (newHour != hour) {
            this.hourSource.update(this.hourOfTheDay);
        }

        if (newDay !== day) {
            this.daySource.update(this.days);
        }
    }
}
