import { AurumElement, AurumElementProps } from './aurum_element';

export interface ArticleProps extends AurumElementProps {
	onAttach?: (node: Article) => void;
	onDettach?: (node: Article) => void;
}

export class Article extends AurumElement {
	constructor(props: ArticleProps) {
		super(props, 'pre');
	}
}
