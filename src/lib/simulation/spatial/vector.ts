import { Matrix } from './matrix';
import { Tensor } from './tensor';
import { RMatX, RMatY, RMatZ, TMatX, TMatY, TMatZ } from './transforms';

export class Vector extends Tensor<number[]> {
	constructor(data: number[]) {
		super(data, [data.length]);
	}

	get size(): number {
		return this.shape[0];
	}
}

export class Vector3 extends Vector {
	constructor(x: number, y: number, z: number) {
		super([x, y, z]);
	}

	get x() {
		return this.data[0];
	}
	get y() {
		return this.data[1];
	}
	get z() {
		return this.data[2];
	}

	public translateX(d: number, vector: Vector3): Vector3 {
		return Matrix.multiply(TMatX(d), vector);
	}

	public translateY(d: number, vector: Vector3): Vector3 {
		return Matrix.multiply(TMatY(d), vector);
	}

	public translateZ(d: number, vector: Vector3): Vector3 {
		return Matrix.multiply(TMatZ(d), vector);
	}

	public rotateX(phi: number, vector: Vector3): Vector3 {
		return Matrix.multiply(RMatX(phi), vector);
	}

	public rotateY(phi: number, vector: Vector3): Vector3 {
		return Matrix.multiply(RMatY(phi), vector);
	}

	public rotateZ(phi: number, vector: Vector3): Vector3 {
		return Matrix.multiply(RMatZ(phi), vector);
	}
}
