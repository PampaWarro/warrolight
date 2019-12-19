declare class FFT {
  constructor(size: number);
  createComplexArray(): number[];
  realTransform(out: number[], input: number[]): void;
  size: number
}

export default FFT;

