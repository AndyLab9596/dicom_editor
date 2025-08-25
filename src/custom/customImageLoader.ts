
function parseImageId(imageId: string) {
  // Ví dụ: custom1://example.com/image.dcm?filter=gaussian&sigma=3
  const url = imageId.replace("custom1://", "");
  const [base, query] = url.split("?");
  const params = new URLSearchParams(query);

  return {
    url: base,
    filter: params.get("filter"),
    sigma: parseFloat(params.get("sigma") || "1"),
  };
}

export function loadImage(imageId: string, options?: Record<string, unknown>) {
  const { url, filter, sigma } = parseImageId(imageId);

  return {
    // eslint-disable-next-line no-async-promise-executor
    promise: new Promise(async (resolve, reject) => {
      try {
        // 🟢 Load file (demo dùng fetch, thực tế có thể DICOM loader)
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        let pixelData = new Uint8Array(buffer);

        const rows = 512;
        const cols = 512;

        // 🟢 Apply filter nếu có
        if (filter === "gaussian" && typeof cv !== "undefined") {
          const src = cv.matFromArray(rows, cols, cv.CV_8UC1, pixelData);
          const dst = new cv.Mat();
          const ksize = new cv.Size(5, 5);
          cv.GaussianBlur(src, dst, ksize, sigma, sigma, cv.BORDER_DEFAULT);

          pixelData = new Uint8Array(dst.data);
          src.delete();
          dst.delete();
        }

        // 🟢 Tạo image object trả về cho Cornerstone
        const image = {
          imageId,
          minPixelValue: 0,
          maxPixelValue: 255,
          slope: 1.0,
          intercept: 0.0,
          windowCenter: 128,
          windowWidth: 256,
          getPixelData: () => pixelData,
          rows,
          columns: cols,
          height: rows,
          width: cols,
          color: false,
          columnPixelSpacing: 1,
          rowPixelSpacing: 1,
          invert: false,
          sizeInBytes: pixelData.byteLength,
        };

        resolve(image);
      } catch (err) {
        reject(err);
      }
    }),
  };
}
