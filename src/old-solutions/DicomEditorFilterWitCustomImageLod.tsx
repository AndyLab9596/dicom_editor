import {
  init as csRenderInit,
  imageLoader,
  RenderingEngine,
  type Types
} from "@cornerstonejs/core";
import { ViewportType } from "@cornerstonejs/core/enums";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import {
  init as csToolsInit
} from "@cornerstonejs/tools";
import { useEffect, useRef } from "react";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";
import useDicomEditorStore from "../store/useDicomEditorStore";
import { loadImage } from "../custom/customImageLoader";

const toolGroupId = "myToolGroup";
const renderingEngineId = "myRenderingEngine";
const viewportId = "CT_STACK";

// const segmentIndex = 1;
// const imageId =
//   "wadouri:https://ohif-assets-new.s3.us-east-1.amazonaws.com/ACRIN-Regular/CT+CT+IMAGES/CT000009.dcm";

const nhanMtImageId =
  "custom1:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000?filter=gaussian&sigma=5";

const DicomEditorFilterWithCustomImageLoad = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const running = useRef(false);
  const viewportRef = useRef<Types.IStackViewport | null>(null);
  const { setSingleViewPortStack } = useDicomEditorStore();

  const initialize = async () => {
    imageLoader.registerImageLoader("custom1", loadImage);

    await initProviders();
    await dicomImageLoaderInit({
      maxWebWorkers: navigator.hardwareConcurrency || 1,
    });
    await initVolumeLoader();
    await csRenderInit();
    await csToolsInit();


  };

  useEffect(() => {
    const setUp = async () => {
      if (running.current) {
        return;
      }

      running.current = true;

      await initialize();
    
      const renderingEngine = new RenderingEngine(renderingEngineId);
      const viewportInput = {
        viewportId,
        type: ViewportType.STACK,
        element: elementRef.current,
        defaultOptions: {
          background: [0, 0, 0] as Types.Point3,
        },
      };

      renderingEngine.enableElement(viewportInput);

      const viewport = renderingEngine.getViewport(
        viewportId
      ) as Types.IStackViewport;

      viewportRef.current = viewport;

      setSingleViewPortStack(viewport);

      await viewportRef.current.setStack([nhanMtImageId]);
        
      viewportRef.current.render();
    };

    setUp();

    return () => {
      setSingleViewPortStack(null);
    };
  }, []);

  return (
    <div
      className="w-full h-full"
      ref={elementRef}
      onContextMenu={(e) => e.preventDefault()}
    ></div>
  );
};

export default DicomEditorFilterWithCustomImageLoad;
