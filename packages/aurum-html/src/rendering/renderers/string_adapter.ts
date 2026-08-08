import {
    AurumElementModel,
    createAPI,
    createRenderSession,
    isAurumDevtoolsDebugBuild,
    Renderable,
    RenderSession,
    traceAurumComponentRender
} from '@aurum/rendering';
import { ArrayDataSource, DataSource } from '@aurum/streams';
import { camelCaseToKebabCase } from '@aurum/streams';
import { getValueOf } from '@aurum/streams';
import { HTMLSanitizeConfig } from '../../utilities/sanitize.js';
import { isAurumStyleClass } from '@aurum/streams';

export async function aurumToString(content: Renderable, config: HTMLSanitizeConfig = {}): Promise<string> {
    return aurumToStringItem(content, config);
}

async function aurumToStringItem(
    content: Renderable,
    config: HTMLSanitizeConfig,
    parentSession?: RenderSession
): Promise<string> {
    if (content === undefined || content === null || typeof content === 'boolean') {
        return '';
    }

    if (Array.isArray(content)) {
        const result = [];
        for (const item of content) {
            result.push(await aurumToStringItem(item, config, parentSession));
        }
        return result.join('');
    }

    if (content instanceof Promise) {
        return aurumToStringItem((await (content as Promise<unknown>)) as Renderable, config, parentSession);
    }

    if (['number', 'string', 'bigint'].includes(typeof content)) {
        return content.toString();
    } else if (content instanceof DataSource) {
        return aurumToStringItem(content.value, config, parentSession);
    } else if (content instanceof ArrayDataSource) {
        return aurumToStringItem(content.getData() as any, config, parentSession);
    } else {
        const item = content as AurumElementModel<any>;
        if (!item.isIntrinsic) {
            const session = createRenderSession(parentSession);
            try {
                return await traceAurumComponentRender(item, session, () => {
                    const output = item.factory(item.props, item.children, createAPI(session));
                    const outputScope = isAurumDevtoolsDebugBuild() ? createRenderSession(session) : session;
                    if (outputScope !== session) session.sessionToken.addCancellable(outputScope.sessionToken);
                    return aurumToStringItem(output, config, outputScope);
                });
            } finally {
                session.sessionToken.cancel();
            }
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
            children = await aurumToStringItem(item.children, config, parentSession);
        }
        for (const prop in item.props) {
            if (config.attributeBlacklist && config.attributeBlacklist.includes(prop)) {
                continue;
            }

            if (config.attributeWhitelist && !config.attributeWhitelist.includes(prop)) {
                continue;
            }

            if (item.props[prop] != undefined) {
                if (prop === 'style' && typeof item.props[prop] === 'object') {
                    propString = handleObjectStyle(propString, prop, item);
                } else if (prop === 'class' && typeof item.props[prop] === 'object') {
                    propString = handleObjectClass(propString, prop, item);
                } else {
                    propString += `${prop}="${item.props[prop].toString()}" `;
                }
            }
        }
        return `<${item.name}${propString.trimEnd()}>${children}</${item.name}>`;
    }
}

// classes can be map like objects that map a class name to a boolean or boolean data source and the class only applies if the value is true
function handleObjectClass(propString: string, prop: string, item: AurumElementModel<any>) {
    return `${propString}${prop}="${resolveClass(item.props[prop])}" `;
}

function resolveClass(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (isAurumStyleClass(value)) {
        return value.className;
    }
    if (value instanceof DataSource) {
        return resolveClass(value.value);
    }
    if (Array.isArray(value)) {
        return value.map(resolveClass).filter(Boolean).join(' ');
    }
    if (typeof value === 'object' && value !== null) {
        return Object.keys(value)
            .filter((key) => getValueOf((value as Record<string, boolean | DataSource<boolean>>)[key]))
            .join(' ');
    }
    return '';
}

function handleObjectStyle(propString: string, prop: string, item: AurumElementModel<any>) {
    propString += `${prop}="${Object.keys(item.props[prop])
        .map((key) => `${camelCaseToKebabCase(key)}:${getValueOf(item.props[prop][key])}`)
        .join(';')};" `;
    return propString;
}
