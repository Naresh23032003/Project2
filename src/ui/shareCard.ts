const W = 1200;
const H = 630;
const FONT = '"Bricolage Grotesque Variable", system-ui, sans-serif';

export type ShareData = { headline: string; sub: string; names?: string };

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws the totals-only card. Service names are drawn only when `names` is given. */
export async function drawShareCard(canvas: HTMLCanvasElement, data: ShareData): Promise<void> {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  try {
    await Promise.all([document.fonts.load(`700 72px ${FONT}`), document.fonts.load(`500 32px ${FONT}`)]);
  } catch {
    /* system font fallback is fine */
  }

  ctx.fillStyle = '#f5f6f8';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(0, 0, W, 104);

  ctx.fillStyle = '#ffc72c';
  ctx.beginPath();
  ctx.moveTo(72, 30);
  ctx.bezierCurveTo(90, 52, 104, 66, 104, 78);
  ctx.arc(72, 78, 32, 0, Math.PI, false);
  ctx.bezierCurveTo(40, 66, 54, 52, 72, 30);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 46px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('Dripcheck', 124, 54);

  ctx.fillStyle = '#121a33';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 84px ${FONT}`;
  const lines = wrap(ctx, data.headline, W - 144);
  let y = 230;
  for (const l of lines.slice(0, 3)) {
    ctx.fillText(l, 72, y);
    y += 96;
  }

  ctx.fillStyle = '#4a5470';
  ctx.font = `500 36px ${FONT}`;
  ctx.fillText(data.sub, 72, y + 8);
  if (data.names) {
    ctx.font = `500 32px ${FONT}`;
    const nameLines = wrap(ctx, data.names, W - 144);
    nameLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 72, y + 62 + i * 42));
  }

  ctx.fillStyle = '#121a33';
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText('Checked on my own device. Nothing was uploaded.', 72, H - 52);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the image.'))), 'image/png'));
}
