import { css } from '@emotion/css';
import { Button, FloatingWindow, WindowContent, WindowTitle } from 'aurum-components';
import { Aurum } from 'aurumjs';
import { popups } from '../popups/popups';

export interface AboutPopupProps {}

const style = css`
	margin: 12px;
	width: 100%;

	.content {
		height: calc(100% - 54px);
	}

	.footer {
		display: flex;
		float: right;
		> * {
			margin-left: 16px;
		}
	}
`;

export function AboutPopup(props: AboutPopupProps) {
	return (
		<FloatingWindow
			closable
			onClose={() => popups.remove(this)}
			draggable
			x={window.innerWidth / 2 - 250}
			y={window.innerHeight / 2 - 200}
			w={500}
			h={400}
			id="Project Creation"
		>
			<WindowTitle>About Aurum Engine Editor</WindowTitle>
			<WindowContent>
				<div class={style}>
					<div class="content">
						<p>Aurum Engine Editor by CyberPhoenix90</p>
						<p>Key technologies:</p>
						<p>V8, Electron</p>
						<p>Aurumjs</p>
						<p>Aurum Components</p>
						<p>Aurumjs game engine</p>
						<p>Emotion css</p>
					</div>
					<div class="footer">
						<Button onClick={() => popups.remove(this)}>Close</Button>
					</div>
				</div>
			</WindowContent>
		</FloatingWindow>
	);
}
