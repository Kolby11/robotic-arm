<script lang="ts">
	import { onMount } from 'svelte';
	import { cameraStore } from '$lib/stores/cameraStore';
	import { Quaternion, Vector3 } from 'three';

	let canvas: HTMLCanvasElement;

	// Express a world-space vector in camera local space (rotate by conjugate of q)
	function toCamera(v: Vector3, q: Quaternion): Vector3 {
		const [vx, vy, vz] = v;
		const qx = -q.x, qy = -q.y, qz = -q.z, qw = q.w;
		const tx = 2 * (qy * vz - qz * vy);
		const ty = 2 * (qz * vx - qx * vz);
		const tz = 2 * (qx * vy - qy * vx);
		return new Vector3(
			vx + qw * tx + (qy * tz - qz * ty),
			vy + qw * ty + (qz * tx - qx * tz),
			vz + qw * tz + (qx * ty - qy * tx)
		);
	}

	const AXES = [
		{ label: 'X',  dir: new Vector3(1,0,0), color: '#ef4444', neg: false },
		{ label: 'Y',  dir: new Vector3(0,1,0), color: '#22c55e', neg: false },
		{ label: 'Z',  dir: new Vector3(0,0,1), color: '#3b82f6', neg: false },
		{ label: '-X', dir: new Vector3(-1,0,0), color: '#ef4444', neg: true  },
		{ label: '-Y', dir: new Vector3(0,-1,0), color: '#22c55e', neg: true  },
		{ label: '-Z', dir: new Vector3(0,0,-1), color: '#3b82f6', neg: true  },
	];

	onMount(() => {
		const SIZE = canvas.width;
		const C = SIZE / 2;
		const LEN = SIZE * 0.33;
		const ctx = canvas.getContext('2d')!;

		const unsub = cameraStore.subscribe(($c) => {
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

			// Draw back-to-front: lowest depth (away from viewer) first, highest (toward viewer) on top
			projected.sort((a, b) => a.depth - b.depth);

			for (const ax of projected) {
				const inFront = ax.depth >= 0;
				ctx.globalAlpha = inFront ? 1 : 0.28;

				// Line from centre to tip
				ctx.strokeStyle = ax.color;
				ctx.lineWidth = ax.neg ? 1.5 : 2.5;
				ctx.beginPath();
				ctx.moveTo(C, C);
				ctx.lineTo(ax.px, ax.py);
				ctx.stroke();

				// Tip circle
				const r = ax.neg ? 4 : 7;
				ctx.fillStyle = ax.color;
				ctx.beginPath();
				ctx.arc(ax.px, ax.py, r, 0, Math.PI * 2);
				ctx.fill();

				// Label on positive axes only
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

		return () => unsub();
	});
</script>

<div class="pointer-events-none absolute top-4 right-4">
	<canvas bind:this={canvas} width="100" height="100"></canvas>
</div>
