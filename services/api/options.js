const admin = require('firebase-admin');
admin.initializeApp({
	credential: admin.credential.cert(__dirname + '/serviceAccountKey.json'),
	projectId: 'home-automation-nakul',
});

const getOptionValue = async (request, h) => {
	try {
		await sequelize.sync();
		var option = await Entity.options.findOne({
			where: {
				option_key: request.params.option_key,
			},
			attributes: ["option_key", "option_value"]
		});
		if (option) {
			return { "status": "success", "data": option };
		}
	} catch (error) {
		console.log(error);
	}
	return { "status": "failed", "message": "Option Key Not Found." };
};
const saveOptionValue = async (request, h) => {
	try {
		var option = await Entity.options.findOne({
			where: {
				option_key: request.payload.option_key,
			}
		});
		if (option) {
			option.option_value = request.payload.option_value;
			await option.save();
			return { "status": "success" };
		} else {
			var save = await Entity.options.create({
				option_key: request.payload.option_key,
				option_value: request.payload.option_value,
			});
			if (save) {
				return { "status": "success" };
			}
		}
	} catch (e) {
		console.log(e);
	}
	return { "status": "failed", "message": "Unable to save option." };
};
const ringBell = async (request, h) => {
	try {
		admin
			.messaging().sendToTopic("allDevices", {
				notification: {
					body: 'alarm_notification',
				}
			})
			.then(response => {
				console.log('Notification sent successfully:', response);
			})
			.catch(error => {
				console.error('Error sending notification:', error);
			});
	} catch (error) {
		console.log(error);
	}


	return {};
};
module.exports = {
	getOptionValue: getOptionValue,
	saveOptionValue: saveOptionValue,
	ringBell: ringBell,
};
