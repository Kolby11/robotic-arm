import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { themeStore } from '$lib/stores/themeStore';

export interface SceneContext {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	labelRenderer: CSS2DRenderer;
	container: HTMLElement;
	unsubTheme: () => void;
}

const THEMES = {
	light: { bg: 0xf0eeeb, gridCenter: 0xaaaaaa, gridLine: 0xcccccc },
	dark: { bg: 0x1a1a1f, gridCenter: 0x444455, gridLine: 0x2a2a35 }
} as const;

export function createScene(canvas: HTMLCanvasElement): SceneContext {
	const container = canvas.parentElement!;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(THEMES.light.bg);

	const camera = new THREE.PerspectiveCamera(
		60,
		canvas.clientWidth / canvas.clientHeight,
		1,
		10000
	);
	camera.position.set(600, 600, 300);
	camera.up.set(0, 0, 1);
	camera.lookAt(0, 0, 159);

	// WebGL renderer
	const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
	renderer.shadowMap.enabled = true;
	renderer.setClearColor(THEMES.light.bg);

	const labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
	labelRenderer.domElement.style.cssText =
		'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
	container.appendChild(labelRenderer.domElement);

	scene.add(new THREE.AmbientLight(0xffffff, 0.4));
	const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
	dirLight.position.set(500, 500, 800);
	dirLight.castShadow = true;
	scene.add(dirLight);

	const grid = new THREE.GridHelper(2000, 40, THEMES.light.gridCenter, THEMES.light.gridLine);
	grid.rotation.x = Math.PI / 2;
	scene.add(grid);

	const unsubTheme = themeStore.subscribe((theme) => {
		const t = THEMES[theme];
		(scene.background as THREE.Color).set(t.bg);
		renderer.setClearColor(t.bg);
		scene.remove(grid);
		const mat = grid.material as THREE.LineBasicMaterial;
		mat.dispose();
		grid.geometry.dispose();
		const newGrid = new THREE.GridHelper(2000, 40, t.gridCenter, t.gridLine);
		newGrid.rotation.x = Math.PI / 2;
		grid.geometry = newGrid.geometry;
		grid.material = newGrid.material;
		scene.add(grid);
	});

	return { scene, camera, renderer, labelRenderer, container, unsubTheme };
}
