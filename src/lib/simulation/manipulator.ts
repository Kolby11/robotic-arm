import { Matrix } from './matrix';
import { RMatX, RMatY, RMatZ, TMatY } from './transformationMatrices';
import { multiply } from './transform';
import { Vector3 } from './vector';
import type { ManipulatorLinkParams } from '$lib/types/manipulator';

const identity4 = () =>
	new Matrix(4, 4, [
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	]);

const rotMat = (axis: 'X' | 'Y' | 'Z', angle: number): Matrix => {
	if (axis === 'X') return RMatX(angle);
	if (axis === 'Y') return RMatY(angle);
	return RMatZ(angle);
};

export class ManipulatorLink {
	constructor(
		public length: number,
		public axis: 'X' | 'Y' | 'Z',
		public angleRange: { min: number; max: number }
	) {}
}

export class Manipulator {
	public links: ManipulatorLink[];

	constructor(
		public worldPos: Vector3,
		links: ManipulatorLinkParams[]
	) {
		this.links = links.map((l) => new ManipulatorLink(l.length, l.axis, l.angleRange));
	}

	/** Returns world-space position of each joint endpoint, in radians. */
	computeFK(anglesRad: number[]): Vector3[] {
		const positions: Vector3[] = [];
		let T = identity4();
		T.data[0][3] = this.worldPos.x;
		T.data[1][3] = this.worldPos.y;
		T.data[2][3] = this.worldPos.z;

		for (let i = 0; i < this.links.length; i++) {
			const angle = anglesRad[i] ?? 0;
			const step = multiply(rotMat(this.links[i].axis, angle), TMatY(this.links[i].length));
			T = multiply(T, step);
			positions.push(new Vector3(T.data[0][3], T.data[1][3], T.data[2][3]));
		}

		return positions;
	}
}
