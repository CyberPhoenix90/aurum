import { AurumElement, AurumElementProps, Template } from '../aurum_element';
import { MapLike } from '../../utilities/common';
import { DataSource } from '../../stream/data_source';

export interface SwitchProps<T = boolean> extends AurumElementProps {
	state: DataSource<T>;
	templateMap?: MapLike<Template<void>>;
	template?: Template<void>;
}

export class Switch<T = boolean> extends AurumElement {
	private lastValue: T;
	private firstRender = true;
	public templateMap: MapLike<Template<void>>;
	public template: Template<void>;

	constructor(props: SwitchProps<T>) {
		super(props, 'switch');

		this.templateMap = props.templateMap;
		this.renderSwitch(props.state.value);
		props.state.listen((data) => {
			this.renderSwitch(data);
		}, this.cancellationToken);
	}

	protected selectTemplate(ref: string): Template<void> {
		if (ref === undefined || ref === null) {
			return this.template;
		} else {
			return this.templateMap[ref] ?? this.template;
		}
	}

	protected renderSwitch(data: T): void {
		if (data !== this.lastValue || this.firstRender) {
			this.lastValue = data;
			this.firstRender = false;
			this.clearChildren();
			const template = this.selectTemplate(data?.toString());
			if (template) {
				const result = template.generate();
				this.addChild(result);
			}
		}
	}
}
