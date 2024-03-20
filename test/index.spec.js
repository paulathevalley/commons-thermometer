// TODO: vitest-pool-workers expects es-modules

// import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
// import { describe, it, expect } from 'vitest';
// Could import any other source file/function here
// import worker from '../src/index.js';

// const WORKER_URL = 'https://commons-thermometer.paula-lavalle.workers.dev/';
// describe('Hello World worker', () => {
// 	it('responds with Hello World!', async () => {
// 		const request = new Request(WORKER_URL);
// 		// Create an empty context to pass to `worker.fetch()`
// 		const ctx = createExecutionContext();
// 		const response = await worker.fetch(request, env, ctx);
// 		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
// 		await waitOnExecutionContext(ctx);
// 		expect(await response.text()).toBe('Hello World!');
// 	});
// });

// import { SELF } from 'cloudflare:test';
// import '../src/index';

// it('dispatches fetch event', async () => {
// 	const response = await SELF.fetch('https://commons-thermometer.paula-lavalle.workers.dev/');
// 	expect(await response.text()).toMatchInlineSnapshot();
// });
