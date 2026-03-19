import { Matrix } from './matrix';
import { RMatX, RMatY, RMatZ, TMatX, TMatY, TMatZ } from './transformationMatrices';
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

const clamp = (value: number, min: number, max: number): number =>
	Math.max(min, Math.min(max, value));

const extractPosition = (transform: Matrix): Vector3 =>
	new Vector3(transform.data[0][3], transform.data[1][3], transform.data[2][3]);

export class ManipulatorLink {
	public startVector: Vector3 = new Vector3(0, 0, 0);
	public endVector: Vector3 = new Vector3(0, 0, 0);
	public angle: number = 0;

	constructor(
		public length: number,
		public axis: 'X' | 'Y' | 'Z',
		public angleRange: { min: number; max: number }
	) {}

	public setAngle(angle: number): void {
		this.angle = clamp(angle, this.angleRange.min, this.angleRange.max);
	}
}

export class Manipulator {
	public links: ManipulatorLink[];

	constructor(
		public worldPos: Vector3,
		links: ManipulatorLinkParams[]
	) {
		this.links = links.map((l) => new ManipulatorLink(l.length, l.axis, l.angleRange));
	}

	/**
	 * Build the world-origin transform from worldPos.
	 */
	private worldTransform(): Matrix {
		return Matrix.multiply(
			TMatX(this.worldPos.x),
			Matrix.multiply(TMatY(this.worldPos.y), TMatZ(this.worldPos.z))
		);
	}

	/**
	 * Forward kinematics: sets each link's startVector / endVector
	 * and returns the end-effector position.
	 *
	 * @param angles - joint angles in radians, one per link.
	 *                 Omit to reuse each link's current `.angle`.
	 */
	public computeFK(angles?: number[]): Vector3 {
		let T = this.worldTransform();

		for (let i = 0; i < this.links.length; i++) {
			const link = this.links[i];

			if (angles) {
				link.setAngle(angles[i]);
			}

			// The joint sits at the current accumulated position
			link.startVector = extractPosition(T);

			// Rotate around the joint axis by the link's angle
			T = Matrix.multiply(T, rotMat(link.axis, link.angle));

			// Translate along Y (the local "bone" direction) by the link length
			T = Matrix.multiply(T, TMatY(link.length));

			// Tip of this link
			link.endVector = extractPosition(T);
		}

		return extractPosition(T);
	}

	/**
	 * Set a single joint angle and recompute the full chain.
	 */
	public setJointAngle(index: number, angle: number): Vector3 {
		this.links[index].setAngle(angle);
		return this.computeFK();
	}

	/**
	 * Get all current joint angles.
	 */
	public getJointAngles(): number[] {
		return this.links.map((l) => l.angle);
	}

	/**
	 * Current end-effector position (last link's endVector).
	 */
	public get endEffector(): Vector3 {
		return this.links.length > 0
			? this.links[this.links.length - 1].endVector
			: new Vector3(this.worldPos.x, this.worldPos.y, this.worldPos.z);
	}

	/**
	 * Returns every transformation matrix in the chain (useful for Jacobians / IK).
	 * Element [i] is the cumulative transform up to and including link i.
	 */
	public getTransformChain(angles?: number[]): Matrix[] {
		const chain: Matrix[] = [];
		let T = this.worldTransform();

		for (let i = 0; i < this.links.length; i++) {
			const link = this.links[i];
			if (angles) link.setAngle(angles[i]);

			T = Matrix.multiply(T, rotMat(link.axis, link.angle));
			T = Matrix.multiply(T, TMatY(link.length));
			chain.push(T);
		}

		return chain;
	}
}