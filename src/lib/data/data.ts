import type { ManipulatorLinkParams } from '$lib/types/manipulator';

export const manipulatorLinksData: ManipulatorLinkParams[] = [
	{
		length: 53,
		axis: 'Z',
		angleRange: {
			min: -53 * 2,
			max: 53 * 2
		}
	},
	{
		length: 53,
		axis: 'Z',
		angleRange: {
			min: -53,
			max: 53
		}
	},
	{
		length: 53,
		axis: 'X',
		angleRange: {
			min: -53,
			max: 53
		}
	},
	{
		length: 53,
		axis: 'Y',
		angleRange: {
			min: -53 * 3,
			max: 53 * 3
		}
	},
	{
		length: 53,
		axis: 'Z',
		angleRange: {
			min: -53,
			max: 53
		}
	},
	{
		length: 53,
		axis: 'Y',
		angleRange: {
			min: -53 * 4,
			max: 53 * 4
		}
	}
];
