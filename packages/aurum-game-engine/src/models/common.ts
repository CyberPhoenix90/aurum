import { PointLike } from 'aurum-layout-engine';

export type MapLike<T> = { [key: string]: T };
export type Constructor<T> = new (...args: any[]) => T;
export type Projector = (p: PointLike) => PointLike;

export enum CARDINAL4 {
    NORTH = 'NORTH',
    EAST = 'EAST',
    SOUTH = 'SOUTH',
    WEST = 'WEST'
}

export enum SIDE {
    TOP = 'TOP',
    RIGHT = 'RIGHT',
    BOTTOM = 'BOTTOM',
    LEFT = 'LEFT'
}

export enum DIRECTION8 {
    UP = 'UP',
    UP_RIGHT = 'UP_RIGHT',
    RIGHT = 'RIGHT',
    DOWN_RIGHT = 'DOWN_RIGHT',
    DOWN = 'DOWN',
    DOWN_LEFT = 'DOWN_LEFT',
    LEFT = 'LEFT',
    UP_LEFT = 'UP_LEFT'
}

export enum DIRECTION9 {
    UP = 'UP',
    UP_RIGHT = 'UP_RIGHT',
    RIGHT = 'RIGHT',
    DOWN_RIGHT = 'DOWN_RIGHT',
    DOWN = 'DOWN',
    DOWN_LEFT = 'DOWN_LEFT',
    LEFT = 'LEFT',
    UP_LEFT = 'UP_LEFT',
    CENTER = 'CENTER'
}

export enum ROTATION_DIRECTION {
    CLOCKWISE = 'CLOCKWISE',
    ANTI_CLOCKWISE = 'ANTI_CLOCKWISE'
}
