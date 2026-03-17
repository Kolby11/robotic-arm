export type ManipulatorLinkParams = {
  length: number;
  axis: 'X' | 'Y' | 'Z';
  angleRange: {
    min: number;
    max: number;
  };
}