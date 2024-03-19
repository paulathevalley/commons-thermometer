import { getThermometer, getFahrenheitFromSensor, fetchBotHistory, alertChannel, RANGE } from './utils';

let BOT_NAME = 'Thermo-Bot 🌡️';
let TOO_HOT = 85;
let TOO_COLD = 40;
let GREENHOUSE_CHANNEL_ID = 'C06Q387FJ4A'; // #production
// let GREENHOUSE_CHANNEL_ID = 'C054JVDKQJE'; // debugging— #freethecanoe

let jsonHeaders = new Headers([['Content-Type', 'application/json']]);

// Using Service Worker syntax
// more: https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
addEventListener('fetch', (event) => {
	event.respondWith(slackWebhookHandler(event.request));
});

addEventListener('scheduled', (event) => {
	event.waitUntil(checkThermometer(event));
});

// const MS_PER_MINUTE = 60000;
// const DURATION_IN_MINUTES = 90;
// the cron triggers every 5 minutes. we want to check if a message was sent X minutes ago.
// const recentTimeframe = new Date(event.scheduledTime - DURATION_IN_MINUTES * MS_PER_MINUTE);

// The scheduled handler is invoked at the interval set in our wrangler.toml's
// [[triggers]] configuration.
async function checkThermometer(event) {
	const botHistory = await fetchBotHistory(GREENHOUSE_CHANNEL_ID);
	const response = await getThermometer(GOVEE_API_KEY);
	let wasSuccessful = response.ok ? 'success' : 'fail';

	if (response.ok) {
		const result = await response.json();
		const currentTemperature = getFahrenheitFromSensor(result.payload);
		const sensor = result.payload.capabilities.find((c) => c.instance === 'sensorTemperature');
		const currentSensorValue = sensor.state.value;
		let nextRange = RANGE.ok;
		if (currentTemperature > TOO_HOT) {
			nextRange = RANGE.hot;
		} else if (currentTemperature < TOO_COLD) {
			nextRange = RANGE.cold;
		}

		if (botHistory && botHistory.length) {
			// I think we have to assume that slack returns the history with the most recent messages first
			const mostRecentPost = botHistory[0];
			let lastRange = RANGE.ok;
			if (mostRecentPost.text.includes(':hot_face:')) {
				lastRange = RANGE.hot;
			} else if (mostRecentPost.text.includes(':cold_face:')) {
				lastRange = RANGE.cold;
			}

			if (lastRange === nextRange) {
				// the temperature did not change in range, so skip posting a message
				console.log('Temperature is in the same range as last sent message. Skipping alertChannel.');
			} else {
				// the temperature changed ranges
				await alertChannel(GREENHOUSE_CHANNEL_ID, `${currentTemperature}F (sensor: ${currentSensorValue})`, nextRange);
			}
		} else {
			// Bot has no history
			await alertChannel(GREENHOUSE_CHANNEL_ID, `${currentTemperature}F (sensor: ${currentSensorValue})`, nextRange);
		}
	}

	const localTime = new Date(event.scheduledTime).toLocaleString(['en-US'], {
		timeZone: 'America/Los_Angeles',
	});

	console.log(`trigger fired at ${event.cron}: ${wasSuccessful} with local time: ${localTime}`);
}

/**
 * simpleResponse generates a simple JSON response
 * with the given status code and message.
 *
 * @param {Number} statusCode
 * @param {String} message
 */
function simpleResponse(statusCode, message) {
	let resp = {
		message: message,
		status: statusCode,
	};

	return new Response(JSON.stringify(resp), {
		headers: jsonHeaders,
		status: statusCode,
	});
}

/**
 * parseMessage parses the selected stock from the Slack message.
 *
 * @param {FormData} message - the message text
 * @return {Object} - an object containing the stock name.
 */
function parseMessage(message) {
	// 1. Parse the message (trim whitespace, uppercase)
	// 2. Return stock that we are looking for
	return {
		msg: message.get('text').trim(),
	};
}

/**
 * slackResponse builds a message for Slack with the given text
 * and optional attachment text
 *
 * @param {string} text - the message text to return
 */
function slackResponse(text) {
	let content = {
		response_type: 'in_channel',
		text: text,
		attachments: [],
	};

	/* error messages
	{
  "response_type": "ephemeral",
  "text": "Sorry, slash commando, that didn't work. Please try again."
}
	*/

	return new Response(JSON.stringify(content), {
		headers: jsonHeaders,
		status: 200,
	});
}

/**
 * slackWebhookHandler handles an incoming Slack
 * webhook and generates a response.
 * @param {Request} request
 */
async function slackWebhookHandler(request) {
	// As per: https://api.slack.com/slash-commands
	// - Slash commands are outgoing webhooks (POST requests)
	// - Slack authenticates via a verification token.
	// - The webhook payload is provided as POST form data

	if (request.method !== 'POST') {
		return simpleResponse(200, `Hi, I'm ${BOT_NAME}, a Slack bot for the greenhouse thermometer`);
	}

	try {
		let formData = await request.formData();

		// validate that the webhook is coming from Slack itself
		if (formData.get('token') !== SLACK_TOKEN) {
			return simpleResponse(403, 'invalid Slack verification token');
		}

		let parsed = parseMessage(formData);
		let line = ``;

		switch (parsed.msg) {
			case 'temperature':
			case 'temp':
				const response = await getThermometer(GOVEE_API_KEY);
				if (response.ok) {
					const result = await response.json();
					const sensor = result.payload.capabilities.find((c) => c.instance === 'sensorTemperature');
					const fahrenheit = getFahrenheitFromSensor(result.payload);
					line = `The greenhouse is currently ${fahrenheit}F (sensor says ${sensor.state.value})`;
				} else {
					line = `Had trouble connecting to the thermometer...`;
				}
				break;
			default:
				line = `I don’t recognize this. Try 'temperature'.`;
				break;
		}
		return slackResponse(line);
	} catch (e) {
		return simpleResponse(200, `Sorry, I had an issue retrieving anything: ${e}`);
	}
}
