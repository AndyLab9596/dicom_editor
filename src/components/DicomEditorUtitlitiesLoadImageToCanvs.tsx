import {
  init as csRenderInit,
  RenderingEngine,
  type Types
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
  ToolGroupManager,
  WindowLevelTool,
  ZoomTool
} from "@cornerstonejs/tools";
import {
  MouseBindings
} from "@cornerstonejs/tools/enums";
import { useEffect, useRef } from "react";
import CustomLabelTool from "../common/CustomLabelTool";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";
import useDicomEditorStore from "../store/useDicomEditorStore";

const toolGroupId = "myToolGroup";
const renderingEngineId = "myRenderingEngine";
const viewportId = "CT_STACK";

// const segmentIndex = 1;
// const imageId =
//   "wadouri:https://ohif-assets-new.s3.us-east-1.amazonaws.com/ACRIN-Regular/CT+CT+IMAGES/CT000009.dcm";

const nhanMtImageId =
  "wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000";

const DicomEditorUtitlitiesLoadImageToCanvs = () => {
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

      // const image = await imageLoader.loadImage(nhanMtImageId);
      // const csCanvas = image.getCanvas(); // canvas từ Cornerstone
      // const dataUrl = csCanvas.toDataURL("image/png"); // PNG
      // console.log("image", image);
      // console.log("dataUrl", dataUrl);

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
      // viewport.render();

      // ✅ Step 5: lấy canvas từ viewport
      const canvas = viewport.getCanvas();

      // ✅ Step 6: convert canvas → image
      const dataUrl = canvas.toDataURL("image/png");
      console.log(dataUrl);

      // viewportRef.current.render();
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

export default DicomEditorUtitlitiesLoadImageToCanvs;
