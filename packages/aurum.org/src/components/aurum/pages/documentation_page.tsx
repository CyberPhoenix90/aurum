import { Aurum, DataSource, Renderable, Suspense } from 'aurumjs';
import { Category, ContentList } from '../content_list';

interface DocumentationNodeReference {
	type: 'reference';
	name: string;
	id: number;
}

interface DocumentationTypeNode {
	types: DocumentationTypeNode[];
	typeArguments: DocumentationTypeNode[];
	type: string;
	name?: string;
	declaration?: DocumentationNode;
	elementType: DocumentationTypeNode;
}

interface DocumentationNode {
	indexSignature?: DocumentationNode;
	type?: DocumentationTypeNode;
	flags?: {
		isExported?: boolean;
		isOptional?: boolean;
		isRest?: boolean;
	};
	name: string;
	kind: number;
	kindString: string;
	id: number;
	getSignature?: DocumentationNode[];
	signatures?: DocumentationNode[];
	typeParameter?: DocumentationNode[];
	parameters?: DocumentationNode[];
	extendedTypes?: DocumentationNodeReference[];
	inheritedFrom?: DocumentationNodeReference;
	comment?: {
		text?: string;
		shortText?: string;
		returns?: string;
		tags: { tag: string; text: string }[];
	};
	children: DocumentationNode[];
}

export function DocumentationPage() {
	return (
		<Suspense fallback="Loading...">
			<Documentation></Documentation>
		</Suspense>
	);
}

async function Documentation() {
	const docsModel = await fetch('/node_modules/aurumjs/docs/docs.json').then((s) => s.json());
	const nodes: DocumentationNode[] = docsModel.children
		.flatMap((p) => {
			if (p.kind === 1) {
				return p.children;
			} else {
				return [p];
			}
		})
		.filter((p) => p && !isInternal(p))
		.sort((a, b) => a.name.localeCompare(b.name));

	const model: Category[] = nodes.map<Category>((p) => ({
		name: p.name,
		sections: [
			{
				href: p.name,
				id: p.id.toString(),
				name: getFullNodeName(p)
			}
		]
	}));

	const nodeIdMap: Map<number, DocumentationNode> = new Map();
	const nodeNameMap: Map<string, DocumentationNode> = new Map();

	for (const node of nodes) {
		nodeIdMap.set(node.id, node);
		nodeNameMap.set(node.name, node);
	}

	const pageContent = new DataSource(renderRootNode(getSelectedNode(nodeNameMap), nodeIdMap));
	const selectedNode = new DataSource<string>(getSelectedNode(nodeNameMap).id.toString());
	window.addEventListener('hashchange', () => {
		pageContent.update(renderRootNode(getSelectedNode(nodeNameMap), nodeIdMap));
		selectedNode.update(getSelectedNode(nodeNameMap).id.toString());
	});

	return (
		<div class="documentation-page">
			<ContentList selectedNode={selectedNode} baseUrl="#/documentation/" flat={true} content={model}></ContentList>
			<div class="documentation-content">{pageContent}</div>
		</div>
	);
}

function linkFactory(nodeName: string): string {
	return '#/documentation/' + nodeName;
}

function getSelectedNode(nodes: Map<string, DocumentationNode>): DocumentationNode {
	const nodeName = location.href.substring(location.href.lastIndexOf('/') + 1);
	if (nodes.has(nodeName)) {
		return nodes.get(nodeName);
	} else {
		return nodes.get('Aurum');
	}
}

function renderRootNode(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable {
	if (!node) {
		return <div>No item selected</div>;
	}

	return (
		<div>
			<h4>
				{node.kindString} {getFullSignature(node, nodeById)}
			</h4>
			{node.comment?.shortText ? <h5>{node.comment.shortText}</h5> : undefined}
			{node.signatures?.[0].comment?.shortText ? <h5>{node.signatures[0].comment.shortText}</h5> : undefined}
			{(node?.type as DocumentationTypeNode)?.declaration?.signatures?.[0] && (
				<h5>Alias for: {getFullSignature((node.type as DocumentationTypeNode).declaration.signatures[0], nodeById)}</h5>
			)}
			<div>{renderJsDoc(node)}</div>
			<br></br>
			<div class="documentation-sections">
				{node.children?.map((c) => {
					switch (c.kind) {
						case 2:
							return;
						case 64:
						case 512:
						case 2048:
							return renderFunction(c, nodeById);
						case 1024:
							return renderProperty(c, nodeById);
						case 262144:
							return renderGetterAccessor(c, nodeById);
						default:
							return (
								<div>
									Unknown node kind {c.kind} {c.kindString}
								</div>
							);
					}
				})}
			</div>
		</div>
	);
}

function isInternal(node: DocumentationNode) {
	return !node.flags.isExported || !!node?.comment?.tags?.some((t) => t.tag === 'internal') || node.name.startsWith('__');
}

//@ts-ignore
function renderMetadata(node: DocumentationNode): Renderable {
	return (
		<summary>
			<details>
				<pre>{JSON.stringify(node, undefined, 4)}</pre>
			</details>
		</summary>
	);
}

function renderFunction(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable {
	return (
		<div>
			<h6>{getFullSignature(node.signatures[0], nodeById)}</h6>
			<div>{renderJsDoc(node.signatures[0])}</div>
		</div>
	);
}

function renderFunctionInline(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable {
	return <span>{getFullSignature(node.signatures[0], nodeById)}</span>;
}

function renderGetterAccessorInline(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable {
	return <span>get {getFullProperty(node, nodeById)}</span>;
}

function renderGetterAccessor(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable {
	return (
		<div>
			<h6>get {getFullProperty(node, nodeById)}</h6>
			<div>{renderJsDoc(node)}</div>
		</div>
	);
}

function renderPropertyInline(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable {
	return <span>{getFullProperty(node, nodeById)}</span>;
}

function renderProperty(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable {
	return (
		<div>
			<h6>{getFullProperty(node, nodeById)}</h6>
			<div>{renderJsDoc(node)}</div>
		</div>
	);
}

function renderJsDoc(node: DocumentationNode) {
	const clauses: Renderable[] = [];

	if (!node.comment) {
		return null;
	}

	if (node.comment.shortText) {
		clauses.push(<div>{node.comment.shortText}</div>);
	}

	if (node.comment.text) {
		clauses.push(<div>{node.comment.text}</div>);
	}

	if (node.comment.returns) {
		clauses.push(
			<div>
				<em>returns:</em> {node.comment.returns}
			</div>
		);
	}

	return clauses;
}

function getFullProperty(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable[] {
	let property = node.name;

	if (node.type) {
		return [property + ': ', ...typeNodeToMarkup(node.type, nodeById)];
	}

	if (node.getSignature) {
		return [property + ': ', ...typeNodeToMarkup(node.getSignature[0].type, nodeById)];
	}

	return [property];
}

function renderNodeInline(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable {
	switch (node.kind) {
		case 64:
		case 512:
		case 2048:
			return renderFunctionInline(node, nodeById);
		case 1024:
			return renderPropertyInline(node, nodeById);
		case 262144:
			return renderGetterAccessorInline(node, nodeById);
		default:
			return (
				<div>
					Unknown node kind {node.kind} {node.kindString}
				</div>
			);
	}
}

function renderIndexSignature(signature: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable[] {
	return ['[', ...getFullParameterSignature(signature.parameters[0], nodeById), ']:', ...typeNodeToMarkup(signature.type, nodeById)];
}

function typeNodeToMarkup(node: DocumentationTypeNode, nodeById: Map<number, DocumentationNode>): Renderable[] {
	if (node.type === 'reflection') {
		const declaration = (node as DocumentationTypeNode).declaration;
		if (declaration.signatures) {
			return getFullSignature((node as DocumentationTypeNode).declaration.signatures[0], nodeById);
		} else {
			if (declaration.kind === 65536) {
				return [
					'{',
					...(declaration.indexSignature ? renderIndexSignature(declaration.indexSignature[0], nodeById) : null),
					...(declaration.children?.map((p) => renderNodeInline(p, nodeById)) ?? []),
					'}'
				];
			} else {
				return ['any'];
			}
		}
	} else if (node.type === 'typeParameter') {
		return [node.name];
	} else if (node.type === 'union') {
		return insertBetween(
			node.types.map((t) => typeNodeToMarkup(t, nodeById)),
			' | '
		).flat();
	} else if (node.type === 'array') {
		return [...typeNodeToMarkup(node.elementType, nodeById), '[]'];
	} else if (node.type === 'intrinsic' || node.name === 'Array') {
		return [node.name, node.typeArguments ? <>{['<', insertBetween(node.typeArguments.map((t) => typeNodeToMarkup(t, nodeById))), '>']}</> : null];
	} else if (node.type === 'reference') {
		return [
			<a href={linkFactory(node.name)}>{node.name}</a>,
			node.typeArguments ? ['<', insertBetween(node.typeArguments.map((t) => typeNodeToMarkup(t, nodeById))), '>'] : null
		];
	} else {
		return ['any'];
	}
}

function insertBetween<T>(array: T[], insert: any = ', '): T[] {
	const result = [];
	for (let i = 0; i < array.length; i++) {
		result.push(array[i]);
		if (i < array.length - 1) {
			result.push(' | ');
		}
	}
	return result;
}

function getFullSignature(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable[] {
	let signature: Renderable[] = [];
	if (node.name !== '__call' && node.name !== '__type') {
		signature.push(node.name);
	}
	if (node.kindString !== 'Constructor signature' && node.kindString !== 'Function' && node.kindString !== 'Call signature') {
		return signature;
	}
	if (node.signatures) {
		node = node.signatures[0];
	}

	signature.push('(');
	if (node.parameters) {
		let first = true;
		for (const param of node.parameters.map((node) => getFullParameterSignature(node, nodeById))) {
			if (!first) {
				signature.push(', ');
			}
			signature.push(...param);
			first = false;
		}
	}
	signature.push(')');

	if (node.type) {
		if (node.name === '__call' || node.name === '__type') {
			signature.push(' => ', ...typeNodeToMarkup(node.type, nodeById));
		} else {
			signature.push(': ', ...typeNodeToMarkup(node.type, nodeById));
		}
	}

	return signature;
}

function getFullParameterSignature(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable[] {
	let name = node.name;
	if (node.flags.isOptional) {
		name += '?';
	}

	if (node.flags.isRest) {
		name = `...${name}`;
	}

	if (node.type) {
		return [name + ': ', ...typeNodeToMarkup(node.type, nodeById)];
	}

	return [name];
}

//@ts-ignore
function renderNodeName(node: DocumentationNode, nodeById: Map<number, DocumentationNode>): Renderable[] {
	const markup: Renderable[] = [];
	if (node.extendedTypes) {
		const extend: DocumentationNodeReference[] = [];
		const implement: DocumentationNodeReference[] = [];
		for (const ext of node.extendedTypes) {
			if (nodeById.get(ext.id).kind === node.kind) {
				extend.push(ext);
			} else {
				implement.push(ext);
			}
		}
		if (extend.length) {
			markup.push(' extends ');
			let first = true;
			for (const ext of extend) {
				if (!first) {
					markup.push(', ');
				}
				markup.push(<a href={linkFactory(ext.name)}>{ext.name}</a>);
				first = false;
			}
		}
		if (implement.length) {
			markup.push(' implements ');
			let first = true;
			for (const ext of implement) {
				if (!first) {
					markup.push(', ');
				}
				markup.push(<a href={linkFactory(ext.name)}>{ext.name}</a>);
				first = false;
			}
		}
	}

	return (
		<span>
			{getFullNodeName(node)} {markup}
		</span>
	);
}

function getFullNodeName(node: DocumentationNode): string {
	let name: string = node.name;
	if (node.typeParameter) {
		name += '<';
		name += node.typeParameter.map((p) => p.name).join(', ');
		name += '>';
	}

	return name;
}
