// src/index.js
var src_default = {
	async fetch(request, env, ctx) {
		const date = new Date().toLocaleString(['en-US'], {
			timeZone: 'America/Los_Angeles',
		});
		console.log('currently: ', date);
		return new Response(`Hello! ${date}`);
	},
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx) {
		let resp = await fetch('https://api.cloudflare.com/client/v4/ips');
		let wasSuccessful = resp.ok ? 'success' : 'fail';
		const date = new Date().toLocaleString(['en-US'], {
			timeZone: 'America/Los_Angeles',
		});
		console.log('currently: ', date);
		console.log('scheduled time', event.scheduledTime);
		console.log(`trigger fired at ${event.cron}: ${wasSuccessful}`);
	},
};
export { src_default as default };
//# sourceMappingURL=index.js.map
