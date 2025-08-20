import { utilities } from "@cornerstonejs/core";
import { decodeImageIdInfo } from "./testUtils";
import { getVerticalBarRGBImage } from "./testUtilsPixelData";

/**
 * It creates an image based on the imageId name for testing purposes. It splits the imageId
 * based on "_" and deciphers each field of scheme, rows, columns, barStart, barWidth, x_spacing, y_spacing, rgb, and PT.
 * fakeLoader: myImage_64_64_10_20_1_1_0 will load a grayscale test image of size 64 by
 * 64 and with a vertical bar which starts at 10th pixel and span 20 pixels
 * width, with pixel spacing of 1 mm and 1 mm in x and y direction.
 *
 * fakeImageLoader should be registered for each test image:
 *
 * @example
 * ```javascript
 * imageLoader.registerImageLoader('fakeImageLoader', imageLoader)
 * ```
 *
 * then you can use imageId like: 'fakeImageLoader: myImage_64_64_10_20_1_1_0'
 *
 * @param {imageId} imageId
 * @returns Promise that resolves to the image
 */
export const fakeImageLoader = (imageId) => {
  const imageInfo = decodeImageIdInfo(imageId);
  const { rows, columns, barStart, barWidth, xSpacing, ySpacing, rgb, id } =
    imageInfo;

  const numberOfComponents = rgb ? 3 : 1;
  const pixelData = new Uint8Array(rows * columns * numberOfComponents);

  const imageVoxelManager = utilities.VoxelManager.createImageVoxelManager({
    height: rows,
    width: columns,
    numberOfComponents,
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
    voxelManager: imageVoxelManager,
    invert: false,
    windowCenter: 40,
    windowWidth: 400,
    maxPixelValue: 255,
    minPixelValue: 0,
    rowPixelSpacing: ySpacing,
    columnPixelSpacing: xSpacing,
    getPixelData: () => imageVoxelManager.getScalarData(),
    sizeInBytes: rows * columns * 1, // 1 byte for now
    FrameOfReferenceUID: 'Stack_Frame_Of_Reference',
    imageFrame: {
      photometricInterpretation: rgb ? 'RGB' : 'MONOCHROME2',
    },
  };

  if (rgb) {
    getVerticalBarRGBImage(
      imageVoxelManager,
      rows,
      columns,
      barStart,
      barWidth
    );
  } else {
    getVerticalBarRGBImage(imageVoxelManager, rows, columns, barStart, barWidth);
  }

  // Todo: separated fakeImageLoader for cpu and gpu

  return {
    promise: Promise.resolve(image),
  };
};
