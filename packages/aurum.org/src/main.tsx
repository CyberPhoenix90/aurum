import { Aurum, AurumRouter, DefaultRoute, Route } from 'aurumjs';
import '../less/main.less';
import { Advantages } from './components/aurum/advantages';
import { exampleData, Examples } from './components/aurum/examples';
import { MainTitle } from './components/aurum/main_title';
import { Navbar } from './components/aurum/navbar';
import { DocumentationPage } from './components/aurum/pages/documentation_page';
import { GettingStarted } from './components/aurum/pages/getting_started';
import { ACAdvantages } from './components/aurum_canvas/ac_advantages';
import { acExampleData } from './components/aurum_canvas/ac_examples';
import { ACMainTitle } from './components/aurum_canvas/ac_main_title';
import { ACNavbar } from './components/aurum_canvas/ac_navbar';
declare const M: any;

//@ts-ignore
r.config({ paths: { vs: 'node_modules/monaco-editor/min/vs' } });

Aurum.attach(
	<div onAttach={() => setTimeout(() => M.AutoInit())}>
		<AurumRouter>
			<Route href="/aurum_canvas">
				<ACNavbar></ACNavbar>
			</Route>
			<DefaultRoute>
				<Navbar></Navbar>
			</DefaultRoute>
		</AurumRouter>
		<AurumRouter>
			<Route href="/aurum_canvas">
				<AurumRouter>
					<Route href="/aurum_canvas/documentation"></Route>
					<Route href="/aurum_canvas/getting_started"></Route>
					<DefaultRoute>
						<ACMainTitle></ACMainTitle>
						<ACAdvantages></ACAdvantages>
						<div class="container">
							<Examples examples={acExampleData}></Examples>
						</div>
					</DefaultRoute>
				</AurumRouter>
			</Route>
			<Route href="/documentation">
				<DocumentationPage></DocumentationPage>
			</Route>
			<Route href="/getting_started">
				<GettingStarted></GettingStarted>
			</Route>
			<DefaultRoute>
				<div>
					<MainTitle></MainTitle>
					<Advantages></Advantages>
					<div class="container">
						<Examples examples={exampleData}></Examples>
					</div>
				</div>
			</DefaultRoute>
		</AurumRouter>
	</div>,
	document.body
);
