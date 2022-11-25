import { css } from '@emotion/css';
import { aurumify, Button, currentTheme, MenuStrip } from 'aurum-components';
import { Aurum, AurumComponentAPI, DataSource, DefaultSwitchCase, dsFilter, dsMap, Renderable, Switch, SwitchCase } from 'aurumjs';
import { Modifiers, registerHotkey } from '../../../utils/hotkey_manager.js';
import { fileUrl } from '../../../utils/url.js';
import { dialogs } from '../../dialogs/dialogs.js';
import { AbstractEditorProps } from '../abstract.js';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.heading3FontSize, theme.baseFontColor, theme.themeColor2],
        (fontFamily, size, fontColor, color1) => css`
            .toolbar {
                z-index: 1;
                position: relative;
            }
            .centered {
                user-select: none;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100%;
            }
            background-color: ${color1};
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};
        `,
        lifecycleToken
    )
);

export interface AssetEditorProps extends AbstractEditorProps {}

export function AssetEditor(props: AssetEditorProps) {
    return (
        <div class={style}>
            <Switch state={props.input.diskPath.transform(dsMap((s) => s.split('.').slice(-1)[0]))}>
                <SwitchCase when="jpg">
                    <ImageEditor {...props}></ImageEditor>
                </SwitchCase>
                <SwitchCase when="bmp">
                    <ImageEditor {...props}></ImageEditor>
                </SwitchCase>
                <SwitchCase when="jpeg">
                    <ImageEditor {...props}></ImageEditor>
                </SwitchCase>
                <SwitchCase when="svg">
                    <ImageEditor {...props}></ImageEditor>
                </SwitchCase>
                <SwitchCase when="png">
                    <ImageEditor {...props}></ImageEditor>
                </SwitchCase>
                <SwitchCase when="mp3">
                    <SoundEditor {...props}></SoundEditor>
                </SwitchCase>
                <DefaultSwitchCase>
                    <div class="centered">Unsupported file type</div>
                </DefaultSwitchCase>
            </Switch>
        </div>
    );
}

export function SoundEditor(props: AssetEditorProps, children: Renderable[], api: AurumComponentAPI) {
    return (
        <div class="centered">
            <audio style="width:75%" controls src={props.input.diskPath.transform(dsMap(fileUrl))}></audio>
        </div>
    );
}

export function ImageEditor(props: AssetEditorProps, children: Renderable[], api: AurumComponentAPI) {
    registerHotkey('+', Modifiers.NONE, api.cancellationToken, () => {
        scale.update(Math.max(0.5, scale.value + 0.25));
    });
    registerHotkey('-', Modifiers.NONE, api.cancellationToken, () => {
        scale.update(scale.value - 0.25);
    });
    registerHotkey('0', Modifiers.NONE, api.cancellationToken, () => {
        scale.update(1);
    });
    const scale = new DataSource(1);

    return (
        <div>
            <MenuStrip class="toolbar" dialogSource={dialogs}>
                <Button onClick={() => scale.update(0.25)}>🔍25%</Button>
                <Button onClick={() => scale.update(0.5)}>🔍50%</Button>
                <Button onClick={() => scale.update(1)}>🔍100%</Button>
                <Button onClick={() => scale.update(2)}>🔍200%</Button>
                <Button onClick={() => scale.update(4)}>🔍400%</Button>
                <Button onClick={() => scale.update(Math.max(0.5, scale.value + 0.25))}>🔍+</Button>
                <Button onClick={() => scale.update(scale.value - 0.25)}>🔍-</Button>
            </MenuStrip>
            <div class="centered">
                <img
                    style={
                        scale.transform(
                            dsFilter((n) => n >= 0.25),
                            dsMap((s) => `transform:scale(${s})`)
                        ) as DataSource<string>
                    }
                    src={props.input.diskPath.transform(dsMap(fileUrl)) as DataSource<string>}
                ></img>
            </div>
        </div>
    );
}
