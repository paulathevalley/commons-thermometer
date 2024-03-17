import { getThermometer, getFahrenheitFromSensor } from './utils';
import { SlackAPIClient } from 'slack-web-api-client';

// import post from './alertChannel.js';
// const post = require('./alertChannel.js');

// SLACK_TOKEN is used to authenticate requests are from Slack.
// Keep this value secret.
let BOT_NAME = 'Thermo-Bot 🌡️';
let TOO_HOT = 85;
let TOO_COLD = 40;
let GARDEN_CHANNEL_ID = 'CD2SKK01Y';
let DEBUG_CHANNEL_ID = 'C054JVDKQJE';

let jsonHeaders = new Headers([['Content-Type', 'application/json']]);

// Using Service Worker syntax
// more: https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
addEventListener('fetch', (event) => {
	event.respondWith(slackWebhookHandler(event.request));
});

addEventListener('scheduled', (event) => {
	event.waitUntil(checkThermometer(event));
});

// "user":"U06PE5CJP63"
// "bot_id":"B06PX5XM24C"

let fetchedMessage;
const BOT_USER = 'U06PE5CJP63';
const BOT_ID = 'B06PX5XM24C';
async function fetchMessage(scheduledTime) {
	const client = new SlackAPIClient(BOT_USER_OAUTH_TOKEN);
	const scheduledTimeToUnixTimestamp = Math.floor(scheduledTime / 1000);
	try {
		// Call the conversations.history method using the built-in WebClient
		const result = await client.conversations.history({
			// The token you used to initialize your app
			token: BOT_USER_OAUTH_TOKEN,
			channel: DEBUG_CHANNEL_ID,
			// In a more realistic app, you may store ts data in a db
			// latest: ts,
			bot_id: 'B06PX5XM24C',
			// include all metadata
			include_all_metadata: true,
			// Only messages after this Unix timestamp will be included in results.
			oldest: scheduledTimeToUnixTimestamp,
			// Limit results
			// inclusive: true,
			// limit: 1,
		});

		const history = result.messages;
		const botHistory = history.filter((msg) => msg.bot_id === BOT_ID && msg.text.includes('<!here>'));

		console.log('fetched!!!!', JSON.stringify(botHistory, null, 4));
	} catch (error) {
		console.log('error');
		console.error(error);
	}
}

async function alertChannel(temp, condition) {
	const client = new SlackAPIClient(BOT_USER_OAUTH_TOKEN, { logLevel: 'debug' });
	const conversationId = DEBUG_CHANNEL_ID;
	console.log('alert channel!');
	switch (condition) {
		case 'hot':
			text = `<!here> :hot_face: The greenhouse is ${temp}F`;
			break;
		case 'cold':
			text = `<!here> :cold_face: The greenhouse is ${temp}F`;
			break;
		default:
			text = `<!here> The greenhouse is ${temp}F`;
			break;
	}
	try {
		const result = await client.chat.postMessage({
			text: text,
			channel: conversationId,
		});
		console.log(`Successfully send message ${result.ts} in conversation ${conversationId}`);
	} catch (error) {
		console.log('error', error);
		// Check the code property, and when its a PlatformError, log the whole response.
		// if (error.code === ErrorCode.PlatformError) {
		// console.log(error.data);
		// } else {
		// Some other error, oh no!
		console.log('Well, that was unexpected.');
		// }
	}
}

// The scheduled handler is invoked at the interval set in our wrangler.toml's
// [[triggers]] configuration.
async function checkThermometer(event) {
	// the cron triggers every 5 minutes. we want to check if a message was sent five minutes ago.
	const MS_PER_MINUTE = 60000;
	const sixMinutesAgo = new Date(event.scheduledTime - 6 * MS_PER_MINUTE);
	const latestMessage = await fetchMessage(sixMinutesAgo);
	console.log('fetch message!!', latestMessage);

	const response = await getThermometer(GOVEE_API_KEY);
	let wasSuccessful = response.ok ? 'success' : 'fail';

	if (response.ok) {
		const result = await response.json();
		const fahrenheit = getFahrenheitFromSensor(result.payload);
		if (fahrenheit > TOO_HOT) {
			await alertChannel(fahrenheit, 'hot');
		} else if (fahrenheit < TOO_COLD) {
			await alertChannel(fahrenheit, 'cold');
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
					line = `The greenhouse is currently ${fahrenheit}F.`;
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
