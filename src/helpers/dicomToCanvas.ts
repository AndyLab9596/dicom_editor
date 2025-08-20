// utils/dicomToCanvas.ts
import * as dicomParser from 'dicom-parser';

type Photometric = 'MONOCHROME2' | 'MONOCHROME1' | 'RGB';

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

function parseMultiNumber(str?: string, fallback?: number): number | undefined {
  if (!str) return fallback;
  const first = String(str).split('\\')[0];
  const n = Number(first);
  return Number.isFinite(n) ? n : fallback;
}

export async function dicomUrlToCanvas(url: string): Promise<HTMLCanvasElement> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch DICOM failed: ${res.status}`);
  const buffer = await res.arrayBuffer();

  const byteArray = new Uint8Array(buffer);
  const dataSet = dicomParser.parseDicom(byteArray);

  const transferSyntax = dataSet.string('x00020010') || '';
  // Thô sơ: nếu có dấu hiệu nén, báo lỗi để dùng Option B
  const compressed = /1\.2\.840\.10008\.1\.2\.(4|5|6|70|90|91)/.test(transferSyntax);
  if (compressed) {
    throw new Error(`Compressed DICOM (${transferSyntax}) – dùng Cornerstone WADO loader (Option B).`);
  }

  const rows = dataSet.uint16('x00280010') || 0;
  const cols = dataSet.uint16('x00280011') || 0;
  if (!rows || !cols) throw new Error('Missing Rows/Columns');

  const samplesPerPixel = dataSet.uint16('x00280002') || 1;
  const photometric = (dataSet.string('x00280004') || 'MONOCHROME2') as Photometric;
  const bitsAllocated = dataSet.uint16('x00280100') || 16;
  const pixelRepresentation = dataSet.uint16('x00280103') || 0; // 0=unsigned, 1=signed
  const slope = parseMultiNumber(dataSet.string('x00281053'), 1) ?? 1;
  const intercept = parseMultiNumber(dataSet.string('x00281052'), 0) ?? 0;

  // WC/WW có thể multi-value "40\400"
  const wc = parseMultiNumber(dataSet.string('x00281050'));
  const ww = parseMultiNumber(dataSet.string('x00281051'));

  const pixelEl = dataSet.elements.x7fe00010;
  if (!pixelEl) throw new Error('No PixelData (7FE0,0010)');

  const start = pixelEl.dataOffset;
  const end = start + pixelEl.length;
  const pixelBytes = byteArray.subarray(start, end);

  // Chuẩn bị Canvas
  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D context');
  const imageData = ctx.createImageData(cols, rows);
  const out = imageData.data; // RGBA

  if (samplesPerPixel === 1 && (bitsAllocated === 8 || bitsAllocated === 16)) {
    // Grayscale
    let src: Int16Array | Uint16Array | Uint8Array;
    if (bitsAllocated === 8) {
      src = new Uint8Array(pixelBytes.buffer, pixelBytes.byteOffset, pixelBytes.byteLength);
    } else {
      const length = pixelBytes.byteLength / 2;
      src =
        pixelRepresentation === 0
          ? new Uint16Array(pixelBytes.buffer, pixelBytes.byteOffset, length)
          : new Int16Array(pixelBytes.buffer, pixelBytes.byteOffset, length);
    }

    // Tính WC/WW mặc định nếu không có: dựa theo min/max
    let wcUse = wc;
    let wwUse = ww;
    if (!wcUse || !wwUse) {
      let min = Infinity, max = -Infinity;
      for (let i = 0; i < src.length; i++) {
        const v = (src[i] as number) * slope + intercept;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      wcUse = (min + max) / 2;
      wwUse = Math.max(1, max - min);
    }

    const wcAdj = wcUse!;
    const wwAdj = wwUse!;
    // Windowing chuẩn DICOM
    for (let i = 0, j = 0; i < src.length; i++, j += 4) {
      const hu = (src[i] as number) * slope + intercept;
      const y = ((hu - (wcAdj - 0.5)) / (wwAdj - 1) + 0.5) * 255;
      let g = clamp(y, 0, 255) | 0;
      if (photometric === 'MONOCHROME1') {
        g = 255 - g; // invert
      }
      out[j] = out[j + 1] = out[j + 2] = g;
      out[j + 3] = 255;
    }
  } else if (samplesPerPixel === 3 && bitsAllocated === 8 && photometric === 'RGB') {
    // RGB interleaved (PlanarConfiguration=0 giả định)
    // pixelBytes = [R,G,B, R,G,B, ...]
    for (let i = 0, j = 0; i < pixelBytes.length; i += 3, j += 4) {
      out[j] = pixelBytes[i];
      out[j + 1] = pixelBytes[i + 1];
      out[j + 2] = pixelBytes[i + 2];
      out[j + 3] = 255;
    }
  } else {
    throw new Error(
      `Unsupported combination: SPP=${samplesPerPixel}, Bits=${bitsAllocated}, PI=${photometric}`
    );
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function dicomUrlToDataURL(url: string, type: 'image/png' | 'image/jpeg' = 'image/png', quality?: number) {
  const canvas = await dicomUrlToCanvas(url);
  return canvas.toDataURL(type, quality);
}

export async function dicomUrlToImage(url: string): Promise<HTMLImageElement> {
  const dataUrl = await dicomUrlToDataURL(url, 'image/png');
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image load failed'));
  });
  return img;
}
