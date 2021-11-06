import { ArrayDataSource, DataSource } from 'aurumjs';
import { AbstractLayout } from './layouts/abstract_layout';

export type Radian = number;
export type Degrees = number;

export enum DIRECTION2 {
    HORIZONTAL = 'HORIZONTAL',
    VERTICAL = 'VERTICAL'
}

export enum REFOWDIRECTION {
    BIDIRECTIONAL = 'BIDIRECTIONAL',
    DOWNWARDS = 'DOWNWARDS',
    UPWARDS = 'UPWARDS'
}

export enum DIRECTION4 {
    UP = 'UP',
    RIGHT = 'RIGHT',
    DOWN = 'DOWN',
    LEFT = 'LEFT'
}

export type ReflowEvent = 'onChildAdded' | 'onChildRemoved' | 'onChildMoved' | 'onChildResized' | 'onChildSwapped' | 'onParentResized' | 'onLayoutChanged';

export interface LayoutData {
    x: DataSource<number>;
    y: DataSource<number>;
    innerWidth: DataSource<number>;
    innerHeight: DataSource<number>;
    outerWidth: DataSource<number>;
    outerHeight: DataSource<number>;
    reflowEventListener: Set<ReflowEvent>;
}

export interface LayoutElementTreeNode {
    x: DataSource<Position>;
    y: DataSource<Position>;
    layout: DataSource<AbstractLayout>;
    width: DataSource<Size>;
    height: DataSource<Size>;
    marginTop: DataSource<number>;
    marginRight: DataSource<number>;
    marginBottom: DataSource<number>;
    marginLeft: DataSource<number>;
    originX: DataSource<number>;
    originY: DataSource<number>;
    parent: DataSource<LayoutElementTreeNode>;
    children: ArrayDataSource<LayoutElementTreeNode>;
}

export type Position = number | string;
export type Size = number | string | 'content' | 'inherit' | 'remainder';
