import { AttributeValue, Aurum, AurumElementModel, CancellationToken, ClassType, combineClass, DataSource, dsMap, DuplexDataSource, Renderable } from 'aurumjs';

export type SizeTypes = DataSource<number> | DuplexDataSource<number> | number;
export interface PanelElementProps {
    class?: ClassType;
    size?: SizeTypes;
    minSize?: SizeTypes;
    maxSize?: SizeTypes;
    resizable?: boolean;
}

export function renderBottomDock(
    model: AurumElementModel<PanelElementProps>,
    size: DataSource<number> | DuplexDataSource<number>,
    minSize: DataSource<number> | DuplexDataSource<number>,
    maxSize: DataSource<number> | DuplexDataSource<number>,
    leftDockSize: DataSource<number> | DuplexDataSource<number>,
    rightDockSize: DataSource<number> | DuplexDataSource<number>,
    className: any,
    dragHandleThickness: number = 2
) {
    return (
        <div
            class={combineClass(
                model.props.class,
                className({
                    ['bottom-dock']: true,
                    resizable: model.props.resizable
                })
            )}
            style={size.aggregate(
                [leftDockSize, rightDockSize],
                (size, leftSize, rightSize) => `width:calc(100% - ${leftSize}px - ${rightSize}px); height:${size}px`
            )}
        >
            {model.props.resizable ? (
                <div onMouseDown={(e) => horizontalDragStart(e, size, minSize, maxSize, -1, dragHandleThickness)} class="horizontal-handle"></div>
            ) : undefined}

            {model.children}
        </div>
    );
}

export function renderTopDock(
    model: AurumElementModel<PanelElementProps>,
    size: DataSource<number> | DuplexDataSource<number>,
    minSize: DataSource<number> | DuplexDataSource<number>,
    maxSize: DataSource<number> | DuplexDataSource<number>,
    leftDockSize: DataSource<number> | DuplexDataSource<number>,
    rightDockSize: DataSource<number> | DuplexDataSource<number>,
    className: any,
    dragHandleThickness: number = 2
) {
    return (
        <div
            class={combineClass(
                model.props.class,
                className({
                    ['top-dock']: true,
                    resizable: model.props.resizable
                })
            )}
            style={size.aggregate(
                [leftDockSize, rightDockSize],
                (topSize, leftSize, rightSize) => `width:calc(100% - ${leftSize}px - ${rightSize}px); height:${topSize}px`
            )}
        >
            {model.children}
        </div>
    );
}

export function renderLeftDock(
    model: AurumElementModel<PanelElementProps>,
    size: DataSource<number> | DuplexDataSource<number>,
    minSize: DataSource<number> | DuplexDataSource<number>,
    maxSize: DataSource<number> | DuplexDataSource<number>,
    className: any,
    dragHandleThickness: number = 2
): Renderable[] {
    const result = [];

    result.push(
        <div
            class={combineClass(
                model.props.class,
                className({
                    ['left-dock']: true,
                    resizable: model.props.resizable
                })
            )}
            style={size.transform(dsMap((s) => `height:100%; width:${model.props.resizable ? s - dragHandleThickness : s}px`)) as DataSource<string>}
        >
            {model.children}
        </div>
    );

    if (model.props.resizable) {
        result.push(
            <div onMouseDown={(e) => verticalDragStart(e, size, minSize, maxSize, 1, dragHandleThickness)} class="vertical-handle" style="float:left"></div>
        );
    }

    return result;
}

export function renderRightDock(
    model: AurumElementModel<PanelElementProps>,
    size: DataSource<number> | DuplexDataSource<number>,
    minSize: DataSource<number> | DuplexDataSource<number>,
    maxSize: DataSource<number> | DuplexDataSource<number>,
    className: any,
    dragHandleThickness: number = 2
): Renderable[] {
    const result = [];

    result.push(
        <div
            class={combineClass(
                model.props.class,
                className({
                    ['right-dock']: true,
                    resizable: model.props.resizable
                })
            )}
            style={size.transform(dsMap((s) => `height:100%; width:${model.props.resizable ? s - 4 : s}px`)) as DataSource<string>}
        >
            {model.children}
        </div>
    );

    if (model.props.resizable) {
        result.push(<div onMouseDown={(e) => verticalDragStart(e, size, minSize, maxSize, -1)} class="vertical-handle" style="float:right"></div>);
    }

    return result;
}

export function PanelDockLeft(props: PanelElementProps, children: ChildNode[]): Renderable {
    return undefined;
}
export function PanelDockTop(props: PanelElementProps, children: ChildNode[]): Renderable {
    return undefined;
}
export function PanelDockRight(props: PanelElementProps, children: ChildNode[]): Renderable {
    return undefined;
}
export function PanelDockBottom(props: PanelElementProps, children: ChildNode[]): Renderable {
    return undefined;
}
export function PanelContent(props: { class?: ClassType; style?: AttributeValue }, children: ChildNode[]): Renderable {
    return undefined;
}

let dragStartPos: number;
let dragSizeInitial: number;
let dragToken: CancellationToken;

function verticalDragStart(
    e: MouseEvent,
    size: DataSource<number> | DuplexDataSource<number>,
    minSize: DataSource<number> | DuplexDataSource<number>,
    maxSize: DataSource<number> | DuplexDataSource<number>,
    orientation: number,
    dragHandleThickness: number = 2
): void {
    if (dragToken && !dragToken.isCanceled) {
        dragEnd();
    }
    dragStartPos = e.pageX;
    dragSizeInitial = size.value;
    dragToken = new CancellationToken();
    dragToken.registerDomEvent(window, 'mousemove', (event: MouseEvent) => {
        event.preventDefault();
        if (size instanceof DuplexDataSource) {
            size.updateUpstream(
                Math.min(maxSize.value, Math.max(dragHandleThickness, minSize.value, dragSizeInitial + orientation * (event.pageX - dragStartPos)))
            );
        } else {
            size.update(Math.min(maxSize.value, Math.max(dragHandleThickness, minSize.value, dragSizeInitial + orientation * (event.pageX - dragStartPos))));
        }
    });
    dragToken.registerDomEvent(window, 'mouseup', (event: MouseEvent) => {
        dragEnd();
    });
}

function dragEnd(): void {
    dragToken.cancel();
}

function horizontalDragStart(
    e: MouseEvent,
    size: DataSource<number> | DuplexDataSource<number>,
    minSize: DataSource<number> | DuplexDataSource<number>,
    maxSize: DataSource<number> | DuplexDataSource<number>,
    orientation: number,
    dragHandleThickness: number = 2
): void {
    if (dragToken && !dragToken.isCanceled) {
        dragEnd();
    }
    dragStartPos = e.pageY;
    dragSizeInitial = size.value;
    dragToken = new CancellationToken();
    dragToken.registerDomEvent(window, 'mousemove', (event: MouseEvent) => {
        event.preventDefault();
        if (size instanceof DuplexDataSource) {
            size.updateUpstream(
                Math.min(maxSize.value, Math.max(dragHandleThickness, minSize.value, dragSizeInitial + orientation * (event.pageY - dragStartPos)))
            );
        } else {
            size.update(Math.min(maxSize.value, Math.max(dragHandleThickness, minSize.value, dragSizeInitial + orientation * (event.pageY - dragStartPos))));
        }
    });
    dragToken.registerDomEvent(window, 'mouseup', (event: MouseEvent) => {
        dragEnd();
    });
}
