import { urlHashEmitter, urlPathEmitter } from '../stream/emitters.js';
import { MapLike } from './common.js';

export class UrlStorage implements Storage {
    private state: MapLike<string>;
    private originalReplaceState: (data: any, unused: string, url?: string | URL) => void;
    private updating: boolean = false;

    constructor() {
        this.state = {};
        this.observeUrl();
        urlHashEmitter(() => this.checkUpdate());
        this.checkUpdate();
    }

    private observeUrl(): void {
        this.originalReplaceState = history.replaceState.bind(history);
        urlPathEmitter(() => {
            this.checkUpdate();
        });
    }

    public get length(): number {
        return Object.keys(this.state).length;
    }

    public clear(): void {
        this.state = {};
        this.applyStateToUrl();
    }
    public getItem(key: string): string {
        return this.state[key];
    }
    public key(index: number): string {
        return Object.keys(this.state)[index];
    }
    public removeItem(key: string): void {
        delete this.state[key];
        if (!this.updating) {
            this.applyStateToUrl();
        }
    }
    public setItem(key: string, value: string): void {
        this.state[key] = value;
        if (!this.updating) {
            this.applyStateToUrl();
        }
    }
    private applyStateToUrl() {
        // Take the state and turn it into a parameter string and set it as the url
        const url = new URL(location.href);
        for (const param of url.searchParams.entries()) {
            url.searchParams.delete(param[0]);
        }
        for (const key in this.state) {
            url.searchParams.set(key, this.state[key]);
        }

        this.originalReplaceState({}, '', url.href);
    }

    /**
     * For url changes that are not observable such as parent window changes
     */
    public refresh(): void {
        this.checkUpdate();
    }

    private checkUpdate(): void {
        const result = Object.fromEntries(new URL(location.href).searchParams);
        this.updating = true;
        try {
            for (const key in result) {
                if (result[key] !== this.state[key]) {
                    this.setItem(key, result[key]);
                }
            }

            for (const key in this.state) {
                if (result[key] === undefined) {
                    this.removeItem(key);
                }
            }
        } finally {
            this.updating = false;
        }
    }
}
