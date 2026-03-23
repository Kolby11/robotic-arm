<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import { cameraStore, cameraSnapStore } from '$lib/stores/cameraStore';
	import ViewIndicator from '$lib/components/ViewIndicator.svelte';
	import { manipulatorStore, fkStore, mantleStore } from '$lib/stores/simulation';
	import { Axis } from '$lib/simulation/spatial/coordinates';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		let animId: number;

		// ── Scene ──────────────────────────────────────────────
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x1f1f1f);

		// ── Camera ─────────────────────────────────────────────
		const camera = new THREE.PerspectiveCamera(
			60,
			canvas.clientWidth / canvas.clientHeight,
			0.1,
			100
		);
		camera.position.set(6, -6, 4);
		camera.up.set(0, 0, 1);
		camera.lookAt(0, 0, 1.5);

		// ── Renderer ───────────────────────────────────────────
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
		renderer.shadowMap.enabled = true;
		renderer.setClearColor(0x1f1f1f);

		// ── Orbit controls ─────────────────────────────────────
		const controls = new OrbitControls(camera, canvas);
		controls.target.set(0, 0, 1.5);
		controls.update();

		const pushCamera = () =>
			cameraStore.set({
				position: camera.position,
				target: controls.target || new THREE.Vector3(0, 0, 1.5),
				quaternion: camera.quaternion
			});

		controls.addEventListener('change', pushCamera);
		pushCamera();

		// ── Snap-to-view ────────────────────────────────────────
		let snap: { pos: THREE.Vector3; up: THREE.Vector3 } | null = null;
		const unsubSnap = cameraSnapStore.subscribe((s) => {
			if (!s) return;
			snap = { pos: s.position.clone(), up: s.up.clone() };
			cameraSnapStore.set(null);
		});

		// ── Lights ─────────────────────────────────────────────
		scene.add(new THREE.AmbientLight(0xffffff, 0.4));
		const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
		dirLight.position.set(5, 5, 8);
		dirLight.castShadow = true;
		scene.add(dirLight);

		// ── Grid (XY plane — floor in Z-up) ────────────────────
		const grid = new THREE.GridHelper(10, 20, 0x626262, 0x3d3d3d);
		grid.rotation.x = Math.PI / 2;
		scene.add(grid);

		// ── Materials ──────────────────────────────────────────
		const baseMat = new THREE.MeshStandardMaterial({
			color: 0x4f8ef7,
			metalness: 0.6,
			roughness: 0.3
		});
		const jointMat = new THREE.MeshStandardMaterial({
			color: 0xf7a94f,
			metalness: 0.5,
			roughness: 0.4
		});
		const armMat = new THREE.MeshStandardMaterial({
			color: 0x6ec6a0,
			metalness: 0.5,
			roughness: 0.4
		});
		const wristMat = new THREE.MeshStandardMaterial({
			color: 0xa78bfa,
			metalness: 0.5,
			roughness: 0.4
		});
		const gripperMat = new THREE.MeshStandardMaterial({
			color: 0xe05c5c,
			metalness: 0.4,
			roughness: 0.5
		});

		const baseGroup = new THREE.Group();
		scene.add(baseGroup);

		const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 32), baseMat);
		base.position.z = 0.15;
		base.rotation.x = Math.PI / 2;
		base.castShadow = true;
		baseGroup.add(base);

		const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 32), jointMat);
		s1.position.z = 0.4;
		baseGroup.add(s1);

		// J2 — Shoulder (pivot at z = 0.4)
		const shoulderGroup = new THREE.Group();
		shoulderGroup.position.z = 0.4;
		baseGroup.add(shoulderGroup);

		const link1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.1, 16), armMat);
		link1.position.z = 0.55;
		link1.rotation.x = Math.PI / 2;
		link1.castShadow = true;
		shoulderGroup.add(link1);

		const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 32), jointMat);
		s2.position.z = 1.1;
		shoulderGroup.add(s2);

		// J3 — Elbow (pivot at z = 1.1)
		const elbowGroup = new THREE.Group();
		elbowGroup.position.z = 1.1;
		shoulderGroup.add(elbowGroup);

		const link2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.95, 16), armMat);
		link2.position.z = 0.475;
		link2.rotation.x = Math.PI / 2;
		link2.castShadow = true;
		elbowGroup.add(link2);

		const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), jointMat);
		s3.position.z = 0.95;
		elbowGroup.add(s3);

		// J4 — Wrist roll (pivot at z = 0.95)
		const wristRollGroup = new THREE.Group();
		wristRollGroup.position.z = 0.95;
		elbowGroup.add(wristRollGroup);

		const link3 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.55, 16), wristMat);
		link3.position.z = 0.275;
		link3.rotation.x = Math.PI / 2;
		link3.castShadow = true;
		wristRollGroup.add(link3);

		const s4 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), jointMat);
		s4.position.z = 0.55;
		wristRollGroup.add(s4);

		// J5 — Wrist pitch (pivot at z = 0.55)
		const wristPitchGroup = new THREE.Group();
		wristPitchGroup.position.z = 0.55;
		wristRollGroup.add(wristPitchGroup);

		const link4 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.4, 16), wristMat);
		link4.position.z = 0.2;
		link4.rotation.x = Math.PI / 2;
		link4.castShadow = true;
		wristPitchGroup.add(link4);

		const s5 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), jointMat);
		s5.position.z = 0.4;
		wristPitchGroup.add(s5);

		// J6 — End-effector spin (pivot at z = 0.4)
		const wristYawGroup = new THREE.Group();
		wristYawGroup.position.z = 0.4;
		wristPitchGroup.add(wristYawGroup);

		// Gripper fingers (extend along Z)
		const fingerGeo = new THREE.BoxGeometry(0.06, 0.07, 0.22);
		const gripperLeft = new THREE.Mesh(fingerGeo, gripperMat);
		const gripperRight = new THREE.Mesh(fingerGeo, gripperMat);
		gripperLeft.position.set(0.1, 0, 0.13);
		gripperRight.position.set(-0.1, 0, 0.13);
		gripperLeft.castShadow = true;
		gripperRight.castShadow = true;
		wristYawGroup.add(gripperLeft, gripperRight);

		// ── End-effector marker (driven by FK) ─────────────────
		const eeMesh = new THREE.Mesh(
			new THREE.SphereGeometry(0.06, 16, 16),
			new THREE.MeshStandardMaterial({
				color: 0xffd700,
				emissive: 0xffd700,
				emissiveIntensity: 0.4
			})
		);
		scene.add(eeMesh);

		const unsubFK = fkStore.subscribe((positions) => {
			const ee = positions[positions.length - 1];
			if (ee) eeMesh.position.set(ee.x, ee.y, ee.z);
		});

		// ── Store subscription ─────────────────────────────────
		const jointGroups = [
			baseGroup,
			shoulderGroup,
			elbowGroup,
			wristRollGroup,
			wristPitchGroup,
			wristYawGroup
		];

		const unsub = manipulatorStore.subscribe(($m) => {
			$m.links.forEach((link, i) => {
				const g = jointGroups[i];
				const a = link.angle;
				g.rotation.set(
					link.rotationAxis === Axis.X ? a : 0,
					link.rotationAxis === Axis.Y ? a : 0,
					link.rotationAxis === Axis.Z ? a : 0
				);
			});
		});

		const MANTLE_SCALE = 3.4 / (6 * 53);

		const mantleGroup = new THREE.Group();
		scene.add(mantleGroup);

		const outerMat = new THREE.LineBasicMaterial({
			color: 0x4d96ff,
			transparent: true,
			opacity: 0.6
		});
		const innerMat = new THREE.LineBasicMaterial({
			color: 0xf7a94f,
			transparent: true,
			opacity: 0.4
		});

		const unsubMantle = mantleStore.subscribe((result) => {
			mantleGroup.clear();
			if (!result) return;

			const toV3 = (p: { x: number; y: number; z: number }) =>
				new THREE.Vector3(p.x * MANTLE_SCALE, p.y * MANTLE_SCALE, p.z * MANTLE_SCALE);

			const drawRings = (
				rings: { x: number; y: number; z: number }[][],
				mat: THREE.LineBasicMaterial
			) => {
				for (const ring of rings) {
					if (ring.length < 2) continue;
					mantleGroup.add(
						new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring.map(toV3)), mat)
					);
				}
			};

			drawRings(result.outer, outerMat);
			drawRings(result.inner, innerMat);
		});

		// ── Resize ─────────────────────────────────────────────
		const container = canvas.parentElement!;
		const ro = new ResizeObserver(() => {
			const w = container.clientWidth;
			const h = container.clientHeight;
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h, false);
			renderer.render(scene, camera);
		});
		ro.observe(container);

		// ── Animate ────────────────────────────────────────────
		const animate = () => {
			animId = requestAnimationFrame(animate);
			if (snap) {
				camera.position.lerp(snap.pos, 0.12);
				camera.up.lerp(snap.up, 0.12).normalize();
				controls.update();
				if (camera.position.distanceTo(snap.pos) < 0.005) {
					camera.position.copy(snap.pos);
					camera.up.copy(snap.up);
					controls.update();
					snap = null;
				}
			} else {
				controls.update();
			}
			renderer.render(scene, camera);
		};
		animate();

		return () => {
			unsub();
			unsubFK();
			unsubMantle();
			unsubSnap();
			ro.disconnect();
			cancelAnimationFrame(animId);
			renderer.dispose();
		};
	});
</script>

<div class="relative h-full w-full flex-1">
	<canvas bind:this={canvas} class="absolute inset-0 h-full w-full"></canvas>
	<ViewIndicator />
</div>
