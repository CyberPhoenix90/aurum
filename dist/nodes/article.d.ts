import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface ArticleProps extends AurumElementProps {
    onAttach?: Callback<Article>;
    onDetach?: Callback<Article>;
    onCreate?: Callback<Article>;
    onDispose?: Callback<Article>;
}
export declare class Article extends AurumElement {
    constructor(props: ArticleProps);
}
//# sourceMappingURL=article.d.ts.map