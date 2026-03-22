<script lang="ts">
	import { manipulatorStore, triggerMantleCalculation, DEFAULT_MANTLE_PARAMS } from '$lib/stores/simulation';

	const RAD2DEG = 180 / Math.PI;

	let params = { ...DEFAULT_MANTLE_PARAMS };

	$: revolutes = $manipulatorStore.links
		.map((link, i) => ({ link, i }))
		.filter(({ link }) => link.type === 'revolute');

	const JOINT_NAMES = ['Base', 'Shoulder', 'Elbow', 'Wrist Roll', 'Wrist Pitch'];
	const AXIS_COLOR: Record<string, string> = { x: '#ef4444', y: '#22c55e', z: '#3b82f6' };
</script>

<div class="drawer">
	<div class="header">
		<span class="title">Controls</span>
	</div>

	<!-- Joint controls -->
	<div class="section-label">Joints</div>

	{#each revolutes as { link, i }, ri}
		{@const color = AXIS_COLOR[link.rotationAxis] ?? '#fff'}
		{@const angleDeg = +(link.angle * RAD2DEG).toFixed(1)}
		{@const pct = link.angleRange
			? ((angleDeg - link.angleRange.min) / (link.angleRange.max - link.angleRange.min)) * 100
			: 50}
		<div class="card" style="--accent:{color}">
			<div class="card-header">
				<div class="joint-id">J{ri + 1}</div>
				<span class="joint-name">{JOINT_NAMES[ri] ?? `Joint ${ri + 1}`}</span>
				<span class="axis-badge" style="color:{color};background:{color}18">{link.rotationAxis.toUpperCase()}</span>
				<span class="joint-val">{angleDeg > 0 ? '+' : ''}{angleDeg}°</span>
			</div>
			{#if link.angleRange}
				<input
					type="range"
					min={link.angleRange.min}
					max={link.angleRange.max}
					step="0.5"
					value={angleDeg}
					class="slider"
					style="--pct:{pct}%;--color:{color}"
					oninput={(e) => manipulatorStore.setJointAngle(ri, +e.currentTarget.value)}
				/>
				<div class="range-labels">
					<span>{link.angleRange.min}°</span>
					<span>{link.angleRange.max}°</span>
				</div>
			{/if}
		</div>
	{/each}

	<!-- Mantle settings -->
	<div class="section-label" style="margin-top:8px">Mantle Settings</div>

	<div class="card" style="--accent:#4d96ff">
		<div class="row">
			<span class="label">Steps / joint</span>
			<span class="val">{params.stepsPerJoint}</span>
		</div>
		<input type="range" min="3" max="20" step="1" bind:value={params.stepsPerJoint} class="slider" style="--pct:{((params.stepsPerJoint-3)/17)*100}%;--color:#4d96ff" />

		<div class="row">
			<span class="label">Azimuth bins</span>
			<span class="val">{params.azimuthBins}</span>
		</div>
		<input type="range" min="12" max="120" step="4" bind:value={params.azimuthBins} class="slider" style="--pct:{((params.azimuthBins-12)/108)*100}%;--color:#4d96ff" />

		<div class="row">
			<span class="label">Elevation bins</span>
			<span class="val">{params.elevationBins}</span>
		</div>
		<input type="range" min="10" max="100" step="5" bind:value={params.elevationBins} class="slider" style="--pct:{((params.elevationBins-10)/90)*100}%;--color:#4d96ff" />

		<div class="hint">~{((params.stepsPerJoint ** 5) / 1000) | 0}k samples</div>
	</div>

	<button class="calc-btn" onclick={() => triggerMantleCalculation(params)}>
		Calculate mantle
	</button>
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
		margin-bottom: 4px;
	}

	.title {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
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
		gap: 5px;

		&:hover { background: rgba(255, 255, 255, 0.06); }
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
		padding: 1px 6px;
		border-radius: 99px;
		flex-shrink: 0;
	}

	.joint-val {
		font-family: 'Courier New', monospace;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.6);
		min-width: 42px;
		text-align: right;
		flex-shrink: 0;
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.label {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.6);
	}

	.val {
		font-family: 'Courier New', monospace;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.85);
	}

	.hint {
		font-size: 9px;
		color: rgba(255, 255, 255, 0.2);
		text-align: right;
	}

	.range-labels {
		display: flex;
		justify-content: space-between;
		font-size: 9px;
		color: rgba(255, 255, 255, 0.2);
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
			width: 14px;
			height: 14px;
			border-radius: 50%;
			background: #fff;
			box-shadow: 0 0 0 2px var(--color), 0 2px 6px rgba(0,0,0,0.5);
			cursor: pointer;
			transition: transform 0.1s;
			&:hover { transform: scale(1.15); }
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

	.calc-btn {
		width: 100%;
		padding: 10px;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.85);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
		margin-top: 4px;

		&:hover { background: rgba(255, 255, 255, 0.13); }
		&:active { background: rgba(255, 255, 255, 0.18); }
	}
</style>
