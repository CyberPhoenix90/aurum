import { AurumElement, AurumElementProps } from './aurum_element';
export interface ArticleProps extends AurumElementProps {
    onAttach?: (node: Article) => void;
    onDettach?: (node: Article) => void;
}
export declare class Article extends AurumElement {
    constructor(props: ArticleProps);
}
//# sourceMappingURL=article.d.ts.map