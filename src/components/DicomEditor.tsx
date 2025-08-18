import {
  init as csRenderInit,
  RenderingEngine,
  type Types,
} from "@cornerstonejs/core";
import { ViewportType } from "@cornerstonejs/core/enums";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import {
  addTool,
  BrushTool,
  init as csToolsInit,
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
import { setSegmentIndexColor } from "@cornerstonejs/tools/segmentation/config/segmentationColor";
import { useEffect, useRef } from "react";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";
import useDicomEditorStore from "../store/useDicomEditorStore";
// import { getStyle } from "@cornerstonejs/tools/segmentation/config/styleHelpers";
// import { setGlobalStyle } from "@cornerstonejs/tools/segmentation/setGlobalStyle";

const segmentationId = "MY_STACK_SEG";
const toolGroupId = "myToolGroup";
const renderingEngineId = "myRenderingEngine";
// const imageId =
//   "wadouri:https://ohif-assets-new.s3.us-east-1.amazonaws.com/ACRIN-Regular/CT+CT+IMAGES/CT000009.dcm";

const nhanMtImageId =
  "wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000";

const segmentIndex = 1;

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
      addTool(BrushTool);

      const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);
      toolGroup.addTool(BrushTool.toolName);

      toolGroup.addToolInstance("CircularBrush", BrushTool.toolName, {
        activeStrategy: "FILL_INSIDE_CIRCLE",
        // useCenterSegmentIndex: true,
        // preview: {
        //   enabled: false,
        //   previewColors: {
        //     0: [255, 255, 255, 128],
        //     1: [0, 255, 255, 255],
        //   },
        // },
      });

      // toolGroup.setToolConfiguration(BrushTool.toolName, {
      //   activeStrategy: "FILL_INSIDE_CIRCLE",
      //   strategySpecificConfiguration: {
      //     FILL_INSIDE_CIRCLE: {
      //       brushSize: 20,
      //     },
      //   },
      // });

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

      // Get Cornerstone imageIds and fetch metadata into RAM

      // Instantiate a rendering engine
      const renderingEngine = new RenderingEngine(renderingEngineId);
      // Create a stack viewport
      const viewportId = "CT_STACK";
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

      // Store viewport reference for zoom functions
      viewportRef.current = viewport;
      // TODO: CLARIFY LATER
      // BaseTool.createZoomPanMemo(viewport);

      setSingleViewPortStack(viewport);

      toolGroup.addViewport(viewportId, renderingEngineId);

      await viewportRef.current.setStack([nhanMtImageId]);

      utilities.segmentation.setBrushSizeForToolGroup(toolGroupId, 5);

      // setSegmentIndexColor(viewportId, segmentationId, 1, [0, 0, 0, 0]);

      // segmentation.segmentIndex.setActiveSegmentIndex(segmentationId, 1);

      if (viewportRef.current) {
        viewportRef.current.render();

        await segmentation.addSegmentations([
          {
            segmentationId,
            config: {
              label: segmentationId,
              segments: {
                0: {
                  segmentIndex: 0,
                  label: segmentationId,
                  active: true,
                  locked: false,
                  cachedStats: {},
                },
              },
            },
            representation: {
              type: SegmentationRepresentations.Labelmap,
              data: {
                imageIds: [nhanMtImageId],
              },
            },
          },
        ]);

        await segmentation.addLabelmapRepresentationToViewport(viewportId, [
          {
            segmentationId,
            type: SegmentationRepresentations.Labelmap,
          },
        ]);

        segmentation.segmentIndex.setActiveSegmentIndex(segmentationId, segmentIndex);
      }
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
