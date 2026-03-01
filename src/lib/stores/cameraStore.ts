import { writable } from 'svelte/store';
import { Quaternion, Vector3 } from 'three';

export const cameraStore = writable({
	position: new Vector3(0, 0, 30),
	target: new Vector3(0, 1.5, 0),
	quaternion: new Quaternion()
});
