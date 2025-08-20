import { decodeImageIdInfo } from "./testUtils";

/**
 * Returns the requested metadata for the imageId
 *
 * Note: fakeMetadataLoader should be added as a provider for each test
 *
 * ```javascript
 * metaData.addProvider(fakeMetaDataProvider, 10000)
 * ```
 *
 * @param {string} type - metadata type
 * @param {string} imageId - the imageId
 * @returns metadata based on the imageId and type
 */
export function fakeMetaDataProvider(type, imageId) {
  if (!imageId.startsWith('fakeImageLoader')) {
    return;
  }

  // don't try to provide incorrect information for derived
  // images, as it will cause errors, rather let the rest of providers
  // handle it
  if (imageId.startsWith('derived')) {
    return;
  }

  if (Array.isArray(imageId)) {
    return;
  }

  if (typeof imageId !== 'string') {
    throw new Error(
      `Expected imageId to be of type string, but received ${imageId}`
    );
  }

  const imageInfo = decodeImageIdInfo(imageId);

  if (!imageInfo) {
    return;
  }

  const {
    rows,
    columns,
    barStart,
    barWidth,
    xSpacing,
    ySpacing,
    sliceIndex = 0,
    rgb,
    PT = false,
    id,
  } = imageInfo;

  const modality = PT ? 'PT' : 'MR';
  const photometricInterpretation = rgb ? 'RGB' : 'MONOCHROME2';

  if (type === 'imagePixelModule') {
    const imagePixelModule = {
      photometricInterpretation,
      rows,
      columns,
      samplesPerPixel: rgb ? 3 : 1,
      bitsAllocated: rgb ? 24 : 8,
      bitsStored: rgb ? 24 : 8,
      highBit: rgb ? 24 : 8,
      pixelRepresentation: 0,
    };

    return imagePixelModule;
  } else if (type === 'generalSeriesModule') {
    const generalSeriesModule = {
      modality: modality,
    };
    return generalSeriesModule;
  } else if (type === 'scalingModule') {
    const scalingModule = {
      suvbw: 100,
      suvlbm: 100,
      suvbsa: 100,
    };
    return scalingModule;
  } else if (type === 'imagePlaneModule') {
    const imagePlaneModule = {
      rows,
      columns,
      width: rows,
      height: columns,
      imageOrientationPatient: [1, 0, 0, 0, 1, 0],
      rowCosines: [1, 0, 0],
      columnCosines: [0, 1, 0],
      imagePositionPatient: [0, 0, sliceIndex],
      pixelSpacing: [xSpacing, ySpacing],
      rowPixelSpacing: ySpacing,
      columnPixelSpacing: xSpacing,
    };

    return imagePlaneModule;
  } else if (type === 'voiLutModule') {
    return {
      windowWidth: undefined,
      windowCenter: undefined,
    };
  } else if (type === 'modalityLutModule') {
    return {
      rescaleSlope: undefined,
      rescaleIntercept: undefined,
    };
  }
}