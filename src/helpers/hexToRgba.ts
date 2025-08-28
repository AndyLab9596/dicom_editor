export function hexToRgba(hex: string, alpha: number = 1): string {
  // Bỏ dấu #
  hex = hex.replace(/^#/, "");

  // Xử lý hex ngắn (#fff → #ffffff)
  if (hex.length === 3) {
    hex = hex.split("").map((x) => x + x).join("");
  }

  const num = parseInt(hex, 16);

  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}