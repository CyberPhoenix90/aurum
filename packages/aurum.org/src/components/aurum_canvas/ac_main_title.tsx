import { Aurum } from 'aurumjs';

export function ACMainTitle() {
	return (
		<div class="section no-pad-bot" id="index-banner">
			<div class="container">
				<br></br>
				<div class="title">
					<a id="logo-container" href="#" class="brand-logo">
						<img src="images/aurum.png"></img>
					</a>
					<h1 class="header center orange-text">Aurum Canvas</h1>
				</div>
				<div class="row center">
					<h5 class="header col s12 light">Canvas made easy with aurum</h5>
				</div>
				<div class="row center">
					<a href="#/aurum_canvas/getting_started" id="download-button" class="btn-large waves-effect waves-light grey darken-4">
						Get Started
					</a>
				</div>
				<br></br>
			</div>
		</div>
	);
}
