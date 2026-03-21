import type { Axis } from '../spatial/coordinates';

type FixedLink = {
	type: 'fixed';
	length: number;
	axis: Axis;
	angle: number;
};

type RevoluteLink = {
	type: 'revolute';
	length: number;
	axis: Axis;
	defaultAngle: number;
	angleRange: {
		min: number;
		max: number;
	};
};

export type ManipulatorLinkParams = FixedLink | RevoluteLink;
