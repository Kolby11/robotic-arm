<script lang="ts">
	import { onMount } from 'svelte';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import * as THREE from 'three';
	import { cameraStore, cameraSnapStore } from '$lib/stores/cameraStore';
	import ViewIndicator from '$lib/components/ViewIndicator.svelte';
	import { createScene } from '$lib/scene/createScene';
	import { createArm } from '$lib/scene/createArm';
	import { createMantle } from '$lib/scene/createMantle';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		let animId: number;

		const { scene, camera, renderer, labelRenderer, container, unsubTheme } = createScene(canvas);

		const controls = new OrbitControls(camera, canvas);
		controls.target.set(0, 0, 159);
		controls.update();

		const pushCamera = () =>
			cameraStore.set({
				position: camera.position,
				target: controls.target || new THREE.Vector3(0, 0, 159),
				quaternion: camera.quaternion
			});
		controls.addEventListener('change', pushCamera);
		pushCamera();

		let snap: { pos: THREE.Vector3; up: THREE.Vector3 } | null = null;
		const unsubSnap = cameraSnapStore.subscribe((s) => {
			if (!s) return;
			snap = { pos: s.position.clone(), up: s.up.clone() };
			cameraSnapStore.set(null);
		});

		const { unsub: unsubArm } = createArm(scene);
		const { unsub: unsubMantle, cleanup: cleanupMantle } = createMantle(scene);

		const ro = new ResizeObserver(() => {
			const w = container.clientWidth;
			const h = container.clientHeight;
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h, false);
			labelRenderer.setSize(w, h);
			renderer.render(scene, camera);
		});
		ro.observe(container);

		const animate = () => {
			animId = requestAnimationFrame(animate);

			if (snap) {
				controls.enabled = false;
				camera.position.lerp(snap.pos, 0.12);
				camera.up.lerp(snap.up, 0.12).normalize();
				camera.lookAt(controls.target);
				if (camera.position.distanceTo(snap.pos) < 0.005) {
					camera.position.copy(snap.pos);
					camera.up.copy(snap.up);
					camera.lookAt(controls.target);
					controls.update();
					controls.enabled = true;
					snap = null;
				}
			} else {
				controls.update();
			}

			renderer.render(scene, camera);
			labelRenderer.render(scene, camera);
		};
		animate();

		return () => {
			unsubArm();
			unsubMantle();
			cleanupMantle();
			unsubSnap();
			unsubTheme();
			ro.disconnect();
			cancelAnimationFrame(animId);
			renderer.dispose();
			labelRenderer.domElement.remove();
		};
	});
</script>

<div class="relative h-full w-full flex-1">
	<canvas bind:this={canvas} class="absolute inset-0 h-full w-full"></canvas>
	<ViewIndicator />
</div>
