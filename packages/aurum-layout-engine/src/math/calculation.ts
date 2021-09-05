import { Unit, UnitType } from './unit';

const CALCULATION_PARSER = /(content|inherit|[0-9]+px|[0-9]+%|[0-9]+mm|[0-9]+cm|[0-9]+in)+/gi;

export class Calculation {
    private optimizedCalculation: (dpi: number, parentSize: number, computeContentSize?: () => number) => number;

    constructor(value: string) {
        this.parse(value);
    }

    public static isCalculation(input: string): boolean {
        if (
            input.includes('-') ||
            input.includes('+') ||
            input.includes('*') ||
            input.includes('/') ||
            input.includes('%') ||
            (input.includes('(') && input.includes(')'))
        ) {
            return true;
        }

        return false;
    }

    private parse(value: string) {
        try {
            this.optimizedCalculation = new Function(
                'dpi',
                'parentSize',
                'computeContentSize',
                `return ${value.replace(CALCULATION_PARSER, (op) => {
                    if (op === 'inherit') {
                        return 'parentSize';
                    } else if (op === 'content') {
                        return 'computeContentSize()';
                    } else {
                        const unit = new Unit(op);
                        switch (unit.type) {
                            case UnitType.cm:
                                return `${unit.value / 2.54}*dpi`;
                            case UnitType.in:
                                return `${unit.value}*dpi`;
                            case UnitType.mm:
                                return `${unit.value / 25.4}*dpi`;
                            case UnitType.percent:
                                return `${unit.value * 0.01}*parentSize`;
                            case UnitType.pixels:
                                return unit.value.toString();
                        }
                    }
                })}`
            ) as any;
        } catch (e) {
            console.error(e);
            this.optimizedCalculation = () => 0;
        }
    }

    public toPixels(dpi: number, parentSize: number, computeContentSize?: () => number): number {
        return this.optimizedCalculation(dpi, parentSize, computeContentSize);
    }
}
