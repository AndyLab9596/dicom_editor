import { init as csCoreRenderInit } from "@cornerstonejs/core";
import { init as csImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import { init as csToolsInit } from "@cornerstonejs/tools";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";


const useDicomEditorHelper = () => {
  const initialize = async () => {
    /**NOTE: DON'T CHANGE THE ORDER OF INIT */
    await initProviders();
    await csImageLoaderInit({
      maxWebWorkers: navigator.hardwareConcurrency || 1,
    });
    await initVolumeLoader();
    await csCoreRenderInit();
    await csToolsInit();
  };

  return {
    initialize,
  };
};

export default useDicomEditorHelper;
