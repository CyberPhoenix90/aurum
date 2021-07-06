import { AurumComponentAPI, DataSource, dsMap, dsPipe, getValueOf, ReadOnlyDataSource, Renderable } from 'aurumjs';

export function Currency(
    props: { currency: string; amount: number | ReadOnlyDataSource<number>; locale?: string },
    children: Renderable[],
    api: AurumComponentAPI
): Renderable {
    const result = new DataSource(formatMoney(getValueOf(props.amount), props.currency, props.locale));
    if (typeof props.amount === 'object') {
        props.amount.transform(
            dsMap((amount) => formatMoney(amount, props.currency, props.locale)),
            dsPipe(result)
        );
    }

    return result;
}

function formatMoney(amount: number, currency: string, locale: string = navigator.language): string {
    return amount.toLocaleString(locale, {
        currency,
        style: 'currency'
    });
}
