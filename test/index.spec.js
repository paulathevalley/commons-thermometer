import { env, SELF } from 'cloudflare:test';
import { expect, it } from 'vitest';
import '../src/index'; // Currently required to automatically rerun tests when `main` changes

it('dispatches fetch event', async () => {
	const response = await SELF.fetch('http://localhost:54460');
	const okData = '{"message":"Hi, I\'m Thermo-Bot 🌡️, a Slack bot for the greenhouse thermometer","status":200}';
	expect(await response.text()).toBe(okData);
});

it('dispatches fetch event for slash command', async () => {
	const formData = new FormData();
	formData.set('text', '');
	formData.set('token', env.SLACK_TOKEN);

	const request = new Request('http://localhost:54460', {
		method: 'POST',
		body: formData,
	});
	const response = await SELF.fetch(request);
	const result = await response.text();
	const resultJson = JSON.parse(result);
	expect(resultJson.response_type).toBe('in_channel');
	expect(resultJson.text).exist;
});

it('dispatches scheduled event', async () => {
	// `SELF` here points to the worker running in the current isolate.
	// This gets its handler from the `main` option in `vitest.config.ts`.
	// Importantly, it uses the exact `import("../src").default` instance we could
	// import in this file as its handler. Note the `SELF.scheduled()` method
	// is experimental, and requires the `service_binding_extra_handlers`
	// compatibility flag to be enabled.
	const result = await SELF.scheduled({
		scheduledTime: new Date(1000),
		cron: '30 * * * *',
	});
	expect(result.outcome).toBe('ok');
});
