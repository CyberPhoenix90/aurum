import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource } from '../utilities/common';

export interface CanvasProps extends AurumElementProps {
	onAttach?: (node: Canvas) => void;
	onDettach?: (node: Canvas) => void;
	width?: StringSource;
	height?: StringSource;
}

export class Canvas extends AurumElement {
	constructor(props: CanvasProps) {
		super(props, 'canvas');
		this.bindProps(['width', 'height'], props);
	}
}
