export abstract class Tensor {
  constructor(public data: any, public shape: number[]) {}

  get isVector(): boolean { return this.shape.length === 1; }
  get isMatrix(): boolean { return this.shape.length === 2; }
}