import { AProps } from './nodes/a';
import { AbbrProps } from './nodes/abbr';
import { AreaProps } from './nodes/area';
import { ArticleProps } from './nodes/article';
import { AsideProps } from './nodes/aside';
import { AudioProps } from './nodes/audio';
import { TemplateProps } from './nodes/special/aurum_element';
import { BProps } from './nodes/b';
import { BrProps } from './nodes/br';
import { ButtonProps } from './nodes/button';
import { CanvasProps } from './nodes/canvas';
import { DataProps } from './nodes/data';
import { DetailsProps } from './nodes/details';
import { DivProps } from './nodes/div';
import { EmProps } from './nodes/em';
import { FooterProps } from './nodes/footer';
import { FormProps } from './nodes/form';
import { H1Props } from './nodes/h1';
import { H2Props } from './nodes/h2';
import { H3Props } from './nodes/h3';
import { H4Props } from './nodes/h4';
import { H5Props } from './nodes/h5';
import { H6Props } from './nodes/h6';
import { HeaderProps } from './nodes/header';
import { HeadingProps } from './nodes/heading';
import { IProps } from './nodes/i';
import { IFrameProps } from './nodes/iframe';
import { ImgProps } from './nodes/img';
import { InputProps } from './nodes/input';
import { LabelProps } from './nodes/label';
import { LiProps } from './nodes/li';
import { LinkProps } from './nodes/link';
import { NavProps } from './nodes/nav';
import { NoScriptProps } from './nodes/noscript';
import { OlProps } from './nodes/ol';
import { OptionProps } from './nodes/option';
import { PProps } from './nodes/p';
import { PreProps } from './nodes/pre';
import { ProgressProps } from './nodes/progress';
import { QProps } from './nodes/q';
import { ScriptProps } from './nodes/script';
import { SelectProps } from './nodes/select';
import { SourceProps } from './nodes/source';
import { SpanProps } from './nodes/span';
import { SubProps } from './nodes/sub';
import { SummaryProps } from './nodes/summary';
import { SupProps } from './nodes/sup';
import { SvgProps } from './nodes/svg';
import { TableProps } from './nodes/table';
import { TbodyProps } from './nodes/tbody';
import { TdProps } from './nodes/td';
import { TextAreaProps } from './nodes/textarea';
import { TfootProps } from './nodes/tfoot';
import { ThProps } from './nodes/th';
import { TheadProps } from './nodes/thead';
import { TimeProps } from './nodes/time';
import { TitleProps } from './nodes/title';
import { TrProps } from './nodes/tr';
import { UlProps } from './nodes/ul';
import { VideoProps } from './nodes/video';
import { StyleProps } from './nodes/style';
import { BodyProps } from './nodes/body';
import { HeadProps } from './nodes/head';
export * from './nodes/a';
export * from './nodes/abbr';
export * from './nodes/area';
export * from './nodes/article';
export * from './nodes/aside';
export * from './nodes/audio';
export * from './nodes/special/aurum_element';
export * from './nodes/b';
export * from './nodes/br';
export * from './nodes/button';
export * from './nodes/canvas';
export * from './nodes/data';
export * from './nodes/details';
export * from './nodes/div';
export * from './nodes/em';
export * from './nodes/footer';
export * from './nodes/form';
export * from './nodes/h1';
export * from './nodes/h2';
export * from './nodes/h3';
export * from './nodes/h4';
export * from './nodes/h5';
export * from './nodes/h6';
export * from './nodes/header';
export * from './nodes/heading';
export * from './nodes/i';
export * from './nodes/iframe';
export * from './nodes/img';
export * from './nodes/input';
export * from './nodes/label';
export * from './nodes/li';
export * from './nodes/link';
export * from './nodes/nav';
export * from './nodes/noscript';
export * from './nodes/ol';
export * from './nodes/option';
export * from './nodes/p';
export * from './nodes/pre';
export * from './nodes/progress';
export * from './nodes/q';
export * from './nodes/script';
export * from './nodes/select';
export * from './nodes/source';
export * from './nodes/span';
export * from './nodes/style';
export * from './nodes/sub';
export * from './nodes/summary';
export * from './nodes/sup';
export * from './nodes/svg';
export * from './nodes/table';
export * from './nodes/tbody';
export * from './nodes/td';
export * from './nodes/textarea';
export * from './nodes/tfoot';
export * from './nodes/th';
export * from './nodes/thead';
export * from './nodes/time';
export * from './nodes/title';
export * from './nodes/tr';
export * from './nodes/ul';
export * from './nodes/video';
export * from './nodes/body';
export * from './nodes/head';
export * from './stream/data_source';
export * from './stream/object_data_source';
export * from './utilities/aurum';
export * from './utilities/cancellation_token';
export * from './nodes/special/custom';
export * from './nodes/special/router';
export * from './nodes/special/suspense';
export * from './nodes/special/switch';
declare global {
    namespace JSX {
        interface IntrinsicElements {
            button: ButtonProps;
            div: DivProps;
            input: InputProps;
            li: LiProps;
            span: SpanProps;
            style: StyleProps;
            ul: UlProps;
            p: PProps;
            img: ImgProps;
            link: LinkProps;
            canvas: CanvasProps;
            a: AProps;
            article: ArticleProps;
            br: BrProps;
            form: FormProps;
            label: LabelProps;
            ol: OlProps;
            pre: PreProps;
            progress: ProgressProps;
            table: TableProps;
            td: TdProps;
            tr: TrProps;
            th: ThProps;
            textarea: TextAreaProps;
            h1: H1Props;
            h2: H2Props;
            h3: H3Props;
            h4: H4Props;
            h5: H5Props;
            h6: H6Props;
            header: HeaderProps;
            footer: FooterProps;
            nav: NavProps;
            b: BProps;
            i: IProps;
            script: ScriptProps;
            abbr: AbbrProps;
            area: AreaProps;
            aside: AsideProps;
            audio: AudioProps;
            em: EmProps;
            heading: HeadingProps;
            iframe: IFrameProps;
            noscript: NoScriptProps;
            option: OptionProps;
            q: QProps;
            select: SelectProps;
            source: SourceProps;
            title: TitleProps;
            video: VideoProps;
            tbody: TbodyProps;
            tfoot: TfootProps;
            thead: TheadProps;
            summary: SummaryProps;
            details: DetailsProps;
            sub: SubProps;
            sup: SupProps;
            svg: SvgProps;
            data: DataProps;
            time: TimeProps;
            body: BodyProps;
            head: HeadProps;
            template: TemplateProps<any>;
        }
    }
}
//# sourceMappingURL=aurum.d.ts.map