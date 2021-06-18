export class ScreenHelper {
	public static PPI: number = typeof matchMedia === 'undefined' ? 0 : findFirstPositive((x) => matchMedia(`(max-resolution: ${x}dpi)`).matches);
}

function findFirstPositive(query): number {
	let a;
	const c = (d, e) => (e >= d ? ((a = d + (e - d) / 2), 0 < query(a) && (a == d || 0 >= query(a - 1)) ? a : 0 >= query(a) ? c(a + 1, e) : c(d, a - 1)) : -1);
	for (var i = 1; 0 >= query(i); ) i *= 2;
	return c(i / 2, i) | 0;
}
