const HOSTNAME = 'https://openapi.api.govee.com';

async function getTemperature(API_KEY) {
	const THERMOMETER_SKU = 'H5179';
	const THERMOMETER_DEVICE = 'AE:3C:18:CE:B9:51:BC:6D';

	const response = await fetch(`${HOSTNAME}/router/api/v1/device/state`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Govee-API-Key': API_KEY,
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

// src/index.js
var src_default = {
	async fetch(request, env, ctx) {
		return new Response(`Hello.`);
	},
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx) {
		const response = await getTemperature(env.GOVEE_API_KEY);
		let wasSuccessful = response.ok ? 'success' : 'fail';
		const result = await response.json();
		console.log('result', JSON.stringify(result, null, 4));

		const scheduledTime = new Date(event.scheduledTime).toLocaleString(['en-US'], {
			timeZone: 'America/Los_Angeles',
		});

		console.log(`trigger fired at ${event.cron}: ${wasSuccessful} with local time: ${scheduledTime}`);
	},
};
export { src_default as default };
//# sourceMappingURL=index.js.map
