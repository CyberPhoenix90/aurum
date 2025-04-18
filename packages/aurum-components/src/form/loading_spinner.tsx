import { css } from '@emotion/css';
import { Aurum, DataSource, ReadOnlyDataSource, Renderable, dsMap } from 'aurumjs';

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
        -webkit-animation: spin 2s linear infinite;
        animation: spin 2s linear infinite;

        @-webkit-keyframes spin {
            0% {
                -webkit-transform: rotate(0deg);
            }
            100% {
                -webkit-transform: rotate(360deg);
            }
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }
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
