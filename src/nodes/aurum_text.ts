import { DataSource } from '../stream/data_source';
import { StringSource } from '../utilities/common';
import { ownerSymbol } from '../utilities/owner_symbol';

export class AurumTextElement {
	public node: HTMLElement | Text;
	private source: DataSource<string>;

	constructor(text?: StringSource) {
		this.node = this.create(text);

		if (text instanceof DataSource) {
			text.listen((v) => (this.node.textContent = v));
			this.source = text;
		}
	}

	protected resolveStringSource(source: StringSource): string {
		if (typeof source === 'string') {
			return source;
		} else {
			return source.value;
		}
	}

	protected create(text?: StringSource): Text {
		const node = document.createTextNode(this.resolveStringSource(text));
		node[ownerSymbol] = this;
		return node;
	}

	public remove(): void {
		if (this.hasParent()) {
			this.node.parentElement[ownerSymbol].removeChild(this.node);
		}
	}

	public hasParent(): boolean {
		return !!this.node.parentElement;
	}

	public dispose(): void {
		this.source?.cancelAll();
		delete this.node[ownerSymbol];
		delete this.node;
	}
}
