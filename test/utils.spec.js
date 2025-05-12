import { expect, it } from 'vitest';
import { getFahrenheitFromSensor } from '../src/utils';

const generatePayload = (value) => {
	return {
		capabilities: [{ instance: 'sensorTemperature', state: { value: value } }],
	};
};

it('getFahrenheitFromSensor parses sensor value', () => {
	const floatPayload = generatePayload(52.251);
	expect(getFahrenheitFromSensor(floatPayload)).toBe('52');
});

it('getFahrenheitFromSensor throws error', () => {
	const invalidValue = generatePayload('ok');
	const emptyValue = generatePayload('');
	const nullValue = generatePayload(null);
	const undefinedValue = generatePayload(undefined);
	expect(() => getFahrenheitFromSensor(invalidValue)).toThrowError();
	expect(() => getFahrenheitFromSensor(emptyValue)).toThrowError();
	expect(() => getFahrenheitFromSensor(nullValue)).toThrowError();
	expect(() => getFahrenheitFromSensor(undefinedValue)).toThrowError();
});
