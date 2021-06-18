import { Aurum, aurumToString } from 'aurumjs';
import { existsSync, readFileSync } from 'fs';
import { IncomingMessage, Server, ServerResponse } from 'http';
import * as open from 'open';
import { join } from 'path';
import { ModuleKind, ScriptTarget, transpile } from 'typescript';
import { rootFolder } from '../root';
import { currentProject } from '../session/session';

class PlayTestSerer {
	private server: Server;

	constructor() {
		this.server = new Server((req: IncomingMessage, res: ServerResponse) => this.handleRequest(req, res));
		this.server.listen(2657);
	}

	private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const url = new URL(req.url, 'http://' + req.headers.host);
		res.setHeader('content-type', this.getMimeType(url.pathname));

		if (url.pathname === '/') {
			res.end(
				await aurumToString(
					<html>
						<head>
							<script src="node_modules/requirejs/require.js"></script>
							<script src="entry_point.js"></script>
						</head>
						<body style="margin:0; background-color:black;"></body>
					</html>
				)
			);
		} else if (url.pathname.startsWith('/node_modules')) {
			res.end(readFileSync(join(rootFolder, '../..', url.pathname), 'utf8'));
		} else if (url.pathname.startsWith('/sub_modules')) {
			res.end(readFileSync(join(rootFolder, url.pathname), 'utf8'));
		} else if (url.pathname.startsWith('/api/resource')) {
			const mimeType = this.getMimeType(url.searchParams.get('path'));
			res.setHeader('content-type', mimeType);
			if (mimeType.startsWith('text') || mimeType.startsWith('application')) {
				res.end(readFileSync(join(currentProject.value.folder, url.searchParams.get('path')), 'utf8'));
			} else {
				res.end(readFileSync(join(currentProject.value.folder, url.searchParams.get('path'))));
			}
		} else if (url.pathname.startsWith('/api/scene_code/')) {
			const path = url.pathname.substring('/api/scene_code/'.length) + 'on';
			res.setHeader('content-type', 'application/javascript');
			try {
				res.end(this.transpile(JSON.parse(readFileSync(join(currentProject.value.folder, path), 'utf8')).code, url.pathname));
			} catch {
				res.statusCode = 404;
				res.end('Not found');
			}
		} else {
			const file = join(rootFolder, '..', 'aurum-game-editor-play-test-client', 'dist', url.pathname);
			if (existsSync(file)) {
				res.end(readFileSync(file, 'utf8'));
			} else {
				res.statusCode = 404;
				res.end('Not found');
			}
		}
	}

	private transpile(code: string, url: string): string {
		let newName = url.split('/Scenes/')[1];
		newName = newName.substring(0, newName.length - 3) + '.tsx';
		return transpile(
			code,
			{
				module: ModuleKind.AMD,
				target: ScriptTarget.ESNext,
				inlineSourceMap: true,
				inlineSources: true
			},
			newName,
			[],
			url
		);
	}

	public open(scene?: string) {
		open('http://localhost:2657?scene=' + scene);
	}

	private getMimeType(path: string): string {
		if (path.endsWith('.html')) {
			return 'text/html';
		}

		if (path.endsWith('.js')) {
			return 'application/javascript';
		}

		if (path.endsWith('.mp3')) {
			return 'audio/mpeg';
		}

		if (path.endsWith('.json')) {
			return 'application/json';
		}

		if (path.endsWith('.jpg')) {
			return 'image/jpeg';
		}
		if (path.endsWith('.png')) {
			return 'image/png';
		}
		if (path.endsWith('.jpeg')) {
			return 'image/jpeg';
		}
		if (path.endsWith('.bmp')) {
			return 'image/bmp';
		}
		if (path.endsWith('.svg')) {
			return 'image/svg';
		}

		if (path === '/') {
			return 'text/html';
		}

		return 'text/plain';
	}
}

export const playTestSerer: PlayTestSerer = new PlayTestSerer();
