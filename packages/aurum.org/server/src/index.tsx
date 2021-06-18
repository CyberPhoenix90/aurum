import { Aurum, aurumToString } from 'aurumjs';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as express from 'express';
import { createServer } from 'http';
import { join } from 'path';
import './extensions';
import { SSR } from './ssr';

async function start() {
	const server = createServer();

	const app = express();
	app.use(compression());
	app.use(bodyParser.json());

	server.on('request', app);

	app.get('/', async (req, res) => {
		res.send(await aurumToString(<SSR></SSR>));
	});

	app.get('/favicon', async (req, res) => {
		const path = join(__dirname, '../../favicon.ico', req.url);
		res.sendFile(path);
	});

	app.get('/static/*', async (req, res) => {
		const path = join(__dirname, '../../dist', req.url);
		res.sendFile(path);
	});

	app.get('/node_modules/*', async (req, res) => {
		const path = join(__dirname, '../../', req.url);
		res.sendFile(path);
	});

	app.get('/css/*', async (req, res) => {
		const path = join(__dirname, '../../', req.url);
		res.sendFile(path);
	});

	app.get('/images/*', async (req, res) => {
		const path = join(__dirname, '../../', req.url);
		res.sendFile(path);
	});

	app.get('/data/*', async (req, res) => {
		const path = join(__dirname, '../../', req.url);
		res.sendFile(path);
	});

	app.get('/documentation/*', async (req, res) => {
		console.log(req.url);
		const path = join(__dirname, '../../', req.url);
		res.sendFile(path);
	});

	app.get('/font/*', async (req, res) => {
		const path = join(__dirname, '../../', req.url);
		res.sendFile(path);
	});

	server.listen(3000, () => {
		console.log('Listening on port 3000 http://localhost:3000/');
	});
}

start();
