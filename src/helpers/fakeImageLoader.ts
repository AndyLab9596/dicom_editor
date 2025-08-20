import { imageLoader, utilities } from "@cornerstonejs/core";

// ---- Fake Image Loader ----
export function registerFakeLoader() {
  imageLoader.registerImageLoader("fake", fakeImageLoader);
}

function fakeImageLoader(imageId: string) {
  // Ví dụ imageId = "fake:myImage"
  const rows = 256;
  const columns = 256;

  // PixelData: toàn số 0 → ảnh đen
  const pixelData = new Uint8Array(rows * columns);

  const imageVoxelManager = utilities.VoxelManager.createImageVoxelManager({
    height: rows,
    width: columns,
    numberOfComponents: 1,
    scalarData: pixelData,
  });

  const image = {
    rows,
    columns,
    width: columns,
    height: rows,
    imageId,
    intercept: 0,
    slope: 1,
    invert: false,
    windowCenter: 128,
    windowWidth: 256,
    maxPixelValue: 255,
    minPixelValue: 0,
    rowPixelSpacing: 1.0,
    columnPixelSpacing: 1.0,
    getPixelData: () => imageVoxelManager.getScalarData(),
    sizeInBytes: pixelData.length,
    imageFrame: {
      pixelRepresentation: 0,
      bitsAllocated: 8,
      bitsStored: 8,
      highBit: 7,
      photometricInterpretation: "MONOCHROME2",
      samplesPerPixel: 1,
      planarConfiguration: 0,
    },
    // Metadata cần cho volume
    metadata: {
      FrameOfReferenceUID: "FakeFrameUID",
      ImageOrientationPatient: [1, 0, 0, 0, 1, 0], // Axial
      ImagePositionPatient: [0, 0, 0],
      PixelSpacing: [1, 1],
      SliceThickness: 1,
      Columns: columns,
      Rows: rows,
    },
    voxelManager: imageVoxelManager,
  };

  return {
    promise: Promise.resolve(image),
  };
}
