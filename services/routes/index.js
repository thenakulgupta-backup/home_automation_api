"use strict";
global.appPathRaw = require("app-root-path");
global.appPath = require("app-root-path") + "/services";
global.Entity = require(appPath + "/entity");
global.Joi = require("joi");
global.Sequelize = require("sequelize");
global.Op = Sequelize.Op;
global.axios = require("axios");
global.fs = require("fs");
global.moment = require("moment");

global.moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault('Asia/Kolkata');
process.env.TZ = 'Asia/Kolkata';

var routeDatas = [
	require("../api/index"),
];

const routes = {
	register: async function (server, options) {
		routeDatas.forEach(function (route) {
			server.route(route);
		});
		var columns = {
			"is_door_opened": "1",
			"local_IP": "",
		};
		var column_keys = Object.keys(columns);
		var keys = await Entity.options.findAll({
			where: {
				option_key: column_keys,
			},
			raw: true,
		});
		var keys_options = keys.map(key => key.option_key);
		var columns_to_save = column_keys.filter((element) => !keys_options.includes(element));
		var save_array = [];
		for (var column of columns_to_save) {
			save_array.push({
				option_key: column,
				option_value: columns[column],
			});
		}
		await Entity.options.bulkCreate(save_array);
	},
	name: "home-automation-routes",
	version: "1.0.0",
	routeDatas: routeDatas,
};

module.exports = routes;
