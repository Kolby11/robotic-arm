import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { mantleStore } from '$lib/stores/simulation';
import { themeStore } from '$lib/stores/themeStore';
import type { MantleResult } from '$lib/simulation/manipulator/calculateMantle';

// Materials
const outerMantleMat = new THREE.MeshStandardMaterial({
	color: 0x4d96ff,
	transparent: true,
	opacity: 0.18,
	side: THREE.FrontSide,
	depthWrite: false
});
const innerMantleMat = new THREE.MeshStandardMaterial({
	color: 0xf7a94f,
	transparent: true,
	opacity: 0.14,
	side: THREE.FrontSide,
	depthWrite: false
});
const dimLineMat = new THREE.LineDashedMaterial({
	color: 0x444444,
	dashSize: 7,
	gapSize: 4,
	transparent: true,
	opacity: 0.6
});
const tickMat = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.75 });

const THEME_LINE_COLORS = {
	light: { dim: 0x444444, tick: 0x333333, label: 'color:#1e293b;background:rgba(255,255,255,0.85);border:1px solid rgba(0,0,0,0.12)' },
	dark:  { dim: 0x8899bb, tick: 0xaabbcc, label: 'color:#e2e8f0;background:rgba(20,20,30,0.85);border:1px solid rgba(255,255,255,0.15)' }
} as const;

let currentTheme: 'light' | 'dark' = 'light';

function resampleRing(ring: { x: number; y: number; z: number }[], nAz: number): THREE.Vector3[] {
	const pts = ring.slice(0, -1);
	return Array.from({ length: nAz }, (_, j) => {
		const target = -Math.PI + (2 * Math.PI * j) / nAz;
		let best = pts[0],
			bestDiff = Infinity;
		for (const p of pts) {
			const diff = Math.abs(Math.atan2(p.y, p.x) - target);
			const wrapped = Math.min(diff, 2 * Math.PI - diff);
			if (wrapped < bestDiff) {
				bestDiff = wrapped;
				best = p;
			}
		}
		return new THREE.Vector3(best.x, best.y, best.z);
	});
}

function buildMantleMesh(
	rings: { x: number; y: number; z: number }[][],
	mat: THREE.Material
): THREE.Mesh {
	const N_AZ = 48;
	const resampled = rings.filter((r) => r.length > 2).map((r) => resampleRing(r, N_AZ));

	const verts: number[] = [];
	const push = (v: THREE.Vector3) => verts.push(v.x, v.y, v.z);

	for (let ri = 0; ri < resampled.length - 1; ri++) {
		const top = resampled[ri],
			bot = resampled[ri + 1];
		for (let ai = 0; ai < N_AZ; ai++) {
			const ai1 = (ai + 1) % N_AZ;
			push(top[ai]);
			push(bot[ai]);
			push(top[ai1]);
			push(top[ai1]);
			push(bot[ai]);
			push(bot[ai1]);
		}
	}

	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
	geo.computeVertexNormals();
	return new THREE.Mesh(geo, mat);
}

function makeLine(
	from: THREE.Vector3,
	to: THREE.Vector3,
	mat: THREE.LineBasicMaterial | THREE.LineDashedMaterial,
	dashed = false
): THREE.Line {
	const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), mat);
	if (dashed) line.computeLineDistances();
	return line;
}

function makeLabel(text: string): CSS2DObject {
	const div = document.createElement('div');
	const t = THEME_LINE_COLORS[currentTheme];
	div.style.cssText = [
		t.label,
		'font-size:11px',
		'font-family:ui-monospace,monospace',
		'padding:2px 7px',
		'border-radius:4px',
		'white-space:nowrap',
		'letter-spacing:0.04em'
	].join(';');
	div.textContent = text;
	return new CSS2DObject(div);
}

function buildDimensions(group: THREE.Group, result: MantleResult) {
	const PAD = 25;
	const TICK = 10;
	const t = THEME_LINE_COLORS[currentTheme];

	const themeDimMat = new THREE.LineDashedMaterial({
		color: t.dim,
		dashSize: 7,
		gapSize: 4,
		transparent: true,
		opacity: 0.6
	});
	const themeTickMat = new THREE.LineBasicMaterial({ color: t.tick, transparent: true, opacity: 0.75 });

	// Find extremes in raw simulation units
	let zMax = -Infinity,
		rMax = 0;
	for (const ring of result.outer)
		for (const p of ring) {
			if (p.z > zMax) zMax = p.z;
			const r = Math.sqrt(p.x * p.x + p.y * p.y);
			if (r > rMax) rMax = r;
		}

	// Height dimension — vertical dashed line to the right of the workspace
	const hX = rMax + PAD;
	group.add(
		makeLine(
			new THREE.Vector3(hX - TICK * 2, 0, zMax),
			new THREE.Vector3(hX + TICK * 2, 0, zMax),
			themeTickMat
		)
	);
	group.add(
		makeLine(
			new THREE.Vector3(hX - TICK * 2, 0, 0),
			new THREE.Vector3(hX + TICK * 2, 0, 0),
			themeTickMat
		)
	);
	group.add(
		makeLine(new THREE.Vector3(hX, 0, 0), new THREE.Vector3(hX, 0, zMax), themeDimMat, true)
	);
	const hLabel = makeLabel(`H = ${Math.round(zMax)}`);
	hLabel.position.set(hX + 12, 0, zMax / 2);
	group.add(hLabel);

	// Horizontal reach dimension — horizontal dashed line below the base
	const rZ = -PAD;
	group.add(
		makeLine(
			new THREE.Vector3(rMax, 0, rZ - TICK * 2),
			new THREE.Vector3(rMax, 0, rZ + TICK * 2),
			themeTickMat
		)
	);
	group.add(
		makeLine(
			new THREE.Vector3(0, 0, rZ - TICK * 2),
			new THREE.Vector3(0, 0, rZ + TICK * 2),
			themeTickMat
		)
	);
	group.add(
		makeLine(new THREE.Vector3(0, 0, rZ), new THREE.Vector3(rMax, 0, rZ), themeDimMat, true)
	);
	const rLabel = makeLabel(`R = ${Math.round(rMax)}`);
	rLabel.position.set(rMax / 2, 0, rZ - 12);
	group.add(rLabel);
}

export function createMantle(
	scene: THREE.Scene,
	showDimensions: boolean = false
): { unsub: () => void; cleanup: () => void } {
	const measureGroup = new THREE.Group();
	scene.add(measureGroup);

	let outerMesh: THREE.Mesh | null = null;
	let innerMesh: THREE.Mesh | null = null;
	let lastResult: MantleResult | null = null;

	function rebuild(result: MantleResult | null) {
		if (outerMesh) {
			scene.remove(outerMesh);
			outerMesh.geometry.dispose();
			outerMesh = null;
		}
		if (innerMesh) {
			scene.remove(innerMesh);
			innerMesh.geometry.dispose();
			innerMesh = null;
		}
		measureGroup.clear();
		if (!result) return;

		outerMesh = buildMantleMesh(result.outer, outerMantleMat);
		innerMesh = buildMantleMesh(result.inner, innerMantleMat);
		scene.add(outerMesh, innerMesh);
		if (showDimensions) buildDimensions(measureGroup, result);
	}

	const unsubMantle = mantleStore.subscribe((result) => {
		lastResult = result;
		rebuild(result);
	});

	const unsubTheme = themeStore.subscribe((theme) => {
		currentTheme = theme;
		// Update dimension line colors via material
		dimLineMat.color.set(THEME_LINE_COLORS[theme].dim);
		tickMat.color.set(THEME_LINE_COLORS[theme].tick);
		dimLineMat.needsUpdate = true;
		tickMat.needsUpdate = true;
		// Rebuild dimensions with new label colors if shown
		if (showDimensions && lastResult) {
			measureGroup.clear();
			buildDimensions(measureGroup, lastResult);
		}
	});

	const unsub = () => {
		unsubMantle();
		unsubTheme();
	};

	const cleanup = () => {
		if (outerMesh) scene.remove(outerMesh);
		if (innerMesh) scene.remove(innerMesh);
	};

	return { unsub, cleanup };
}
