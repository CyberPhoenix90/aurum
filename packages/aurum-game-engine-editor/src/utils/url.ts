import { resolve } from 'path';

export function fileUrl(filePath: string): string {
	let pathName = resolve(filePath).replace(/\\/g, '/');

	// Windows drive letter must be prefixed with a slash
	if (pathName.length > 0 && pathName[0] !== '/') {
		pathName = '/' + pathName;
	}

	return encodeURI('file://' + pathName);
}
