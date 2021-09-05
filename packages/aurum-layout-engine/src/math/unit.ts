export enum UnitType {
	pixels,
	percent,
	mm,
	cm,
	in
}

const CHECK_PERCENT: RegExp = /^[-]?[0-9.]+\s?%$/;
const EXTRACT_VALUE: RegExp = /[-]?[0-9.]+/;
const CHECK_MM: RegExp = /^[-]?[0-9.]+\s?mm/;
const CHECK_CM: RegExp = /^[-]?[0-9.]+\s?cm/;
const CHECK_IN: RegExp = /^[-]?[0-9.]+\s?in/;
const CHECK_PIXEL: RegExp = /^[-]?[0-9.]+\s?px/;

export class Unit {
	public value: number;
	public type: UnitType;

	constructor(value: number | string, unit: UnitType = UnitType.pixels) {
		if (typeof value === 'string') {
			this.processStringValue(value);
		} else {
			this.processNumberValue(value, unit);
		}
	}

	public toString() {
		switch (this.type) {
			case UnitType.cm: {
				return `${this.value}cm`;
			}
			case UnitType.mm: {
				return `${this.value}mm`;
			}
			case UnitType.in: {
				return `${this.value}in`;
			}
			case UnitType.pixels: {
				return `${this.value}pc`;
			}
			case UnitType.percent: {
				return `${this.value}%`;
			}
		}
	}

	private processNumberValue(value: number, unit: UnitType): void {
		this.value = value;
		this.type = unit;
	}

	private static determinateUnitType(value): UnitType {
		if (CHECK_PIXEL.test(value)) {
			return UnitType.pixels;
		} else if (CHECK_PERCENT.test(value)) {
			return UnitType.percent;
		} else if (CHECK_MM.test(value)) {
			return UnitType.mm;
		} else if (CHECK_CM.test(value)) {
			return UnitType.cm;
		} else if (CHECK_IN.test(value)) {
			return UnitType.in;
		} else {
			return undefined;
		}
	}

	private processStringValue(value: string): void {
		this.type = Unit.determinateUnitType(value);

		if (this.type === undefined) {
			throw new Error(`unit type not specified or invalid for ${value}`);
		}

		const result: RegExpExecArray | null = EXTRACT_VALUE.exec(value);
		if (result === null) {
			throw new Error(`value ${value} could not be parsed`);
		} else {
			this.value = Number(result[0]);
		}
	}

	public static isValidUnit(text: string): boolean {
		return this.determinateUnitType(text) !== undefined;
	}

	public toPixels(dpi: number, parentSize: number): number {
		switch (this.type) {
			case UnitType.cm: {
				return (this.value / 2.54) * dpi;
			}
			case UnitType.mm: {
				return (this.value / 25.4) * dpi;
			}
			case UnitType.in: {
				return this.value * dpi;
			}
			case UnitType.pixels: {
				return this.value;
			}
			case UnitType.percent: {
				return this.value * parentSize * 0.01;
			}
			default:
				throw new Error('unknown type');
		}
	}
}
