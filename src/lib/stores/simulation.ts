import { writable, derived } from 'svelte/store';
import { Manipulator } from '../simulation/manipulator/manipulator';
import { Vector3 } from '../simulation/spatial/vector';
import { manipulatorLinksData } from '$lib/data/data';
import { calculateManipulatorMantle, type MantleResult, type MantleParams, DEFAULT_MANTLE_PARAMS } from '../simulation/manipulator/calculateMantle';
export type { MantleParams };
export { DEFAULT_MANTLE_PARAMS };

const DEG2RAD = Math.PI / 180;

const _manipulator = new Manipulator(new Vector3(0, 0, 0), manipulatorLinksData);

function createManipulatorStore() {
	const { subscribe, set } = writable(_manipulator);
	return {
		subscribe,
		setJointAngle(revoluteIndex: number, angleDeg: number) {
			const revolutes = _manipulator.links.filter((l) => l.type === 'revolute');
			const link = revolutes[revoluteIndex];
			if (!link || !link.angleRange) return;
			const clamped = Math.max(link.angleRange.min, Math.min(link.angleRange.max, angleDeg));
			link.angle = clamped * DEG2RAD;
			_manipulator.update();
			set(_manipulator);
		}
	};
}

export const manipulatorStore = createManipulatorStore();

export const fkStore = derived(manipulatorStore, ($m) => {
	const positions: Vector3[] = [$m.links[0].startVector];
	for (const link of $m.links) {
		positions.push(link.endVector);
	}
	return positions;
});

/** Outer (max reach) and inner (min reach) mantle surfaces. Null until calculated. */
export const mantleStore = writable<MantleResult | null>(null);

/** Snapshots the current manipulator state and runs the mantle calculation on the copy. */
export function triggerMantleCalculation(params: MantleParams = DEFAULT_MANTLE_PARAMS) {
	const snapshot = _manipulator.clone();
	mantleStore.set(calculateManipulatorMantle(snapshot, params));
}
