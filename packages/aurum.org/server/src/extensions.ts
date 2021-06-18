import { existsSync } from 'fs';
import { mkdirSync, copyFileSync } from 'fs';
import Module = require('module');
import { parse, join } from 'path';
import { render } from 'less';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { watchFile } from 'fs';

require.extensions['.less'] = (m: Module, filename: string) => {
    const parsed = parse(filename);
    const targetFolder = join(__dirname, '../../dist/static/style/');

    if (!existsSync(targetFolder)) {
        mkdirSync(targetFolder);
    }

    m.exports = join('./static/style', parsed.name + '.css');

    watchFile(filename, () => {
        console.log(`Change detected in ${filename}`);
        render(readFileSync(filename, 'utf8')).then((lessCss) => {
            console.log(`${filename} compiled!`);
            writeFileSync(
                join(targetFolder, parsed.name + '.css'),
                lessCss.css
            );
        });
    });
    render(readFileSync(filename, 'utf8')).then((lessCss) => {
        writeFileSync(join(targetFolder, parsed.name + '.css'), lessCss.css);
    });
};

require.extensions['.png'] = (m: Module, filename: string) => {
    const parsed = parse(filename);
    const targetFolder = join(__dirname, '../../dist/static/images/');

    if (!existsSync(targetFolder)) {
        mkdirSync(targetFolder);
    }
    copyFileSync(filename, join(targetFolder, parsed.base));
    m.exports = join('./static/images', parsed.base);
};

require.extensions['.jpg'] = require.extensions['.png'];
require.extensions['.gif'] = require.extensions['.png'];
