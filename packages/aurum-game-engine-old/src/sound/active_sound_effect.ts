import { SoundOptions } from './sound';

export class ActiveSoundEffect {
	private source: HTMLAudioElement;
	private options: SoundOptions;

	public get isInUse(): boolean {
		return !this.source.paused;
	}

	constructor(audio: HTMLAudioElement) {
		this.source = audio;
		this.source.onended = this.onEnd.bind(this);
	}

	public onEnd() {
		if (this.options.loop) {
			this.source.play();
		}
	}

	public stop(): void {
		this.source.pause();
		this.source.currentTime = 0;
	}

	public play(options: SoundOptions): void {
		this.options = options;
		this.source.volume = options.volume || 1;
		this.source.play();
	}
}
