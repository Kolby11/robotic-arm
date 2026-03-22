import { Matrix } from '../spatial/matrix';
import { RMatX, RMatY, RMatZ, TMatZ } from '../spatial/transforms';
import { Vector3 } from '../spatial/vector';
import type { ManipulatorLinkParams } from './types';
import { Axis } from '../spatial/coordinates';

const rotMat = (axis: Axis, angle: number): Matrix => {
	if (axis === Axis.X) return RMatX(angle);
	if (axis === Axis.Y) return RMatY(angle);
	return RMatZ(angle);
};

const transMat = (length: number): Matrix => TMatZ(length);

const clamp = (value: number, min: number, max: number): number =>
	Math.max(min, Math.min(max, value));

const extractPosition = (transform: Matrix): Vector3 =>
	new Vector3(transform.data[0][3], transform.data[1][3], transform.data[2][3]);

export class ManipulatorLink {
	public startVector: Vector3 = new Vector3(0, 0, 0);
	public endVector: Vector3 = new Vector3(0, 0, 0);
	/** Full 4×4 homogeneous transform of this link's end frame in world space */
	public transform: Matrix = Matrix.identity(4);
	public readonly type: 'fixed' | 'revolute';
	public readonly length: number;
	public readonly rotationAxis: Axis;
	public readonly angleRange: { min: number; max: number } | null;
	public angle: number;

	constructor(params: ManipulatorLinkParams) {
		this.type = params.type;
		this.length = params.length;
		this.rotationAxis = params.axis;
		if (params.type === 'fixed') {
			this.angle = params.angle;
			this.angleRange = null;
		} else {
			this.angle = params.defaultAngle;
			this.angleRange = params.angleRange;
		}
	}

	private setAngle(angle: number): void {
		if (this.type === 'fixed' || this.angleRange === null) return;
		this.angle = clamp(angle, this.angleRange.min, this.angleRange.max);
	}

	public rotate(angle: number): void {
		if (this.type === 'fixed' || this.angleRange === null) return;
		this.setAngle(this.angle + angle);
	}
}

export class Manipulator {
	public links: ManipulatorLink[];
	private readonly linkParams: ManipulatorLinkParams[];

	constructor(
		public worldPos: Vector3,
		links: ManipulatorLinkParams[]
	) {
		this.linkParams = links;
		this.links = links.map((l) => new ManipulatorLink(l));
		this.update();
	}

	/** Returns a deep copy with the same world position and current joint angles. */
	public clone(): Manipulator {
		const copy = new Manipulator(
			new Vector3(this.worldPos.x, this.worldPos.y, this.worldPos.z),
			this.linkParams
		);
		this.links.forEach((link, i) => {
			copy.links[i].angle = link.angle;
		});
		copy.update();
		return copy;
	}

	/**
	 * Set joint angles, recompute the chain, and return all joint positions in world space.
	 * Index 0 = base origin, index N = end-effector tip.
	 */
	public computeFK(angles: number[]): Vector3[] {
		let angleIdx = 0;
		for (const link of this.links) {
			if (link.type === 'revolute' && angleIdx < angles.length) {
				link.setAngle(angles[angleIdx++]);
			}
		}
		this.update();
		const positions: Vector3[] = [this.links[0].startVector];
		for (const link of this.links) {
			positions.push(link.endVector);
		}
		return positions;
	}

	public update(): void {
		let transform = new Matrix(4, 4, [
			[1, 0, 0, this.worldPos.x],
			[0, 1, 0, this.worldPos.y],
			[0, 0, 1, this.worldPos.z],
			[0, 0, 0, 1]
		]);

		for (const link of this.links) {
			link.startVector = extractPosition(transform);
			transform = Matrix.multiply(transform, rotMat(link.rotationAxis, link.angle));
			transform = Matrix.multiply(transform, transMat(link.length));
			link.transform = transform;
			link.endVector = extractPosition(transform);
		}
	}
}
