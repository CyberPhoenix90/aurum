import { exampleData, Examples } from '../examples';
import { Aurum, AurumElement } from 'aurumjs';

export function ExamplePage(): AurumElement {
	return (
		<div>
			<h2>Examples</h2>
			<br></br>
			<Examples examples={exampleData}></Examples>
		</div>
	);
}
