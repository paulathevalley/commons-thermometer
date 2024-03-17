import { getThermometer, getFahrenheitFromSensor } from './utils';
// import post from './alertChannel.js';
// const post = require('./alertChannel.js');

// SLACK_TOKEN is used to authenticate requests are from Slack.
// Keep this value secret.
let BOT_NAME = 'Thermo-Bot 🌡️';
let TOO_HOT = 85;
let TOO_COLD = 40;
let GARDEN_CHANNEL_ID = 'CD2SKK01Y';

let jsonHeaders = new Headers([['Content-Type', 'application/json']]);

// Using Service Worker syntax
// more: https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
addEventListener('fetch', (event) => {
	event.respondWith(slackWebhookHandler(event.request));
});

addEventListener('scheduled', (event) => {
	event.waitUntil(checkThermometer(event));
});

// The scheduled handler is invoked at the interval set in our wrangler.toml's
// [[triggers]] configuration.
async function checkThermometer(event) {
	const response = await getThermometer(GOVEE_API_KEY);
	let wasSuccessful = response.ok ? 'success' : 'fail';

	if (response.ok) {
		const result = await response.json();
		const fahrenheit = getFahrenheitFromSensor(result.payload);
		if (fahrenheit > TOO_HOT) {
			console.log('too hot!', fahrenheit);
			// node --env-file=.env src/alertChannel.js
		} else if (fahrenheit < TOO_COLD) {
			console.log('too cold!', fahrenheit);
		} else {
			console.log('temperature within range');
		}
	}

	const scheduledTime = new Date(event.scheduledTime).toLocaleString(['en-US'], {
		timeZone: 'America/Los_Angeles',
	});

	console.log(`trigger fired at ${event.cron}: ${wasSuccessful} with local time: ${scheduledTime}`);
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
					const fahrenheit = getFahrenheitFromSensor(result.payload);
					line = `Current temperature is ${fahrenheit}F.`;
				} else {
					line = `Had trouble connecting to the thermometer...`;
				}
				break;
			default:
				line = `I don’t recognize this. Try 'temperature'.`;
				break;
		}

		// let reply = await stockRequest(parsed.msg);
		// let line = `Current price (*${parsed.stock}*): ? USD $${reply.USD} (Last updated on ${reply.updated}).`;

		return slackResponse(line);
	} catch (e) {
		return simpleResponse(200, `Sorry, I had an issue retrieving anything: ${e}`);
	}
}
