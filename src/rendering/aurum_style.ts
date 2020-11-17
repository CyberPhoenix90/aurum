import { DataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
import { Stream } from '../stream/stream';
import { Aurum } from '../utilities/aurum';
import { CancellationToken } from '../utilities/cancellation_token';
import { Renderable } from './aurum_element';

/**
 * Generates a style tag with the provided style as content, supports data sources duplex data sources and streams instead of strings in the template.
 * Updates style content if any of the datasources used updates.
 */
export function css(fragments: TemplateStringsArray, ...input: any[]): Renderable {
	const result = new DataSource<string>();
	const token = new CancellationToken();
	for (const ins of input) {
		if (ins instanceof DataSource || ins instanceof DuplexDataSource || ins instanceof Stream) {
			ins.listen(() => result.update(recompute(fragments, input)), token);
		}
	}

	result.update(recompute(fragments, input));

	return Aurum.factory(
		'style',
		{
			onDetach: () => token.cancel()
		},
		result
	);
}

function recompute(fragments: TemplateStringsArray, input: any[]): string {
	let result = '';
	for (let i = 0; i < fragments.length; i++) {
		result += fragments[i];
		if (input[i]) {
			if (input[i] instanceof DataSource || input[i] instanceof DuplexDataSource || input[i] instanceof Stream) {
				result += input[i].value;
			} else {
				result += input[i];
			}
		}
	}

	return result;
}
