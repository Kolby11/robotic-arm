import * as THREE from 'three';
import { get } from 'svelte/store';
import { manipulatorStore } from '$lib/stores/simulation';
import { Matrix } from '$lib/simulation/spatial/matrix';
import { Vector3 as SimVec3 } from '$lib/simulation/spatial/vector';

const AXIS_LEN = 20;
const AXIS_HEAD_LEN = 7;
const AXIS_HEAD_W = 3.5;

type LinkAxes = [THREE.ArrowHelper, THREE.ArrowHelper, THREE.ArrowHelper];

function getFrameAxes(transform: Matrix): { x: THREE.Vector3; y: THREE.Vector3; z: THREE.Vector3 } {
	const origin = Matrix.multiply(transform, new SimVec3(0, 0, 0));
	const xTip = Matrix.multiply(transform, new SimVec3(1, 0, 0));
	const yTip = Matrix.multiply(transform, new SimVec3(0, 1, 0));
	const zTip = Matrix.multiply(transform, new SimVec3(0, 0, 1));
	return {
		x: new THREE.Vector3(xTip.x - origin.x, xTip.y - origin.y, xTip.z - origin.z),
		y: new THREE.Vector3(yTip.x - origin.x, yTip.y - origin.y, yTip.z - origin.z),
		z: new THREE.Vector3(zTip.x - origin.x, zTip.y - origin.y, zTip.z - origin.z)
	};
}

function makeAxes(): LinkAxes {
	const o = new THREE.Vector3();
	return [
		new THREE.ArrowHelper(
			new THREE.Vector3(1, 0, 0),
			o,
			AXIS_LEN,
			0xef4444,
			AXIS_HEAD_LEN,
			AXIS_HEAD_W
		),
		new THREE.ArrowHelper(
			new THREE.Vector3(0, 1, 0),
			o,
			AXIS_LEN,
			0x22c55e,
			AXIS_HEAD_LEN,
			AXIS_HEAD_W
		),
		new THREE.ArrowHelper(
			new THREE.Vector3(0, 0, 1),
			o,
			AXIS_LEN,
			0x3b82f6,
			AXIS_HEAD_LEN,
			AXIS_HEAD_W
		)
	];
}

function applyAxes(
	axes: LinkAxes,
	pos: THREE.Vector3,
	dirs: { x: THREE.Vector3; y: THREE.Vector3; z: THREE.Vector3 }
) {
	const [xArr, yArr, zArr] = axes;
	xArr.position.copy(pos);
	yArr.position.copy(pos);
	zArr.position.copy(pos);
	xArr.setDirection(dirs.x.clone().normalize());
	yArr.setDirection(dirs.y.clone().normalize());
	zArr.setDirection(dirs.z.clone().normalize());
}

export function createArm(scene: THREE.Scene): { unsub: () => void } {
	const jointMat = new THREE.MeshStandardMaterial({
		color: 0xf7a94f,
		metalness: 0.5,
		roughness: 0.4
	});
	const armMat = new THREE.MeshStandardMaterial({
		color: 0x8e9199,
		metalness: 0.5,
		roughness: 0.4
	});

	const baseGroup = new THREE.Group();
	scene.add(baseGroup);

	const jointGroups: THREE.Group[] = [];
	const linkAxes: LinkAxes[] = [];

	get(manipulatorStore).links.forEach((link) => {
		const group = new THREE.Group();
		baseGroup.add(group);

		const mat = armMat;
		const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, link.length, 16), mat);
		cylinder.position.z = link.length / 2;
		cylinder.rotation.x = Math.PI / 2;
		cylinder.castShadow = true;
		group.add(cylinder);
		group.add(new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), jointMat));
		jointGroups.push(group);

		const axes = makeAxes();
		scene.add(...axes);
		linkAxes.push(axes);
	});

	const unsub = manipulatorStore.subscribe(($m) => {
		$m.links.forEach((link, i) => {
			const g = jointGroups[i];
			if (!g) return;

			const startPos = new THREE.Vector3(
				link.startVector.x,
				link.startVector.y,
				link.startVector.z
			);
			const endPos = new THREE.Vector3(link.endVector.x, link.endVector.y, link.endVector.z);
			const dirs = getFrameAxes(link.transform);

			g.position.copy(startPos);
			g.setRotationFromMatrix(new THREE.Matrix4().makeBasis(dirs.x, dirs.y, dirs.z));

			applyAxes(linkAxes[i], endPos, dirs);
		});
	});

	return { unsub };
}
