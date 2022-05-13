class NumberFormatter {
	/**
	 * Used to format large numbers into readable strings such as 1000000 -> 1.00M or 1000000 -> 1e6
	 */
	public formatBigNumber({
		value,
		abbreviationProvider,
		formatGranularity = 3,
		minDigits = 4,
		decimals = 2
	}: {
		value: number;
		minDigits?: number;
		abbreviationProvider: (exponent: number) => string;
		formatGranularity?: number;
		decimals?: number;
		integer?: boolean;
	}): string {
		if (minDigits < 1) {
			minDigits = 1;
		}
		let negative: boolean = false;
		if (value < 0) {
			negative = true;
			value = -value;
		}
		let usedExponent = 0;
		if (value !== 0) {
			const exponent: number = Math.floor(Math.log10(value));
			usedExponent = Math.floor((exponent - (minDigits - 1)) / formatGranularity) * formatGranularity;

			if (usedExponent < 0) {
				usedExponent = 0;
			} else {
				value = value / 10 ** usedExponent;
			}
		}
		let result: string;
		if (usedExponent === 0) {
			result = value.toFixed(0);
		} else {
			result = value.toFixed(decimals);
		}

		if (negative) {
			return `-${result}${abbreviationProvider(usedExponent)}`;
		} else {
			return `${result}${abbreviationProvider(usedExponent)}`;
		}
	}
}

export const numberFormatter: NumberFormatter = new NumberFormatter();
