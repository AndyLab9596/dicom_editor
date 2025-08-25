import {
  init as csRenderInit,
  RenderingEngine,
  utilities,
  type Types,
} from "@cornerstonejs/core";
import { ViewportType } from "@cornerstonejs/core/enums";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import { init as csToolsInit } from "@cornerstonejs/tools";
import { useEffect, useRef } from "react";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";

import vtkImageMedian3D from "@kitware/vtk.js/Imaging/General/Median3D";
import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";
import type { Actor, ActorEntry } from "@cornerstonejs/core/types";

const renderingEngineId = "myRenderingEngine";
const nhanMtImageId =
  "wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000";

const MedianFilterWithVtk = () => {
  const running = useRef(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const renderingEngineRef = useRef<RenderingEngine>(null);
  const viewportId = "VTK_VIEW";
  const viewportRef = useRef<Types.IStackViewport | null>(null);

  const initialize = async () => {
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
      if (running.current) return;
      running.current = true;

      await initialize();
      const renderingEngine = new RenderingEngine(renderingEngineId);

      const viewportInput = {
        viewportId,
        type: ViewportType.STACK,
        element: elementRef.current!,
        defaultOptions: {
          background: [0, 0, 0] as Types.Point3,
        },
      };
      renderingEngine.enableElement(viewportInput);

      const viewport = renderingEngine.getViewport(
        viewportId
      ) as Types.IStackViewport;
      viewportRef.current = viewport;

      await viewportRef.current.setStack([nhanMtImageId]);
      viewportRef.current.render();

      // === Lấy imageData gốc từ viewport ===
      const imageData = viewportRef.current.getImageData();

      // === Tạo Median Filter ===
      const medianFilter = vtkImageMedian3D.newInstance();
      medianFilter.setInputData(imageData);
      medianFilter.setKernelSize(3, 3, 1); // kernel XY, giữ nguyên Z
      const denoisedImage = medianFilter.getOutputData();

      // === Tạo Mapper & Actor cho ảnh đã filter ===
      const mapper = vtkImageMapper.newInstance();
      mapper.setInputData(denoisedImage);
      mapper.setSliceAtFocalPoint(true);

      const actor = vtkImageSlice.newInstance();
      actor.setMapper(mapper);

      // === Add actor vào viewport ===
      viewportRef.current.addActor({ actor: actor, uuid: utilities.uuidv4() });
      viewportRef.current.render();
    };

    setUp();
  }, []);

  return (
    <div
      className="w-full h-full"
      ref={elementRef}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default MedianFilterWithVtk;
