import { Matrix } from './matrix';
import { RMatX, RMatY, RMatZ, TMatX, TMatY, TMatZ } from './transformationMatrices';
import { Vector3 } from './vector';

export function translateX(d: number, vector: Vector3): Vector3 {
	return multiply(TMatX(d), vector);
}

export function translateY(d: number, vector: Vector3): Vector3 {
	return multiply(TMatY(d), vector);
}

export function translateZ(d: number, vector: Vector3): Vector3 {
	return multiply(TMatZ(d), vector);
}

export function rotateX(phi: number, vector: Vector3): Vector3 {
	return multiply(RMatX(phi), vector);
}

export function rotateY(phi: number, vector: Vector3): Vector3 {
	return multiply(RMatY(phi), vector);
}

export function rotateZ(phi: number, vector: Vector3): Vector3 {
	return multiply(RMatZ(phi), vector);
}

export function multiply(a: Matrix, b: Vector3): Vector3;
export function multiply(a: Matrix, b: Matrix): Matrix;
export function multiply(a: Matrix, b: Matrix | Vector3): Matrix | Vector3 {
	const bMatrix = b instanceof Vector3 ? new Matrix(4, 1, [[b.x], [b.y], [b.z], [1]]) : b;

	if (a.cols !== bMatrix.rows) {
		throw new Error('Incompatible matrix sizes for multiplication');
	}

	const data: number[][] = [];
	for (let i = 0; i < a.rows; i++) {
		data[i] = [];
		for (let j = 0; j < bMatrix.cols; j++) {
			let sum = 0;
			for (let k = 0; k < a.cols; k++) {
				sum += a.data[i][k] * bMatrix.data[k][j];
			}
			data[i][j] = sum;
		}
	}

	if (b instanceof Vector3) {
		return new Vector3(data[0][0], data[1][0], data[2][0]);
	}
	return new Matrix(a.rows, bMatrix.cols, data);
}
