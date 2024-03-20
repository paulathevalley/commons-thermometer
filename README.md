# commons-thermometer

A thermometer with wifi. An amateur cloudflare setup. A Slackbot named Thermo-bot.

<img width="675" alt="thermobot" src="https://github.com/paulathevalley/commons-thermometer/assets/768965/64e0f231-23e3-4059-b5c7-811fb89a5370">


## Local development

Create a `.dev.vars` with your secrets including access to Govee, `GOVEE_API_KEY`, and Slack, `SLACK_TOKEN`, `BOT_USER_OAUTH_TOKEN`. A matching encrypted variable should be created for the worker on the Cloudflare dashboard. [Wrangler Environments](https://developers.cloudflare.com/workers/wrangler/environments/)

```sh
nvm use stable
npm install
npm run dev
```

To test `scheduled()` handlers in local development:

```sh
npx wrangler dev --test-scheduled

curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

References:

- https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/

## Govee API

The Govee Wi-Fi Thermo-Hygrometer has an API available to use for non-commercial purposes: https://developer.govee.com/reference/get-you-devices

The thermometer returns a `sensorTemperature` and a `sensorHumidity` object with values. Currently the temperature is in Fahrenheit.

The API is subject to change without notice.

References:

- https://developer.govee.com/discuss/65f48c388e659c00682ea059

## Slack Web API

The slack web API does not currently support Cloudflare workers: https://github.com/slackapi/node-slack-sdk/issues/1335

A third-party library, `slack-web-api-client`, _does_ support Cloudflare workers: https://github.com/seratch/slack-web-api-client so we are using this instead.

References:

- https://blog.cloudflare.com/building-a-serverless-slack-bot-using-cloudflare-workers/
- https://developers.cloudflare.com/workers/tutorials/build-a-slackbot/

## Cloudflare Workers

We created a worker following the [Guide](https://developers.cloudflare.com/workers/get-started/guide/) on Cloudflare.

We are using [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) to test locally and deploy to Cloudflare.

We are using two handlers for our Slackbot: [fetch()](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/) and [scheduled()](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/). When a human uses the bot’s slash command, the `fetch` handler will run. We set up [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) on the Cloudflare account dashboard that will run the `scheduled` handler at certain intervals of time. Ideally the `wrangler.toml` file here would be in sync with the triggers set on Cloudflare.

We are using "Service Worker Syntax" but may want to migrate to es modules someday: https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
