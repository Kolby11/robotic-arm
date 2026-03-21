export abstract class Tensor<T = unknown> {
	constructor(
		public data: T,
		public shape: number[]
	) {}

	get isVector(): boolean {
		return this.shape.length === 1;
	}
	get isMatrix(): boolean {
		return this.shape.length === 2;
	}
}
