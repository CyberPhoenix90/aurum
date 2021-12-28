import { AurumElementModel, createAPI } from '../rendering/aurum_element.js';
import { ArrayDataSource, DataSource } from '../stream/data_source.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { CancellationToken } from '../utilities/cancellation_token.js';

export async function aurumToString(content: any): Promise<string> {
    if (content === undefined || content === null) {
        return '';
    }

    if (Array.isArray(content)) {
        const result = [];
        for (const item of content) {
            result.push(await aurumToString(item));
        }
        return result.join('');
    }

    if (content instanceof Promise) {
        return aurumToString(await content);
    }

    if (['number', 'string', 'bigint', 'boolean'].includes(typeof content)) {
        return content.toString();
    } else if (content instanceof DataSource) {
        return aurumToString(content.value);
    } else if (content instanceof DuplexDataSource) {
        return aurumToString(content.value);
    } else if (content instanceof ArrayDataSource) {
        return aurumToString(content.getData() as any);
    } else {
        const item = content as AurumElementModel<any>;
        if (!item.isIntrinsic) {
            return aurumToString(
                item.factory(
                    item.props,
                    item.children,
                    createAPI({
                        attachCalls: [],
                        sessionToken: new CancellationToken(),
                        tokens: []
                    })
                )
            );
        }
        let propString: string = ' ';
        let children: string = '';
        if (item.children) {
            children = await aurumToString(item.children);
        }
        for (const prop in item.props) {
            propString += `${prop}="${item.props[prop].toString()}" `;
        }
        return `<${item.name}${propString.trimRight()}>${children}</${item.name}>`;
    }
}
