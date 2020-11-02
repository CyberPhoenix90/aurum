import { CancellationToken } from './cancellation_token';

const animationCbs = [];
let looping = false;

export function registerAnimationLoop(callback: (time: number) => void, token: CancellationToken): void {
	animationCbs.push(callback);
	token.addCancelable(() => {
		animationCbs.splice(animationCbs.indexOf(callback), 1);
	});
	if (!looping) {
		looping = true;
		requestAnimationFrame(loop);
	}
}

function loop(time: number): void {
	for (const cb of animationCbs) {
		cb(time);
	}

	if (animationCbs.length === 0) {
		looping = false;
	}

	if (looping) {
		requestAnimationFrame(loop);
	}
}
