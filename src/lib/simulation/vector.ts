export class Vector {
	constructor(public data: number[]) {}
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
}
