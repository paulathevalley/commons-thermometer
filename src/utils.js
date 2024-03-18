const HOSTNAME = 'https://openapi.api.govee.com';

async function getThermometer(key) {
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

function getFahrenheitFromSensor(payload) {
	const sensor = payload.capabilities.find((c) => c.instance === 'sensorTemperature');
	/* Observational data
	16, ~51F
	47, 81.6F
	50, 84.1F
	*/
	return sensor.state.value + 35;
}

export { getThermometer, getFahrenheitFromSensor };
