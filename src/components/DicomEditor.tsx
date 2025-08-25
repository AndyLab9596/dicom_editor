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
  ArrowAnnotateTool,
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
import { useEffect, useRef } from "react";
import CustomLabelTool from "../common/CustomLabelTool";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";
import useDicomEditorStore from "../store/useDicomEditorStore";
import CustomArrowAnnotateTool from "../common/CustomArrowAnnotateTool";

const toolGroupId = "myToolGroup";
const renderingEngineId = "myRenderingEngine";
const viewportId = "CT_STACK";

// const segmentIndex = 1;
// const imageId =
//   "wadouri:https://ohif-assets-new.s3.us-east-1.amazonaws.com/ACRIN-Regular/CT+CT+IMAGES/CT000009.dcm";

const nhanMtImageId =
  "wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000";

const DicomEditor = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const running = useRef(false);
  const viewportRef = useRef<Types.IStackViewport | null>(null);
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
      addTool(CustomArrowAnnotateTool);

      const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);
      toolGroup.addTool(CustomLabelTool.toolName);
      toolGroup.addTool(EraserTool.toolName);
      toolGroup.addTool(BrushTool.toolName);

      toolGroup.addToolInstance("CircularBrush", BrushTool.toolName, {
        activeStrategy: "FILL_INSIDE_CIRCLE",
      });

      toolGroup.addTool(CustomArrowAnnotateTool.toolName);

      toolGroup.setToolActive(CustomArrowAnnotateTool.toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Primary, // Left Click
          },
        ],
      });

      // toolGroup.setToolActive("CircularBrush", {
      //   bindings: [{ mouseButton: MouseBindings.Primary }],
      // });

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

      const segImages = await imageLoader.createAndCacheDerivedLabelmapImages([
        nhanMtImageId,
      ]);

      utilities.segmentation.setBrushSizeForToolGroup(toolGroupId, 2);

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
      const labelMap =
        segState.representationData[SegmentationRepresentations.Labelmap];
      const currentSeg = segmentation.getActiveSegmentation(viewportId);

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
      segmentation.segmentIndex.setActiveSegmentIndex(segmentationId, 1);
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

export default DicomEditor;
