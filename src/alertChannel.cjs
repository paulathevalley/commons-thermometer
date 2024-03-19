// node --env-file=.env src/alertChannel.js
const { WebClient, ErrorCode } = require('@slack/web-api');

// Read a token from the environment variables
const token = process.env.BOT_USER_OAUTH_TOKEN;

// Initialize
const web = new WebClient(token);

// Given some known conversation ID (representing a public channel, private channel, DM or group DM)
const FREETHECANOE_CHANNEL_ID = 'C054JVDKQJE';
const conversationId = FREETHECANOE_CHANNEL_ID;

const post = async (temperature) => {
	try {
		// const response = await getThermometer(apiKey);
		// let wasSuccessful = response.ok ? 'success' : 'fail';

		const renderTemp = temperature ? `${temperature}F` : `too hot`;

		// Post a message to the channel, and await the result.
		// Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
		const result = await web.chat.postMessage({
			text: `The greenhouse is ${renderTemp}`,
			channel: conversationId,
		});

		// The result contains an identifier for the message, `ts`.
		console.log(`Successfully send message ${result.ts} in conversation ${conversationId}`);
	} catch (error) {
		// Check the code property, and when its a PlatformError, log the whole response.
		if (error.code === ErrorCode.PlatformError) {
			console.log(error.data);
		} else {
			// Some other error, oh no!
			console.log('Well, that was unexpected.');
		}
	}
};

module.exports = post;
