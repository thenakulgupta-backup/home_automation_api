"use strict";
const Hapi = require('@hapi/hapi');
var dotenv = require('dotenv')
dotenv.config()
var fs = require("fs");

global.server = Hapi.server(
	{
		address: '0.0.0.0',
		port: process.env.CURRENT_MODE && process.env.CURRENT_MODE == "development" ? 3000 : 3002,
		...process.env.CURRENT_MODE && process.env.CURRENT_MODE == "development" ? {
			tls: {
				key: fs.readFileSync('/usr/local/etc/httpd/server.key'),
				cert: fs.readFileSync('/usr/local/etc/httpd/server.crt')
			}
		} : {},
		routes: {
			"cors": true
		}
	},
);

const registerPlugin = async () => {
	await server.register([
		require('@hapi/inert'),
		require("@hapi/vision"),
		{
			plugin: require("good"),
			options: {
				includes: {
					request: ["payload"],
					response: ["payload"],
				},
				reporters: {
					file: [
						{
							module: "good-squeeze",
							name: "Squeeze",
							args: [{ error: "*", log: "*", response: "*", request: "*" }],
						},
						{
							module: "good-squeeze",
							name: "SafeJson",
							args: [{ error: "*", log: "*", response: "*", request: "*" }],
						},
					],
				},
			},
		},
		{
			plugin: require("./services/routes/index"),
		},
	]);
	await init();
};

const init = async () => {
	await server.start();
};

process.on("unhandledRejection", (err) => {
	console.log(err);
});

registerPlugin();
