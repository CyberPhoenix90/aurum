import { Aurum, DataSource, dsMap } from 'aurumjs';
import { Terminal } from 'xterm';

export interface ConsoleComponentProps {
    width: DataSource<number>;
    height: DataSource<number>;
}

export function ConsoleComponent(props: ConsoleComponentProps) {
    const { width, height } = props;

    const cols = width.transform(dsMap((w) => Math.floor(w / 11)));
    const rows = height.transform(dsMap((h) => Math.floor(h / 20)));

    return (
        <div
            tabindex="0"
            class="console"
            style="width:100%;height:100%"
            onAttach={(div) => {
                const term = new Terminal({
                    cols: cols.value,
                    rows: rows.value
                });
                term.open(div);
                cols.listen(() => {
                    term.resize(cols.value, rows.value);
                });
                rows.listen(() => {
                    term.resize(cols.value, rows.value);
                });
            }}
        ></div>
    );
}
