import { Tensor } from './tensor';
import { Vector3 } from './vector';

export class Matrix extends Tensor<number[][]> {
  constructor(public rows: number, public cols: number, data: number[][]) {
    super(data, [rows, cols]);
  }

  public static multiply<T extends Matrix | Vector3>(a: Matrix, b: T): T {
    const isVec3 = b instanceof Vector3;

    const bMatrix = isVec3
      ? new Matrix(4, 1, [[b.x], [b.y], [b.z], [1]])
      : (b as Matrix);

    if (a.cols !== bMatrix.rows) {
      throw new Error(`Dimension mismatch: ${a.cols} cols != ${bMatrix.rows} rows`);
    }

    const resultData: number[][] = Array.from({ length: a.rows }, () => []);
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < bMatrix.cols; j++) {
        let sum = 0;
        for (let k = 0; k < a.cols; k++) {
          sum += a.data[i][k] * bMatrix.data[k][j];
        }
        resultData[i][j] = sum;
      }
    }

    if (isVec3) {
      return new Vector3(resultData[0][0], resultData[1][0], resultData[2][0]) as T;
    }

    return new Matrix(a.rows, bMatrix.cols, resultData) as T;
  }
}
