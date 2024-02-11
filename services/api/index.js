const options = require(appPath + "/api/options");

module.exports = [
	{
		method: ["GET", "POST"],
		path: "/",
		options: {
			handler: (req, h) => {
				return "I think you have forgotten your path. Press back button.";
			},
		},
	},
	{
		method: "GET",
		path: "/options/get/{option_key}",
		options: {
			handler: options.getOptionValue,
		},
	},
	{
		method: "POST",
		path: "/options/save",
		options: {
			handler: options.saveOptionValue,
		},
	},
	{
		method: "GET",
		path: "/options/ringBell",
		options: {
			handler: options.ringBell,
		},
	},
];
