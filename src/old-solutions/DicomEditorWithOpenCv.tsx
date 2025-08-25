import {
  init as csRenderInit,
  imageLoader,
  RenderingEngine,
  type Types,
} from "@cornerstonejs/core";
import { ViewportType } from "@cornerstonejs/core/enums";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import {
  addTool,
  annotation,
  BrushTool,
  init as csToolsInit,
  EraserTool,
  LabelTool,
  PanTool,
  segmentation,
  ToolGroupManager,
  utilities,
  WindowLevelTool,
  ZoomTool,
} from "@cornerstonejs/tools";
import {
  MouseBindings,
  SegmentationRepresentations,
} from "@cornerstonejs/tools/enums";
import { useEffect, useRef, useState } from "react";
import CustomLabelTool from "../common/CustomLabelTool";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";
import useDicomEditorStore from "../store/useDicomEditorStore";
import cvReadyPromise from "@techstark/opencv-js";
import type { IImage } from "@cornerstonejs/core/types";
import { Slider } from "antd";

const toolGroupId = "myToolGroup";
const renderingEngineId = "myRenderingEngine";
const viewportId = "CT_STACK";

// const segmentIndex = 1;
// const imageId =
//   "wadouri:https://ohif-assets-new.s3.us-east-1.amazonaws.com/ACRIN-Regular/CT+CT+IMAGES/CT000009.dcm";

const nhanMtImageId =
  "wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000";

const DicomEditorWithOpenCv = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const running = useRef(false);
  const viewportRef = useRef<Types.IStackViewport | null>(null);
  const [kernel, setKernel] = useState(3);

  const applyMedianFilter = async (image: IImage, kernelSize: number) => {
    const pixelData = image.getPixelData();
    const rows = image.rows;
    const cols = image.columns;

    // Convert pixelData -> OpenCV Mat
    const cv = await cvReadyPromise;
    console.log("OpenCV.js is ready!");
    // You can now use OpenCV functions here
    if (cv) {
      const src = cv.matFromArray(rows, cols, cv.CV_16UC1, pixelData);
      const dst = new cv.Mat();

      // Apply Median filter
      cv.medianBlur(src, dst, kernelSize);

      // Convert back
      const filtered = new Uint16Array(dst.data16S);

      // Override pixelData
      image.getPixelData = () => filtered;

      src.delete();
      dst.delete();
    }
  };

  const { setSingleViewPortStack } = useDicomEditorStore();

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
      if (running.current) {
        return;
      }

      running.current = true;

      await initialize();
      addTool(WindowLevelTool);
      addTool(PanTool);
      addTool(ZoomTool);
      addTool(LabelTool);
      addTool(EraserTool);
      addTool(BrushTool);
      addTool(CustomLabelTool);

      const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);
      // toolGroup.addTool(LabelTool.toolName, {
      //   configuration: { getTextCallback },
      // });
      toolGroup.addTool(CustomLabelTool.toolName);
      toolGroup.addTool(EraserTool.toolName);
      toolGroup.addTool(BrushTool.toolName);

      toolGroup.addToolInstance("CircularBrush", BrushTool.toolName, {
        activeStrategy: "FILL_INSIDE_CIRCLE",
      });

      toolGroup.setToolActive("CircularBrush", {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });

      // toolGroup.setToolActive(WindowLevelTool.toolName, {
      //   bindings: [
      //     {
      //       mouseButton: MouseBindings.Primary, // Left Click
      //     },
      //   ],
      // });
      toolGroup.setToolActive(PanTool.toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Auxiliary, // Middle Click
          },
        ],
      });
      toolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Secondary, // Right Click
          },
        ],
      });

      /**
       * CUSTOM ANNOTATION
       */
      const myAnnotation = annotation.config.getFont({
        viewportId,
        toolGroupId,
        toolName: LabelTool.toolName,
      });

      console.log(myAnnotation);

      annotation.config.style.setToolGroupToolStyles(toolGroupId, {
        global: {
          textBoxFontSize: "20px",
          textBoxFontFamily: "Noto Sans JP",
          textBoxColor: "rgb(43, 0, 255)",
          textBoxColorSelected: "rgb(255, 0, 140)",
          textBoxColorHighlighted: "rgb(187, 0, 255)",
        },
      });

      // Get Cornerstone imageIds and fetch metadata into RAM

      // Instantiate a rendering engine
      const renderingEngine = new RenderingEngine(renderingEngineId);
      // Create a stack viewport
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

      toolGroup.addViewport(viewportId, renderingEngineId);

      await viewportRef.current.setStack([nhanMtImageId]);
      // const volume = await convertStackToVolumeLabelmap({imageIds: [nhanMtImageId]});
      // console.log(volume);

      const segImages = await imageLoader.createAndCacheDerivedLabelmapImages([
        nhanMtImageId,
      ]);

      const segmentationId = "mySegmentation";
      segmentation.addSegmentations([
        {
          segmentationId,
          representation: {
            type: SegmentationRepresentations.Labelmap,
            data: {
              imageIds: segImages.map((it) => it.imageId),
            },
          },
        },
      ]);

      const segState = segmentation.state.getSegmentation(segmentationId);
      console.log(segState);
      const labelMap =
        segState.representationData[SegmentationRepresentations.Labelmap];
      console.log("labelMap", labelMap);

      const currentSeg = segmentation.getActiveSegmentation(viewportId);
      console.log(currentSeg);
      // if (labelmap?.labelmapBuffer) {
      //   // Fill toàn bộ buffer bằng 0 (rỗng)
      //   labelmap.labelmapBuffer.fill(0);
      // }

      await segmentation.addSegmentationRepresentations(viewportId, [
        {
          segmentationId,
          type: SegmentationRepresentations.Labelmap,
          config: {},
        },
      ]);

      // segmentationStyle.setStyle(
      //   {
      //     type: SegmentationRepresentations.Labelmap,
      //     viewportId,
      //     segmentationId,
      //     segmentIndex: 1,
      //   },
      //   {
      //     fillAlpha: 0,
      //     fillAlphaInactive: 0.3,
      //     outlineOpacity: 0.7,
      //     outlineWidth: 2,
      //     renderFill: true,
      //     fillAlphaAutoGenerated: 0,
      //   }
      // );
      utilities.segmentation.setBrushSizeForToolGroup(toolGroupId, 5);
      segmentation.segmentIndex.setActiveSegmentIndex(segmentationId, 1);

      const image = viewportRef.current.getCornerstoneImage();
      console.log(image);
      // Apply filter lần đầu
      applyMedianFilter(image, kernel);

      viewportRef.current.render();
    };

    setUp();

    return () => {
      setSingleViewPortStack(null);
    };
  }, []);

  return (
    <>
      <div
        className="w-full h-full"
        ref={elementRef}
        onContextMenu={(e) => e.preventDefault()}
      ></div>
      <div style={{ padding: 20, background: "#111" }}>
        <Slider
          min={1}
          max={15}
          step={2}
          value={kernel}
          onChange={async (val) => {
            setKernel(val);
            const image = viewportRef.current?.getCornerstoneImage();
            if (image) {
              try {
                await applyMedianFilter(image, val);
              } catch(error) {
                console.log("asdsad", error);
              }
              viewportRef.current?.render();
            }
          }}
        />
      </div>
    </>
  );
};

export default DicomEditorWithOpenCv;
