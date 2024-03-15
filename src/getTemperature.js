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

export default getTemperature;
