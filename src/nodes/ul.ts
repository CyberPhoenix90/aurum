import { AurumElement, AurumElementProps } from './aurum_element';
import { Template } from './template';
import { ArrayDataSource } from '../stream/array_data_source';

export interface UlProps<T> extends AurumElementProps {
	onAttach?: (node: Ul) => void;
	templateDataSource?: ArrayDataSource<T> | T[];
	template?: Template<T>;
}

export class Ul<T = void> extends AurumElement {
	public node: HTMLInputElement;
	public template: Template<T>;
	public data: ArrayDataSource<T>;
	private rerenderPending: boolean;
	private cachedChildren: AurumElement[];

	constructor(props: UlProps<T>) {
		super(props);
		this.template = props.template;
		this.cachedChildren = [];
		this.handleData(props.templateDataSource);
	}

	private handleData(dataSource: ArrayDataSource<T> | T[]): void {
		if (dataSource instanceof ArrayDataSource) {
			this.data = dataSource;
		} else {
			this.data = new ArrayDataSource<T>(dataSource);
		}

		if (this.data.length) {
			this.cachedChildren.push(...(this.data as ArrayDataSource<T>).toArray().map((i) => this.template.generate(i)));
			this.render();
		}

		this.data.onChange.subscribe((change) => {
			switch (change.operation) {
				case 'append':
					this.cachedChildren.push(...change.items.map((i) => this.template.generate(i)));
					break;
				case 'removeLeft':
					this.cachedChildren.splice(0, change.count);
					break;
				case 'removeRight':
					this.cachedChildren.splice(this.node.childElementCount - change.count, change.count);
					break;
				case 'remove':
					this.cachedChildren.splice(change.index, change.count);
					break;
				default:
					this.cachedChildren.length = 0;
					this.cachedChildren.push(...(this.data as ArrayDataSource<T>).toArray().map((i) => this.template.generate(i)));
					break;
			}
			this.render();
		});
	}

	public render(): void {
		if (this.rerenderPending) {
			return;
		}

		setTimeout(() => {
			for (let i = 0; i < this.cachedChildren.length; i++) {
				if (this.node.childElementCount <= i) {
					this.addChildren(this.cachedChildren.slice(i, this.cachedChildren.length));
					break;
				}
				if (((this.node.children[i] as any).owner as AurumElement) !== this.cachedChildren[i]) {
					if (!this.cachedChildren.includes((this.node.children[i] as any).owner as AurumElement)) {
						this.node.children[i].remove();
						i--;
						continue;
					}

					const index = this.getChildIndex(this.cachedChildren[i].node);
					if (index !== -1) {
						this.swapChildren(i, index);
					} else {
						this.addChildAt(this.cachedChildren[i], i);
					}
				}
			}
			while (this.node.childElementCount > this.cachedChildren.length) {
				this.node.removeChild(this.node.lastChild);
			}
			// this.onUpdate.fire(this);
			this.rerenderPending = false;
		});
		this.rerenderPending = true;
	}

	public create(props: UlProps<T>): HTMLElement {
		const ul = document.createElement('ul');

		return ul;
	}
}
