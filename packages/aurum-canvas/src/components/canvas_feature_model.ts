export interface AurumCanvasFeatures {
    mouseWheelZoom?: {
        zoomIncrements: number;
        maxZoom: number;
        minZoom: number;
    };
    panning?: {
        // minX?: number;
        // minY?: number;
        // maxX?: number;
        // maxY?: number;
        mouse: boolean;
        keyboard?: {
            upKeyCode: number;
            rightKeyCode: number;
            leftKeyCode: number;
            downKeyCode: number;
            pixelsPerFrame: number;
        };
    };
}
