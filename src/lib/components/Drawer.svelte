<script lang="ts">
	import { robotStore } from '$lib/stores/robotStore';

	const axisColor = (axis: string) =>
		axis === 'X' ? '#ef4444' : axis === 'Y' ? '#22c55e' : '#3b82f6';

	const fillPct = (value: number, min: number, max: number) =>
		((value - min) / (max - min)) * 100;

	const fmtAngle = (v: number) => (v > 0 ? `+${v}` : `${v}`);

	const reset = () =>
		robotStore.update(($r) => {
			$r.joints.forEach((j) => j.reset());
			return { ...$r, gripper: $r.defaultGripper };
		});

	$: gPct   = $robotStore.gripper * 100;
	$: gLabel = $robotStore.gripper < 0.15 ? 'Closed' : $robotStore.gripper > 0.85 ? 'Open' : 'Partial';
</script>

<div class="drawer">
	<!-- Header -->
	<div class="header">
		<span class="title">Joint Controls</span>
		<button class="reset-btn" onclick={reset} title="Reset all joints">↺</button>
	</div>

	<!-- Joints -->
	<div class="section-label">Arm</div>

	{#each $robotStore.joints as joint, i}
		{@const color = axisColor(joint.axis)}
		{@const pct = fillPct(joint.value, joint.min, joint.max)}
		<div class="card" style="--accent: {color}">
			<div class="card-header">
				<div class="joint-id">J{i + 1}</div>
				<span class="joint-name">{joint.name}</span>
				<span class="axis-badge" style="color:{color}; background:{color}18">{joint.axis}</span>
				<span class="joint-val">{fmtAngle(joint.value)}°</span>
			</div>
			<div class="track-wrap">
				<input
					type="range"
					min={joint.min}
					max={joint.max}
					step="1"
					bind:value={$robotStore.joints[i].value}
					class="slider"
					style="--pct: {pct}%; --color: {color}"
				/>
			</div>
			<div class="range-labels">
				<span>{joint.min}°</span>
				<span>{joint.max}°</span>
			</div>
		</div>
	{/each}

	<!-- Gripper -->
	<div class="section-label" style="margin-top: 8px">End Effector</div>

	<div class="card" style="--accent: #e05c5c">
		<div class="card-header">
			<div class="joint-id" style="background:#e05c5c22; color:#e05c5c">✦</div>
			<span class="joint-name">Gripper</span>
			<span class="axis-badge" style="color:#e05c5c; background:#e05c5c18">{gLabel}</span>
		</div>
		<div class="track-wrap">
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				bind:value={$robotStore.gripper}
				class="slider"
				style="--pct: {gPct}%; --color: #e05c5c"
			/>
		</div>
		<div class="range-labels">
			<span>Closed</span>
			<span>Open</span>
		</div>
	</div>
</div>

<style lang="scss">
	.drawer {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 240px;
		height: 100%;
		padding: 16px 12px;
		overflow-y: auto;
		background: rgba(15, 15, 20, 0.72);
		backdrop-filter: blur(20px);
		border-right: 1px solid rgba(255, 255, 255, 0.07);
		box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.title {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
	}

	.reset-btn {
		font-size: 18px;
		color: rgba(255, 255, 255, 0.3);
		background: none;
		border: none;
		cursor: pointer;
		line-height: 1;
		transition: color 0.15s, transform 0.2s;
		padding: 2px 4px;

		&:hover {
			color: rgba(255, 255, 255, 0.8);
			transform: rotate(-30deg);
		}
	}

	.section-label {
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.25);
		padding: 0 4px;
		margin-bottom: 2px;
	}

	.card {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-left: 2px solid var(--accent);
		border-radius: 8px;
		padding: 10px 10px 6px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		transition: background 0.15s;

		&:hover {
			background: rgba(255, 255, 255, 0.07);
		}
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.joint-id {
		font-size: 9px;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.08);
		border-radius: 4px;
		padding: 1px 5px;
		flex-shrink: 0;
	}

	.joint-name {
		font-size: 12px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.axis-badge {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.05em;
		padding: 1px 6px;
		border-radius: 99px;
		flex-shrink: 0;
	}

	.joint-val {
		font-family: 'Courier New', monospace;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.6);
		min-width: 38px;
		text-align: right;
		flex-shrink: 0;
	}

	.track-wrap {
		padding: 0 2px;
	}

	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 4px;
		border-radius: 9999px;
		outline: none;
		cursor: pointer;
		background: linear-gradient(
			to right,
			var(--color) 0%,
			var(--color) var(--pct),
			rgba(255, 255, 255, 0.1) var(--pct),
			rgba(255, 255, 255, 0.1) 100%
		);

		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 14px;
			height: 14px;
			border-radius: 50%;
			background: #fff;
			box-shadow: 0 0 0 2px var(--color), 0 2px 6px rgba(0, 0, 0, 0.5);
			cursor: pointer;
			transition: box-shadow 0.15s, transform 0.1s;
		}

		&::-webkit-slider-thumb:hover {
			box-shadow: 0 0 0 3px var(--color), 0 2px 8px rgba(0, 0, 0, 0.6);
			transform: scale(1.15);
		}

		&::-moz-range-thumb {
			width: 14px;
			height: 14px;
			border: 2px solid var(--color);
			border-radius: 50%;
			background: #fff;
			cursor: pointer;
		}
	}

	.range-labels {
		display: flex;
		justify-content: space-between;
		font-size: 9px;
		color: rgba(255, 255, 255, 0.2);
		padding: 0 2px;
	}
</style>
