import { DomNodeCreator } from '../nodes/dom_adapter';
import { AurumComponentAPI, Renderable, createAPI, RenderSession, createRenderSession } from './aurum_element';
import { Aurum } from '../utilities/aurum';

export function Webcomponent<T>(
	config: {
		name: string;
		properties: string[];
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

			constructor() {
				super();
			}

			private collectProps(): any {
				const result = {};
				for (const name of config.properties) {
					result[name] = this.getAttribute(name);
				}

				return result;
			}

			public connectedCallback(): void {
				const template = document.createDocumentFragment();
				this.session = createRenderSession();
				this.api = createAPI(this.session);
				const content = logic(this.collectProps(), this.api);

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

	return DomNodeCreator(config.name, config.properties);
}
