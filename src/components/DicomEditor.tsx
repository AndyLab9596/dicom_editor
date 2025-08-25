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
import { useEffect, useRef } from "react";
import CustomLabelTool from "../common/customTools/CustomLabelTool";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";
import useDicomEditorStore from "../store/useDicomEditorStore";
import CustomArrowAnnotateTool from "../common/customTools/CustomArrowAnnotateTool";

interface IProps {
  selectedImageId: string;
  selectedViewportId: string;
  renderingEngineId: string;
  selectedToolGroupId: string;
  activeSegmentIndex: number;
  segmentationId: string;
}

const DicomEditor = ({
  selectedImageId,
  renderingEngineId,
  selectedToolGroupId,
  selectedViewportId,
  activeSegmentIndex,
  segmentationId,
}: IProps) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const running = useRef(false);
  const viewportRef = useRef<Types.IStackViewport | null>(null);
  const renderEngineRef = useRef<RenderingEngine | null>(null);
  // const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { setSingleViewPortStack } =
    useDicomEditorStore();

  const initialize = async () => {
    await initProviders();
    await dicomImageLoaderInit({
      maxWebWorkers: navigator.hardwareConcurrency || 1,
    });
    await initVolumeLoader();
    await csRenderInit();
    await csToolsInit();
  };

  // const loadToCanvas = () => {
  //   loadImageToCanvas({
  //     canvas: canvasRef.current,
  //     imageId: viewportRef.current.getCurrentImageId(),
  //     useCPURendering: false,
  //     renderingEngineId: renderingEngineId,
  //   });
  // };

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
      addTool(CustomLabelTool);
      addTool(CustomArrowAnnotateTool);
      addTool(EraserTool);
      addTool(BrushTool);

      const toolGroup = ToolGroupManager.createToolGroup(selectedToolGroupId);

      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);
      toolGroup.addTool(CustomLabelTool.toolName);
      toolGroup.addTool(EraserTool.toolName);
      toolGroup.addTool(BrushTool.toolName);

      toolGroup.addToolInstance("CircularBrush", BrushTool.toolName, {
        activeStrategy: "FILL_INSIDE_CIRCLE",
      });

      toolGroup.addToolInstance("CircularEraser", BrushTool.toolName, {
        activeStrategy: "ERASE_INSIDE_CIRCLE",
      });

      toolGroup.addTool(CustomArrowAnnotateTool.toolName);

      toolGroup.setToolActive(WindowLevelTool.toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Primary, // Left Click
          },
        ],
      });

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
        viewportId: selectedViewportId,
        toolGroupId: selectedToolGroupId,
        toolName: LabelTool.toolName,
      });

      console.log(myAnnotation);

      annotation.config.style.setToolGroupToolStyles(selectedToolGroupId, {
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
        viewportId: selectedViewportId,
        type: ViewportType.STACK,
        element: elementRef.current,
        defaultOptions: {
          background: [0, 0, 0] as Types.Point3,
        },
      };

      renderingEngine.enableElement(viewportInput);

      const viewport = renderingEngine.getViewport(
        selectedViewportId
      ) as Types.IStackViewport;

      viewportRef.current = viewport;
      renderEngineRef.current = renderingEngine;

      setSingleViewPortStack(viewport);

      toolGroup.addViewport(selectedViewportId, renderingEngineId);

      await viewportRef.current.setStack([selectedImageId]);

      const segImages = await imageLoader.createAndCacheDerivedLabelmapImages([
        selectedImageId,
      ]);

      utilities.segmentation.setBrushSizeForToolGroup(selectedToolGroupId, 2);

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

      // const segState = segmentation.state.getSegmentation(segmentationId);
      // const labelMap =
      //   segState.representationData[SegmentationRepresentations.Labelmap];
      // const currentSeg = segmentation.getActiveSegmentation(viewportId);

      await segmentation.addSegmentationRepresentations(selectedViewportId, [
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
      segmentation.segmentIndex.setActiveSegmentIndex(
        segmentationId,
        activeSegmentIndex
      );
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
        id="cornerstone-dicom-layer"
        className="w-full h-full"
        ref={elementRef}
        onContextMenu={(e) => e.preventDefault()}
      ></div>
      {/* <canvas ref={canvasRef} height={500} width={400} /> */}
    </>
  );
};

export default DicomEditor;
