import { Aurum, AurumRouter, DataSource, DefaultRoute, Route } from 'aurumjs';
import { Category, ContentList } from '../content_list';
import { ExamplePage } from './example_page';
import { MarkdownPage } from './markdown_page';

const courses: Category[] = [
	{
		name: 'Aurum.js',
		sections: [
			{
				prefix: '1. ',
				href: '',
				name: 'Quickstart',
				id: ''
			},
			{
				prefix: '2. ',
				href: 'coreideas',
				name: 'Core ideas',
				id: 'coreideas'
			},
			{
				prefix: '3. ',
				href: 'why',
				name: 'Why Aurum',
				id: 'why'
			},
			{
				prefix: '4. ',
				href: 'examples',
				name: 'Examples',
				id: 'examples'
			}
		]
	},
	{
		name: 'JSX',
		sections: [
			{
				prefix: '1. ',
				href: 'syntax',
				name: 'Syntax',
				id: 'syntax'
			},
			{
				prefix: '2. ',
				href: 'typescript',
				name: 'Typescript',
				id: 'typescript'
			},
			{
				prefix: '3. ',
				href: 'babel',
				name: 'Babel',
				id: 'babel'
			}
		]
	},
	{
		name: 'State management',
		sections: [
			{
				prefix: '1. ',
				href: 'datasource',
				name: 'DataSource',
				id: 'datasource'
			},
			{
				prefix: '2. ',
				href: 'arraydatasource',
				name: 'ArrayDataSource',
				id: 'arraydatasource'
			},
			{
				prefix: '3. ',
				href: 'objectdatasource',
				name: 'ObjectDataSource',
				id: 'objectdatasource'
			}
		]
	},
	{
		name: 'Components',
		sections: [
			{
				prefix: '1. ',
				href: 'functional',
				name: 'Functional',
				id: 'functional'
			},
			{
				prefix: '2. ',
				href: 'classes',
				name: 'Class based',
				id: 'classes'
			},
			{
				prefix: '3. ',
				href: 'transclude',
				name: 'Transclusion',
				id: 'transclude'
			}
		]
	},
	{
		name: 'Builtins',
		sections: [
			{
				prefix: '1. ',
				href: 'switches',
				name: 'Switch component',
				id: 'switches'
			},
			{
				prefix: '2. ',
				href: 'router',
				name: 'AurumRouter component',
				id: 'router'
			},
			{
				prefix: '3. ',
				href: 'suspense',
				name: 'Suspense component',
				id: 'suspense'
			}
		]
	}
];

export function GettingStarted() {
	const selectedNode = new DataSource<string>(getSelectedPage());
	window.addEventListener('hashchange', () => {
		selectedNode.update(getSelectedPage());
	});

	return (
		<div class="documentation-page">
			<ContentList selectedNode={selectedNode} baseUrl="#/getting_started/" content={courses}></ContentList>
			<div class="documentation-content">
				<AurumRouter>
					<Route href="/getting_started/coreideas">
						<MarkdownPage title="Core ideas" url="/documentation/core_ideas.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/why">
						<MarkdownPage title="Why Aurum" url="/documentation/why.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/syntax">
						<MarkdownPage title="Syntax" url="/documentation/syntax.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/classes">
						<MarkdownPage title="Class based components" url="/documentation/classes.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/functional">
						<MarkdownPage title="Function based components" url="/documentation/functional.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/typescript">
						<MarkdownPage title="Using Aurum with typescript" url="/documentation/typescript.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/babel">
						<MarkdownPage title="Using Aurum with babel" url="/documentation/babel.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/switches">
						<MarkdownPage title="Builtin components: Switch" url="/documentation/switches.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/router">
						<MarkdownPage title="Builtin components: Router" url="/documentation/router.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/suspense">
						<MarkdownPage title="Builtin components: Suspense" url="/documentation/suspense.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/examples">
						<ExamplePage></ExamplePage>
					</Route>
					<Route href="/getting_started/transclude">
						<MarkdownPage title="Transclusion" url="/documentation/transclusion.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/datasource">
						<MarkdownPage title="DataSource" url="/documentation/datasource.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/arraydatasource">
						<MarkdownPage title="ArrayDataSource" url="/documentation/arraydatasource.md"></MarkdownPage>
					</Route>
					<Route href="/getting_started/objectdatasource">
						<MarkdownPage title="ObjectDataSource" url="/documentation/objectdatasource.md"></MarkdownPage>
					</Route>
					<DefaultRoute>
						<MarkdownPage title="Quickstart" url="/documentation/quickstart.md"></MarkdownPage>
					</DefaultRoute>
				</AurumRouter>
			</div>
		</div>
	);
}

function getSelectedPage() {
	const hash = location.hash.substring(1);
	if (hash.startsWith('/getting_started/')) {
		return hash.substring('/getting_started/'.length);
	} else {
		return '';
	}
}
