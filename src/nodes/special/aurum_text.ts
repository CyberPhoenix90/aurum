import { DataSource } from '../../stream/data_source';
import { StringSource } from '../../utilities/common';
import { ownerSymbol } from '../../utilities/owner_symbol';

/**
 * @internal
 */
export class AurumTextElement {
	public node: Text;

	constructor(text?: StringSource) {
		this.node = this.create(text);

		if (text instanceof DataSource) {
			text.listen((v) => {
				if (this.node) {
					this.node.textContent = v;
				}
			});
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
}
