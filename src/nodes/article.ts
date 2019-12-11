import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';

export interface ArticleProps extends AurumElementProps {
	onAttach?: Callback<Article>;
	onDetach?: Callback<Article>;
	onCreate?: Callback<Article>;
	onDispose?: Callback<Article>;
}

export class Article extends AurumElement {
	constructor(props: ArticleProps, children: ChildNode[]) {
		super(props, children, 'article');
	}
}
