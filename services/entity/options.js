"use strict";

const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
	const options = sequelize.define(
		"options",
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				unique: true,
			},
			option_key: Sequelize.TEXT,
			option_value: Sequelize.TEXT,
		},
		{
			timestamps: true,
			tableName: "options",
		}
	);

	options.sync({ force: false });

	return options;
};
