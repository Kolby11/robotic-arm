import { Matrix } from './matrix';

export const TMatX = (d: number) => {
	return new Matrix(4, 4, [
		[1, 0, 0, d],
		[0, 1, 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	]);
};

export const TMatY = (d: number) => {
	return new Matrix(4, 4, [
		[1, 0, 0, 0],
		[0, 1, 0, d],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	]);
};

export const TMatZ = (d: number) => {
	return new Matrix(4, 4, [
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 1, d],
		[0, 0, 0, 1]
	]);
};

export const RMatX = (phi: number) => {
	return new Matrix(4, 4, [
		[1, 0, 0, 0],
		[0, Math.cos(phi), -Math.sin(phi), 0],
		[0, Math.sin(phi), Math.cos(phi), 0],
		[0, 0, 0, 1]
	]);
};

export const RMatY = (phi: number) => {
	return new Matrix(4, 4, [
		[Math.cos(phi), 0, Math.sin(phi), 0],
		[0, 1, 0, 0],
		[-Math.sin(phi), 0, Math.cos(phi), 0],
		[0, 0, 0, 1]
	]);
};

export const RMatZ = (phi: number) => {
	return new Matrix(4, 4, [
		[Math.cos(phi), -Math.sin(phi), 0, 0],
		[Math.sin(phi), Math.cos(phi), 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	]);
};
