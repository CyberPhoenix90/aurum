import { AurumElementModel, createAPI, Renderable } from '../rendering/aurum_element.js';
import { ArrayDataSource, DataSource } from '../stream/data_source.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { CancellationToken } from '../utilities/cancellation_token.js';

export interface AurumStringAdapterConfig {
    attributeBlacklist?: string[];
    attributeWhitelist?: string[];
    tagBlacklist?: string[];
    tagWhitelist?: string[];
}

export async function aurumToString(content: Renderable | Renderable[], config: AurumStringAdapterConfig = {}): Promise<string> {
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

        if (config.tagBlacklist && config.tagBlacklist.includes(item.name)) {
            return '';
        }

        if (config.tagWhitelist && !config.tagWhitelist.includes(item.name)) {
            return '';
        }

        let propString: string = ' ';
        let children: string = '';
        if (item.children) {
            children = await aurumToString(item.children);
        }
        for (const prop in item.props) {
            if (config.attributeBlacklist && config.attributeBlacklist.includes(prop)) {
                continue;
            }

            if (config.attributeWhitelist && !config.attributeWhitelist.includes(prop)) {
                continue;
            }

            if (item.props[prop] != undefined) {
                propString += `${prop}="${item.props[prop].toString()}" `;
            }
        }
        return `<${item.name}${propString.trimEnd()}>${children}</${item.name}>`;
    }
}
