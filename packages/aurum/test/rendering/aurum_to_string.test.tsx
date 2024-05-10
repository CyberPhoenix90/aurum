import { ArrayDataSource, DataSource, aurumToString } from '../../src/aurumjs.js';
import { Aurum } from '../../src/utilities/aurum.js';
import { assert, describe, it } from 'vitest';

describe('Aurum To string', () => {
    it('Should render simple string', async () => {
        const result = await aurumToString(<a class="abc" id="bcd" href="test"></a>);
        assert.equal(result.replace(/'\n'/g, ''), '<a class="abc" id="bcd" href="test"></a>');
    });

    it('Should render nested', async () => {
        const result = await aurumToString(
            <a class="abc" id="bcd" href="test">
                <div></div>
            </a>
        );
        assert.equal(result.replace(/'\n'/g, ''), '<a class="abc" id="bcd" href="test"><div></div></a>');
    });

    it('Should render nested with text', async () => {
        const result = await aurumToString(
            <a class="abc" id="bcd" href="test">
                <div>test</div>
            </a>
        );

        assert.equal(result.replace(/'\n'/g, ''), '<a class="abc" id="bcd" href="test"><div>test</div></a>');
    });

    it('Should support structured styles', async () => {
        const result = await aurumToString(
            <a
                style={{
                    color: 'red',
                    backgroundColor: 'blue',
                    display: new DataSource('block')
                }}
            ></a>
        );

        assert.equal(result.replace(/'\n'/g, ''), '<a style="color:red;background-color:blue;display:block;"></a>');
    });

    it('Should support array data sources', async () => {
        const dataSource = new ArrayDataSource(['test', 'test2']);

        const result = await aurumToString(
            <a>
                <div>{dataSource}</div>
            </a>
        );

        assert.equal(result.replace(/'\n'/g, ''), '<a><div>testtest2</div></a>');
    });
});
