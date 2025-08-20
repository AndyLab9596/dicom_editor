import {
    init as csRenderInit
} from "@cornerstonejs/core";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import {
    init as csToolsInit
} from "@cornerstonejs/tools";
import initProviders from "./initProviders";
import initVolumeLoader from "./initVolumeLoader";


export const initialize = async () => {
  await initProviders();
  await dicomImageLoaderInit({
    maxWebWorkers: navigator.hardwareConcurrency || 1,
  });
  await initVolumeLoader();
  await csRenderInit();
  await csToolsInit();
};
