import { Aurum, AurumElement, Suspense } from 'aurumjs';
import { Markdown } from '../markdown';

export interface DocumentationPageProps {
	title: string;
	url: string;
}

export function MarkdownPage(props: DocumentationPageProps): AurumElement {
	return (
		<div class="page">
			<h2>{props.title}</h2>
			<br></br>
			<div>
				<Suspense fallback="Loading...">
					{fetch(props.url)
						.then((s) => s.text())
						.then((result) => (
							<Markdown>{result}</Markdown>
						))}
				</Suspense>
			</div>
		</div>
	);
}
