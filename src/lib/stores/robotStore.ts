import { writable } from 'svelte/store';

export class Joint {
	name: string;
	axis: Axis;
	min: number;
	max: number;
	value: number;
	readonly defaultValue: number;

	constructor(name: string, axis: Axis, min: number, max: number, value: number) {
		this.name = name;
		this.axis = axis;
		this.min = min;
		this.max = max;
		this.value = value;
		this.defaultValue = value;
	}

	reset() {
		this.value = this.defaultValue;
	}
}

export const robotStore = writable({
	joints: [
		new Joint('Base', 'Y', -180, 180, 0),
		new Joint('Shoulder', 'Z', -90, 90, 0),
		new Joint('Elbow', 'Z', -135, 45, 30),
		new Joint('Wrist Roll', 'Y', -180, 180, 0),
		new Joint('Wrist Pitch', 'Z', -90, 90, 0),
		new Joint('Wrist Yaw', 'Y', -180, 180, 0)
	],
	gripper: 0.3,
	defaultGripper: 0.3
});
