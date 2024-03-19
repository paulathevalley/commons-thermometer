import { SlackAPIClient } from 'slack-web-api-client';

// Fetch device state from Govee API
async function getThermometer(key) {
	const HOSTNAME = 'https://openapi.api.govee.com';
	const THERMOMETER_SKU = 'H5179';
	const THERMOMETER_DEVICE = 'AE:3C:18:CE:B9:51:BC:6D';

	const response = await fetch(`${HOSTNAME}/router/api/v1/device/state`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Govee-API-Key': key || GOVEE_API_KEY,
		},
		body: JSON.stringify({
			requestId: 'uuid',
			payload: {
				sku: THERMOMETER_SKU,
				device: THERMOMETER_DEVICE,
			},
		}),
	});

	return response;
}

// Using the data from `getThermometer`, find the temperature value and convert it to Fahrenheit
function getFahrenheitFromSensor(payload) {
	const sensor = payload.capabilities.find((c) => c.instance === 'sensorTemperature');
	/* Observational data
	16, ~51F
	47, 81.6F
	50, 84.1F
	*/
	return sensor.state.value;
}

// Get recent bot history
async function fetchBotHistory(channelId, oldestTime) {
	// Note: environment variables on Cloudflare are available globally
	const token = BOT_USER_OAUTH_TOKEN;

	const client = new SlackAPIClient(token);
	let timeToUnixTimestamp;
	if (oldestTime) {
		timeToUnixTimestamp = Math.floor(oldestTime / 1000);
	}
	try {
		// Call the conversations.history method using the built-in WebClient
		const result = await client.conversations.history({
			// The token you used to initialize your app
			token: token,
			channel: channelId,
			// In a more realistic app, you may store ts data in a db
			// latest: ts,
			bot_id: BOT_ID,
			// include all metadata
			include_all_metadata: true,
			// Only messages after this Unix timestamp will be included in results.
			// oldest: timeToUnixTimestamp,
			// Limit results
			// inclusive: true,
			// limit: 1,
		});

		const history = result.messages;
		const botHistory = history.filter((msg) => msg.bot_id === BOT_ID && msg.text.includes(':robot_face:'));
		return botHistory;
	} catch (error) {
		console.error(error);
	}
}

const RANGE = {
	hot: 'HOT',
	cold: 'COLD',
	ok: 'OK',
};

// Post a message to the channel
async function alertChannel(channelId, temperature, range) {
	// Note: environment variables on Cloudflare are available globally
	const token = BOT_USER_OAUTH_TOKEN;

	const client = new SlackAPIClient(token);
	let text;
	switch (range) {
		case RANGE.hot:
			text = `:robot_face: :hot_face: The greenhouse is ${temperature}`;
			break;
		case RANGE.cold:
			text = `:robot_face: :cold_face: The greenhouse is ${temperature}`;
			break;
		case RANGE.ok:
		default:
			text = `:robot_face: The greenhouse is ${temperature}`;
			break;
	}
	try {
		const result = await client.chat.postMessage({
			text: text,
			channel: channelId,
		});
		console.log(`Successfully sent message ${result.ts} in conversation ${channelId}`);
	} catch (error) {
		// Does slack-web-api-client have access to ErrorCode?
		// Check the code property, and when its a PlatformError, log the whole response.
		// if (error.code === ErrorCode.PlatformError) {
		// console.log(error.data);
		// } else {
		// Some other error, oh no!
		console.log('Well, that was unexpected.');
		// }
		console.log(error);
	}
}

export { getThermometer, getFahrenheitFromSensor, fetchBotHistory, alertChannel, RANGE };
