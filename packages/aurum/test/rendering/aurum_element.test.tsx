import { assert } from 'chai';
import * as sinon from 'sinon';
import { DataSource } from '../../src/stream/data_source.js';
import { Aurum } from '../../src/utilities/aurum.js';
import { CancellationToken } from '../../src/utilities/cancellation_token.js';
import { Switch, SwitchCase } from '../../src/builtin_components/switch.js';

describe('Aurum Element', () => {
    let attachToken: CancellationToken;

    let clock: sinon.SinonFakeTimers;
    beforeEach(() => {
        clock = sinon.useFakeTimers();
    });
    afterEach(() => {
        clock.uninstall();
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('Should be in DOM at onAttach', () => {
        return new Promise<void>((resolve) => {
            attachToken = Aurum.attach(
                <div
                    onAttach={(div) => {
                        assert(div.isConnected);
                        resolve();
                    }}
                ></div>,
                document.getElementById('target')
            );
        });
    });

    it('Should be in DOM at onAttach nested', () => {
        return new Promise<void>((resolve) => {
            attachToken = Aurum.attach(
                <div>
                    <div
                        onAttach={(div) => {
                            assert(div.isConnected);
                            resolve();
                        }}
                    ></div>
                </div>,
                document.getElementById('target')
            );
        });
    });

    it('Should not be in DOM at onDetach', () => {
        return new Promise<void>((resolve) => {
            attachToken = Aurum.attach(
                <div
                    onDetach={(div) => {
                        assert(!div.isConnected);
                        resolve();
                    }}
                ></div>,
                document.getElementById('target')
            );
            attachToken.cancel();
            attachToken = undefined;
        });
    });

    it('Should detach on removal', () => {
        const ds = new DataSource<boolean>(true);

        return new Promise<void>((resolve) => {
            attachToken = Aurum.attach(
                <div>
                    <Switch state={ds}>
                        <SwitchCase when={true}>
                            <div
                                onDetach={() => {
                                    resolve();
                                }}
                            ></div>
                        </SwitchCase>
                        <SwitchCase when={false}></SwitchCase>
                    </Switch>
                </div>,
                document.getElementById('target')
            );

            ds.update(false);
        });
    });
});
