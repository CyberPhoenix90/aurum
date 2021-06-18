import { Aurum } from 'aurumjs';

export function SSR() {
	return (
		<html lang="en">
			<head>
				<meta http-equiv="X-UA-Compatible" content="IE=edge" />
				<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
				<meta name="viewport" content="width=640, initial-scale=1.0" />
				<link href="css/icon.css" rel="stylesheet" />
				<link type="text/css" rel="stylesheet" href="node_modules/materialize-css/dist/css/materialize.css" media="screen,projection" />
				<link type="text/css" rel="stylesheet" href="css/icon.css" media="screen,projection" />
				<script src="node_modules/@babel/standalone/babel.min.js"></script>
				<title>Aurum.js</title>
			</head>
			<body>
				<script src="node_modules/monaco-editor/min/vs/loader.js"></script>
				<script>window.r = require;</script>
				<script src="node_modules/materialize-css/dist/js/materialize.js"></script>
				<script src="./static/js/app.bundle.js"></script>
			</body>
		</html>
	);
}
