import { derived } from 'svelte/store';
import { robotStore } from '$lib/stores/robotStore';
import { Manipulator } from './manipulator';
import { Vector3 } from './vector';
import { manipulatorLinksData } from '$lib/data/data';

export const manipulator = new Manipulator(new Vector3(0, 0, 0), manipulatorLinksData);

const DEG2RAD = Math.PI / 180;

/** World-space positions of all 6 joint endpoints, recomputed on every store change. */
export const fkStore = derived(robotStore, ($r) =>
	manipulator.computeFK($r.joints.map((j) => j.value * DEG2RAD))
);
