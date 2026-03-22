import { Manipulator } from './manipulator';
import { Vector3 } from '../spatial/vector';

const DEG2RAD = Math.PI / 180;

export interface MantleParams {
	stepsPerJoint: number; // samples per joint  (e.g. 10 → 10^5 = 100 000)
	azimuthBins: number; // horizontal slices around the vertical axis
	elevationBins: number; // vertical slices
}

export const DEFAULT_MANTLE_PARAMS: MantleParams = {
	stepsPerJoint: 10,
	azimuthBins: 48,
	elevationBins: 50
};

export interface MantleResult {
	outer: Vector3[][];
	inner: Vector3[][];
}

/**
 * Samples the full reachable workspace by sweeping all joints, then for each
 * discrete direction (azimuth × elevation) keeps the globally furthest (outer)
 * and closest (inner) end-effector position. Returns both as sorted latitude
 * rings for connected-line rendering.
 */
export function calculateManipulatorMantle(
	manipulator: Manipulator,
	params: MantleParams = DEFAULT_MANTLE_PARAMS
): MantleResult {
	const { stepsPerJoint, azimuthBins, elevationBins } = params;

	const revolutes = manipulator.links.filter((l) => l.type === 'revolute' && l.angleRange !== null);
	const savedAngles = revolutes.map((l) => l.angle);

	const angleSamples = revolutes.map((link) => {
		const { min, max } = link.angleRange!;
		const step = (max - min) / (stepsPerJoint - 1);
		return Array.from({ length: stepsPerJoint }, (_, i) => min + i * step);
	});

	type Bin = { point: Vector3; distSq: number };
	const outerBins: (Bin | null)[][] = Array.from({ length: elevationBins }, () =>
		new Array<Bin | null>(azimuthBins).fill(null)
	);
	const innerBins: (Bin | null)[][] = Array.from({ length: elevationBins }, () =>
		new Array<Bin | null>(azimuthBins).fill(null)
	);

	function sweep(jointIdx: number) {
		if (jointIdx === revolutes.length) {
			manipulator.update();
			const ee = manipulator.links[manipulator.links.length - 1].endVector;
			const { x, y, z } = ee;
			const r = Math.sqrt(x * x + y * y + z * z);
			if (r < 1e-6 || z < 0) return;

			// Z-up: azimuth in XY plane, elevation from XY plane toward Z
			const azimuth = Math.atan2(y, x);
			const elevation = Math.asin(Math.max(-1, Math.min(1, z / r)));

			const ai = Math.floor(((azimuth + Math.PI) / (2 * Math.PI)) * azimuthBins) % azimuthBins;
			const ei = Math.min(
				elevationBins - 1,
				Math.floor(((elevation + Math.PI / 2) / Math.PI) * elevationBins)
			);

			const d = x * x + y * y + z * z;
			const pt = new Vector3(x, y, z);

			if (!outerBins[ei][ai] || d > outerBins[ei][ai]!.distSq)
				outerBins[ei][ai] = { point: pt, distSq: d };

			if (!innerBins[ei][ai] || d < innerBins[ei][ai]!.distSq)
				innerBins[ei][ai] = { point: pt, distSq: d };

			return;
		}
		for (const angle of angleSamples[jointIdx]) {
			revolutes[jointIdx].angle = angle * DEG2RAD;
			sweep(jointIdx + 1);
		}
	}

	sweep(0);

	revolutes.forEach((link, i) => {
		link.angle = savedAngles[i];
	});
	manipulator.update();

	function toRings(bins: (Bin | null)[][]): Vector3[][] {
		const rings: Vector3[][] = [];
		for (let ei = 0; ei < elevationBins; ei++) {
			const ring: Array<{ ai: number; point: Vector3 }> = [];
			for (let ai = 0; ai < azimuthBins; ai++) {
				const bin = bins[ei][ai];
				if (bin) ring.push({ ai, point: bin.point });
			}
			if (ring.length < 2) continue;
			ring.sort((a, b) => a.ai - b.ai);
			const pts = ring.map((r) => r.point);
			pts.push(pts[0]); // close the ring
			rings.push(pts);
		}
		return rings;
	}

	return { outer: toRings(outerBins), inner: toRings(innerBins) };
}
