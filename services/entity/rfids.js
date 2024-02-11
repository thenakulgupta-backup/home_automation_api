"use strict";

const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
	const rfids = sequelize.define(
		"rfids",
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				unique: true,
			},
			rfid_name: Sequelize.TEXT,
			rfid_key: Sequelize.TEXT,
			rfid_value: Sequelize.TEXT,
			rfid_active: Sequelize.INTEGER,
		},
		{
			timestamps: true,
			tableName: "rfids",
		}
	);

	rfids.sync({ force: false });

	return rfids;
};
