import { DomNodeCreator } from '../nodes/dom_adapter';
import { Aurum } from '../utilities/aurum';
import { AurumComponentAPI, createAPI, createRenderSession, Renderable, RenderSession } from './aurum_element';
import { DataSource } from '../stream/data_source';

export function Webcomponent<T>(
	config: {
		/**
		 * Name of the webcomponent, must be  lower case kebab case as required by the spec
		 */
		name: string;
		/**
		 * List of attributes of the web component that will be transformed into a data source that reflects the exact state of the attribute in the DOM no matter what changes the attirbute
		 */
		observedAttributes?: string[];
		shadowRootMode?: 'open' | 'closed';
		shadowRootDelegatesFocus?: boolean;
	},
	logic: (props: T, api: AurumComponentAPI) => Renderable
): (props: T, children: Renderable[], api: AurumComponentAPI) => Renderable {
	customElements.define(
		config.name,
		class extends HTMLElement {
			private api: AurumComponentAPI;
			private session: RenderSession;
			private props: any;

			constructor() {
				super();
				if (config.observedAttributes === undefined) {
					config.observedAttributes = [];
				}
				this.props = {};
				for (const attr of config.observedAttributes) {
					this.props[attr] = new DataSource();
				}
			}

			static get observedAttributes() {
				return config.observedAttributes;
			}

			public attributeChangedCallback(name, oldValue, newValue): void {
				if (oldValue !== newValue) {
					this.props[name].update(newValue);
				}
			}

			public connectedCallback(): void {
				const template = document.createDocumentFragment();
				this.session = createRenderSession();
				this.api = createAPI(this.session);
				const content = logic(this.props, this.api);

				for (const cb of this.session.attachCalls) {
					cb();
				}

				Aurum.attach(content, template as any);

				this.attachShadow({
					mode: config.shadowRootMode ?? 'open',
					delegatesFocus: config.shadowRootDelegatesFocus
				}).appendChild(template);
			}

			public disconnectedCallback(): void {
				this.session.sessionToken.cancel();
			}
		}
	);

	return DomNodeCreator(config.name, config.observedAttributes, undefined, (node, props) => {
		for (const key in props) {
			//@ts-ignore
			if (!(key in node.props)) {
				//@ts-ignore
				node.props[key] = props[key];
			}
		}
	});
}
