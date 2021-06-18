import { Aurum } from 'aurumjs';

export function ACNavbar() {
	return (
		<nav class="grey darken-4" role="navigation">
			<div class="nav-wrapper container">
				<ul class="right hide-on-med-and-down">
					<li>
						<div class="title">
							<a href="#">Home</a>
						</div>
					</li>
					<li>
						<div class="title">
							<a href="#/getting_started">Getting started</a>
						</div>
					</li>
					<li>
						<div class="title">
							<a href="#/documentation">Documentation</a>
						</div>
					</li>
					<li>
						<a target="_blank" href="https://github.com/CyberPhoenix90/aurum">
							Github
						</a>
					</li>
					<li>
						<a target="_blank" href="https://www.npmjs.com/package/aurumjs">
							Npm
						</a>
					</li>
				</ul>

				<ul class="left hide-on-med-and-down">
					<li>
						<div class="title">
							<a href="#">Go to Aurum</a>
						</div>
					</li>
				</ul>

				<ul id="nav-mobile" class="sidenav">
					<li>
						<a href="#">Home</a>
					</li>
					<li>
						<a href="#/getting_started">Getting started</a>
					</li>
					<li>
						<a href="#/documentation">Documentation</a>
					</li>
					<li>
						<a target="_blank" href="https://github.com/CyberPhoenix90/aurum">
							Github
						</a>
					</li>
					<li>
						<a target="_blank" href="https://www.npmjs.com/package/aurumjs">
							Npm
						</a>
					</li>
				</ul>
				<a href="#" data-target="nav-mobile" class="sidenav-trigger">
					<i class="material-icons">menu</i>
				</a>
			</div>
		</nav>
	);
}
