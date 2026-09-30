export function computeCollocationOffset(
  collocatedIndex: number,
  edgeDirX: number,
  edgeDirY: number
): { dx: number; dy: number } {
  if (collocatedIndex === 0) return { dx: 0, dy: 0 };
  
  const len = Math.sqrt(edgeDirX * edgeDirX + edgeDirY * edgeDirY);
  const px = len === 0 ? 1 : -edgeDirY / len;
  const py = len === 0 ? 0 : edgeDirX / len;
  
  // Alternate sides and spread out: +3px, -3px, +6px, -6px
  const sign = collocatedIndex % 2 === 1 ? 1 : -1;
  const magnitude = Math.min(6, Math.ceil(collocatedIndex / 2) * 3);
  
  return {
    dx: (px * sign * magnitude) + 0,
    dy: (py * sign * magnitude) + 0,
  };
}
