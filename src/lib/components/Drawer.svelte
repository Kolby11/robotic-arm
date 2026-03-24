<script lang="ts">
	import {
		manipulatorStore,
		triggerMantleCalculation,
		DEFAULT_MANTLE_PARAMS
	} from '$lib/stores/simulation';
	import { themeStore } from '$lib/stores/themeStore';

	const RAD2DEG = 180 / Math.PI;

	let params = { ...DEFAULT_MANTLE_PARAMS };

	$: revolutes = $manipulatorStore.links
		.map((link, i) => ({ link, i }))
		.filter(({ link }) => link.type === 'revolute');

	const JOINT_NAMES = ['Base', 'Shoulder', 'Elbow', 'Wrist Roll', 'Wrist Pitch'];
	const AXIS_COLOR: Record<string, string> = { x: '#ef4444', y: '#22c55e', z: '#3b82f6' };

	function toggleTheme() {
		themeStore.update((t) => {
			const next = t === 'light' ? 'dark' : 'light';
			document.documentElement.classList.toggle('dark', next === 'dark');
			return next;
		});
	}

	const sliderClass =
		'h-1 w-full cursor-pointer rounded-full outline-none ' +
		'[appearance:none] ' +
		'[&::-webkit-slider-thumb]:[appearance:none] ' +
		'[&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 ' +
		'[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white ' +
		'[&::-webkit-slider-thumb]:cursor-pointer ' +
		'[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100 ' +
		'[&::-webkit-slider-thumb]:[box-shadow:0_0_0_2px_var(--accent),_0_2px_6px_rgba(0,0,0,0.15)] ' +
		'[&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 ' +
		'[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white ' +
		'[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:[border:2px_solid_var(--accent)]';

	function sliderStyle(color: string, pct: number) {
		return `--accent:${color}; background: linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(0,0,0,0.1) ${pct}%, rgba(0,0,0,0.1) 100%)`;
	}

	$: spjPct = ((params.stepsPerJoint - 3) / 17) * 100;
	$: azPct = ((params.azimuthBins - 12) / 108) * 100;
	$: elPct = ((params.elevationBins - 10) / 90) * 100;
</script>

<div class="flex h-full w-60 flex-shrink-0 flex-col gap-1.5 overflow-y-auto border-r border-black/8 px-3 py-4 [backdrop-filter:blur(20px)] bg-[rgba(245,243,240,0.92)] shadow-[4px_0_24px_rgba(0,0,0,0.08)] dark:border-white/8 dark:bg-[rgba(22,22,30,0.96)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.3)]">

	<!-- Header -->
	<div class="mb-1 flex items-center">
		<span class="flex-1 text-[11px] font-bold uppercase tracking-[0.12em] text-black/40 dark:text-white/40">
			Controls
		</span>
		<button
			onclick={toggleTheme}
			title="Toggle theme"
			class="cursor-pointer rounded bg-transparent px-1 py-0.5 text-sm leading-none text-black/40 transition-colors hover:bg-black/8 dark:text-white/40 dark:hover:bg-white/10"
		>
			{$themeStore === 'light' ? '☾' : '☀'}
		</button>
	</div>

	<!-- Joints -->
	<div class="mb-0.5 px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-black/35 dark:text-white/35">
		Joints
	</div>

	{#each revolutes as { link, i }, ri}
		{@const color = AXIS_COLOR[link.rotationAxis] ?? '#fff'}
		{@const angleDeg = +(link.angle * RAD2DEG).toFixed(1)}
		{@const pct = link.angleRange
			? ((angleDeg - link.angleRange.min) / (link.angleRange.max - link.angleRange.min)) * 100
			: 50}

		<div
			class="flex flex-col gap-1.5 rounded-lg border border-black/7 px-2.5 pb-1.5 pt-2.5 bg-white/70 transition-colors hover:bg-white/90 dark:border-white/7 dark:bg-[rgba(35,35,48,0.8)] dark:hover:bg-[rgba(42,42,58,0.95)]"
			style="border-left: 2px solid {color}"
		>
			<div class="flex items-center gap-1.5">
				<div class="flex-shrink-0 rounded bg-black/6 px-1.5 py-0.5 text-[9px] font-bold text-black/45 dark:bg-white/8 dark:text-white/45">
					J{ri + 1}
				</div>
				<span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-black/80 dark:text-white/85">
					{JOINT_NAMES[ri] ?? `Joint ${ri + 1}`}
				</span>
				<span
					class="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
					style="color:{color}; background:{color}18"
				>
					{link.rotationAxis.toUpperCase()}
				</span>
				<span class="min-w-[42px] flex-shrink-0 text-right font-mono text-[11px] text-black/55 dark:text-white/50">
					{angleDeg > 0 ? '+' : ''}{angleDeg}°
				</span>
			</div>

			{#if link.angleRange}
				<input
					type="range"
					min={link.angleRange.min}
					max={link.angleRange.max}
					step="0.5"
					value={angleDeg}
					class={sliderClass}
					style={sliderStyle(color, pct)}
					oninput={(e) => manipulatorStore.setJointAngle(ri, +e.currentTarget.value)}
				/>
				<div class="flex justify-between px-0.5 text-[9px] text-black/30 dark:text-white/30">
					<span>{link.angleRange.min}°</span>
					<span>{link.angleRange.max}°</span>
				</div>
			{/if}
		</div>
	{/each}

	<!-- Mantle settings -->
	<div class="mb-0.5 mt-2 px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-black/35 dark:text-white/35">
		Mantle Settings
	</div>

	<div
		class="flex flex-col gap-1.5 rounded-lg border border-black/7 px-2.5 pb-1.5 pt-2.5 bg-white/70 transition-colors hover:bg-white/90 dark:border-white/7 dark:bg-[rgba(35,35,48,0.8)] dark:hover:bg-[rgba(42,42,58,0.95)]"
		style="border-left: 2px solid #4d96ff"
	>
		<div class="flex items-center justify-between">
			<span class="text-[11px] text-black/55 dark:text-white/50">Steps / joint</span>
			<span class="font-mono text-[11px] text-black/75 dark:text-white/80">{params.stepsPerJoint}</span>
		</div>
		<input type="range" min="3" max="20" step="1" bind:value={params.stepsPerJoint} class={sliderClass} style={sliderStyle('#4d96ff', spjPct)} />

		<div class="flex items-center justify-between">
			<span class="text-[11px] text-black/55 dark:text-white/50">Azimuth bins</span>
			<span class="font-mono text-[11px] text-black/75 dark:text-white/80">{params.azimuthBins}</span>
		</div>
		<input type="range" min="12" max="120" step="4" bind:value={params.azimuthBins} class={sliderClass} style={sliderStyle('#4d96ff', azPct)} />

		<div class="flex items-center justify-between">
			<span class="text-[11px] text-black/55 dark:text-white/50">Elevation bins</span>
			<span class="font-mono text-[11px] text-black/75 dark:text-white/80">{params.elevationBins}</span>
		</div>
		<input type="range" min="10" max="100" step="5" bind:value={params.elevationBins} class={sliderClass} style={sliderStyle('#4d96ff', elPct)} />

		<div class="text-right text-[9px] text-black/30 dark:text-white/30">
			~{(params.stepsPerJoint ** 5 / 1000) | 0}k samples
		</div>
	</div>

	<button
		onclick={() => triggerMantleCalculation(params)}
		class="mt-1 w-full cursor-pointer rounded-lg border border-black/10 bg-black/5 px-2.5 py-2.5 text-[13px] font-medium text-black/75 transition-colors hover:bg-black/9 active:bg-black/13 dark:border-white/12 dark:bg-white/6 dark:text-white/75 dark:hover:bg-white/10 dark:active:bg-white/15"
	>
		Calculate mantle
	</button>
</div>
