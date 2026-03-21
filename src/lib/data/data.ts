import { Axis } from '$lib/simulation/spatial/coordinates';
import type { ManipulatorLinkParams } from '$lib/simulation/manipulator/types';

export const manipulatorLinksData: ManipulatorLinkParams[] = [
	{
		type: 'fixed',
		length: 53,
		axis: Axis.Z,
		angle: 0
	},
	{
		type: 'revolute',
		length: 53,
		axis: Axis.Z,
		defaultAngle: 0,
		angleRange: { min: -53, max: 53 }
	},
	{
		type: 'revolute',
		length: 53,
		axis: Axis.Y,
		defaultAngle: 0,
		angleRange: { min: -53, max: 53 }
	},
	{
		type: 'revolute',
		length: 53,
		axis: Axis.Y,
		defaultAngle: 0,
		angleRange: { min: -53 * 3, max: 53 * 3 }
	},
	{
		type: 'revolute',
		length: 53,
		axis: Axis.Z,
		defaultAngle: 0,
		angleRange: { min: -53, max: 53 }
	},
	{
		type: 'revolute',
		length: 53,
		axis: Axis.Y,
		defaultAngle: 0,
		angleRange: { min: -53 * 4, max: 53 * 4 }
	}
];
