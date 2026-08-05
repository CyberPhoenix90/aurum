import { Aurum, DataSource, ReadOnlyDataSource, Renderable, css, dsMap, keyframes } from '@aurum/html';

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

export function LoadingSpinner(props: { isLoading?: ReadOnlyDataSource<boolean>; message?: string; size?: number }): Renderable {
    let { isLoading, message } = props;

    if (isLoading == undefined) {
        isLoading = new DataSource(true);
    }

    const style = css`
        border: ${(props.size ?? 16) / 4}px solid #f3f3f3;
        border-radius: 50%;
        border-top: ${(props.size ?? 16) / 4}px solid #3498db;
        width: ${props.size ?? 16}px;
        height: ${props.size ?? 16}px;
        animation: ${spin} 2s linear infinite;
    `;
    return (
        <div>
            {isLoading.transform(
                dsMap((v) =>
                    v ? (
                        <>
                            <i
                                class={style}
                                style={{
                                    fontSize: '12px'
                                }}
                            ></i>
                            &nbsp; {message}
                        </>
                    ) : (
                        ''
                    )
                )
            )}
        </div>
    );
}
