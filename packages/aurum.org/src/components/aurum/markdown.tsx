import { AurumElement, Aurum } from 'aurumjs';
import * as marked from 'marked';

export function Markdown(_, children): AurumElement {
	return (
		<div
			onAttach={(element) => {
				element.innerHTML = marked(children[0]);
			}}
		></div>
	);
}
