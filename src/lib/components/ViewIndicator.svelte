<script lang="ts">
	import { onMount } from 'svelte';
	import { cameraStore, cameraSnapStore } from '$lib/stores/cameraStore';
	import { Quaternion, Vector3 } from 'three';

	let canvas: HTMLCanvasElement;

	// Express a world-space vector in camera local space (rotate by conjugate of q)
	function toCamera(v: Vector3, q: Quaternion): Vector3 {
		const [vx, vy, vz] = v;
		const qx = -q.x,
			qy = -q.y,
			qz = -q.z,
			qw = q.w;
		const tx = 2 * (qy * vz - qz * vy);
		const ty = 2 * (qz * vx - qx * vz);
		const tz = 2 * (qx * vy - qy * vx);
		return new Vector3(
			vx + qw * tx + (qy * tz - qz * ty),
			vy + qw * ty + (qz * tx - qx * tz),
			vz + qw * tz + (qx * ty - qy * tx)
		);
	}

	// World-space up for each view direction (Z-up system)
	const AXES = [
		{
			label: 'X',
			dir: new Vector3(1, 0, 0),
			up: new Vector3(0, 0, 1),
			color: '#ef4444',
			neg: false
		},
		{
			label: 'Y',
			dir: new Vector3(0, 1, 0),
			up: new Vector3(0, 0, 1),
			color: '#22c55e',
			neg: false
		},
		{
			label: 'Z',
			dir: new Vector3(0, 0, 1),
			up: new Vector3(0, 1, 0),
			color: '#3b82f6',
			neg: false
		},
		{
			label: '-X',
			dir: new Vector3(-1, 0, 0),
			up: new Vector3(0, 0, 1),
			color: '#ef4444',
			neg: true
		},
		{
			label: '-Y',
			dir: new Vector3(0, -1, 0),
			up: new Vector3(0, 0, 1),
			color: '#22c55e',
			neg: true
		},
		{
			label: '-Z',
			dir: new Vector3(0, 0, -1),
			up: new Vector3(0, 1, 0),
			color: '#3b82f6',
			neg: true
		}
	];

	onMount(() => {
		const SIZE = canvas.width;
		const C = SIZE / 2;
		const LEN = SIZE * 0.33;
		const ctx = canvas.getContext('2d')!;

		// Track last projected positions for click hit-testing
		let lastProjected: Array<(typeof AXES)[0] & { px: number; py: number; depth: number }> = [];
		let lastCamState = { position: new Vector3(6, -6, 4), target: new Vector3(0, 0, 1.5) };

		const unsub = cameraStore.subscribe(($c) => {
			lastCamState = {
				position: $c.position.clone(),
				target: $c.target?.clone() ?? new Vector3(0, 0, 1.5)
			};
			ctx.clearRect(0, 0, SIZE, SIZE);

			// Background circle
			ctx.fillStyle = 'rgba(0,0,0,0.3)';
			ctx.beginPath();
			ctx.arc(C, C, C - 1, 0, Math.PI * 2);
			ctx.fill();

			// Project each world axis into camera space
			const projected = AXES.map((ax) => {
				const cs = toCamera(ax.dir, $c.quaternion);
				return {
					...ax,
					px: C + cs.x * LEN,
					py: C - cs.y * LEN,
					depth: cs.z
				};
			});

			lastProjected = projected;

			// Draw back-to-front: lowest depth first
			projected.sort((a, b) => a.depth - b.depth);

			for (const ax of projected) {
				const inFront = ax.depth >= 0;
				ctx.globalAlpha = inFront ? 1 : 0.28;

				ctx.strokeStyle = ax.color;
				ctx.lineWidth = ax.neg ? 1.5 : 2.5;
				ctx.beginPath();
				ctx.moveTo(C, C);
				ctx.lineTo(ax.px, ax.py);
				ctx.stroke();

				const r = ax.neg ? 4 : 7;
				ctx.fillStyle = ax.color;
				ctx.beginPath();
				ctx.arc(ax.px, ax.py, r, 0, Math.PI * 2);
				ctx.fill();

				if (!ax.neg) {
					ctx.fillStyle = 'white';
					ctx.font = 'bold 8px sans-serif';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(ax.label, ax.px, ax.py);
				}
			}

			ctx.globalAlpha = 1;
		});

		function handleClick(e: MouseEvent) {
			const rect = canvas.getBoundingClientRect();
			const mx = (e.clientX - rect.left) * (SIZE / rect.width);
			const my = (e.clientY - rect.top) * (SIZE / rect.height);

			let best: (typeof lastProjected)[0] | null = null;
			let bestD = Infinity;
			for (const ax of lastProjected) {
				const d = Math.hypot(mx - ax.px, my - ax.py);
				if (d < bestD) {
					bestD = d;
					best = ax;
				}
			}

			if (!best || bestD > 16) return;

			const dist = lastCamState.position.distanceTo(lastCamState.target);
			const snapPos = lastCamState.target.clone().addScaledVector(best.dir, dist);
			cameraSnapStore.set({ position: snapPos, up: best.up.clone() });
		}

		canvas.addEventListener('click', handleClick);

		return () => {
			unsub();
			canvas.removeEventListener('click', handleClick);
		};
	});
</script>

<div class="absolute top-4 right-4 cursor-pointer">
	<canvas bind:this={canvas} width="100" height="100" title="Click an axis to snap to that view"
	></canvas>
</div>
