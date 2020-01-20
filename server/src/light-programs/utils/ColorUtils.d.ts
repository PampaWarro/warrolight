import { Color } from "../../types"

export function rgbToHex(r: number, g: number, b: number): string;
export function hexToRgb(hexColor: string): Color;
export function mix(a: Color, b: Color, ratio: number): Color
