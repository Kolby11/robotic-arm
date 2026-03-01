<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import { robotStore } from '$lib/stores/robotStore';
	import { cameraStore } from '$lib/stores/cameraStore';
	import ViewIndicator from '$lib/components/ViewIndicator.svelte';

	let container: HTMLDivElement;

	onMount(() => {
		let animId: number;

		// ── Scene ──────────────────────────────────────────────
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x1f1f1f);

		// ── Camera ─────────────────────────────────────────────
		const camera = new THREE.PerspectiveCamera(
			60,
			container.clientWidth / container.clientHeight,
			0.1,
			100
		);
		camera.position.set(4, 4, 6);
		camera.lookAt(0, 1.5, 0);

		// ── Renderer ───────────────────────────────────────────
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.shadowMap.enabled = true;
		renderer.setClearColor(0x1f1f1f); // match scene.background to avoid white flash on resize
		container.appendChild(renderer.domElement);

		// ── Orbit controls ─────────────────────────────────────
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 1.5, 0);
		controls.update();

		const pushCamera = () => cameraStore.set({
			position:   camera.position,
			target:     controls.target || new THREE.Vector3(0, 1.5, 0),
			quaternion: camera.quaternion
		});

		controls.addEventListener('change', pushCamera);
		pushCamera(); // set initial quaternion

		// ── Lights ─────────────────────────────────────────────
		scene.add(new THREE.AmbientLight(0xffffff, 0.4));
		const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
		dirLight.position.set(5, 8, 5);
		dirLight.castShadow = true;
		scene.add(dirLight);

		// ── Grid ───────────────────────────────────────────────
		scene.add(new THREE.GridHelper(10, 20, 0x626262, 0x3d3d3d));

		// ── Materials ──────────────────────────────────────────
		const baseMat    = new THREE.MeshStandardMaterial({ color: 0x4f8ef7, metalness: 0.6, roughness: 0.3 });
		const jointMat   = new THREE.MeshStandardMaterial({ color: 0xf7a94f, metalness: 0.5, roughness: 0.4 });
		const armMat     = new THREE.MeshStandardMaterial({ color: 0x6ec6a0, metalness: 0.5, roughness: 0.4 });
		const wristMat   = new THREE.MeshStandardMaterial({ color: 0xa78bfa, metalness: 0.5, roughness: 0.4 });
		const gripperMat = new THREE.MeshStandardMaterial({ color: 0xe05c5c, metalness: 0.4, roughness: 0.5 });

		const baseGroup = new THREE.Group();
		scene.add(baseGroup);

		const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 32), baseMat);
		base.position.y = 0.15;
		base.castShadow = true;
		baseGroup.add(base);

		const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 32), jointMat);
		s1.position.y = 0.4;
		baseGroup.add(s1);

		// J2 — Shoulder pitch (pivot at y = 0.4)
		const shoulderGroup = new THREE.Group();
		shoulderGroup.position.y = 0.4;
		baseGroup.add(shoulderGroup);

		const link1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.1, 16), armMat);
		link1.position.y = 0.55;
		link1.castShadow = true;
		shoulderGroup.add(link1);

		const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 32), jointMat);
		s2.position.y = 1.1;
		shoulderGroup.add(s2);

		// J3 — Elbow pitch (pivot at y = 1.1)
		const elbowGroup = new THREE.Group();
		elbowGroup.position.y = 1.1;
		shoulderGroup.add(elbowGroup);

		const link2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.95, 16), armMat);
		link2.position.y = 0.475;
		link2.castShadow = true;
		elbowGroup.add(link2);

		const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), jointMat);
		s3.position.y = 0.95;
		elbowGroup.add(s3);

		// J4 — Wrist roll (pivot at y = 0.95, rotates around link axis = local Y)
		const wristRollGroup = new THREE.Group();
		wristRollGroup.position.y = 0.95;
		elbowGroup.add(wristRollGroup);

		const link3 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.55, 16), wristMat);
		link3.position.y = 0.275;
		link3.castShadow = true;
		wristRollGroup.add(link3);

		const s4 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), jointMat);
		s4.position.y = 0.55;
		wristRollGroup.add(s4);

		// J5 — Wrist pitch (pivot at y = 0.55)
		const wristPitchGroup = new THREE.Group();
		wristPitchGroup.position.y = 0.55;
		wristRollGroup.add(wristPitchGroup);

		const link4 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.4, 16), wristMat);
		link4.position.y = 0.2;
		link4.castShadow = true;
		wristPitchGroup.add(link4);

		const s5 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), jointMat);
		s5.position.y = 0.4;
		wristPitchGroup.add(s5);

		// J6 — End-effector spin (pivot at y = 0.4, rotates local Y)
		const wristYawGroup = new THREE.Group();
		wristYawGroup.position.y = 0.4;
		wristPitchGroup.add(wristYawGroup);

		// Gripper fingers
		const fingerGeo = new THREE.BoxGeometry(0.06, 0.22, 0.07);
		const gripperLeft  = new THREE.Mesh(fingerGeo, gripperMat);
		const gripperRight = new THREE.Mesh(fingerGeo, gripperMat);
		gripperLeft.position.set( 0.1, 0.13, 0);
		gripperRight.position.set(-0.1, 0.13, 0);
		gripperLeft.castShadow  = true;
		gripperRight.castShadow = true;
		wristYawGroup.add(gripperLeft, gripperRight);

		// ── Store subscription ─────────────────────────────────
		const deg = THREE.MathUtils.degToRad;

		const jointGroups = [
			baseGroup, shoulderGroup, elbowGroup,
			wristRollGroup, wristPitchGroup, wristYawGroup
		];

		const unsub = robotStore.subscribe(($r) => {
			$r.joints.forEach((joint, i) => {
				const g = jointGroups[i];
				g.rotation.set(
					joint.axis === 'X' ? deg(joint.value) : 0,
					joint.axis === 'Y' ? deg(joint.value) : 0,
					joint.axis === 'Z' ? deg(joint.value) : 0
				);
			});

			const spread = 0.06 + $r.gripper * 0.16;
			gripperLeft.position.x  =  spread;
			gripperRight.position.x = -spread;
		});

		// ── Resize ─────────────────────────────────────────────
		const ro = new ResizeObserver(() => {
			camera.aspect = container.clientWidth / container.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
			renderer.render(scene, camera); // render immediately so the canvas never shows a cleared frame
		});
		ro.observe(container);

		// ── Animate ────────────────────────────────────────────
		const animate = () => {
			animId = requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();

		return () => {
			unsub();
			ro.disconnect();
			cancelAnimationFrame(animId);
			renderer.dispose();
		};
	});
</script>

<div class="relative flex-1 h-full w-full">
	<div bind:this={container} class="absolute inset-0"></div>
	<ViewIndicator />
</div>
