"use strict";

const fs = require("fs");
const path = require("path");
global.Sequelize = require("sequelize");
const basename = path.basename(module.filename);

global.sequelize = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USER,
	process.env.DB_PASS,
	{
		host: process.env.DB_HOST,
		dialect: "sqlite",
		storage: `${appPath}/entity/database.db`,
		logging: false,
		omitNull: false,
		language: "en",
		pool: {
			max: 5,
			min: 0,
			idle: 30000,
			acquire: 20000,
		},
	}
);

sequelize
	.sync({ force: false })
	.then(async () => {
		console.log("Database sync started.");
		console.log("Database sync completed.");
	})
	.catch(function (err) {
		console.log(err);
		process.exit();
	});

const db = {};
fs.readdirSync(path.join(__dirname, "./"))
	.filter(function (file) {
		return (
			file.indexOf(".") !== 0 &&
			file !== basename &&
			file !== "connectionManager.js" &&
			file.slice(-3) === ".js"
		);
	})
	.forEach(function (file) {
		const model = require(path.join(__dirname, file))(
			sequelize,
			Sequelize.DataTypes
		);
		db[model.name] = model;
	});

Object.keys(db).forEach(function (modelName) {
	if (db[modelName].associate) {
		db[modelName].associate(db);
	}
});
db.cron = sequelize; // cron
db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
