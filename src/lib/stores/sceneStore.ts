import { writable } from "svelte/store";

export const CameraStore = writable({
    x: 0,
    y: 0,
    z: 30,
    rotX: 0,
    rotY: 0,
    rotZ: 0
});