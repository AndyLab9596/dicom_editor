import {
  init as csRenderInit,
  Enums,
  imageLoader,
  RenderingEngine,
  StackViewport,
  type Types,
} from "@cornerstonejs/core";
import { ViewportType } from "@cornerstonejs/core/enums";
import { loadImageToCanvas } from "@cornerstonejs/core/utilities";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import {
  addTool,
  BrushTool,
  init as csToolsInit,
  EraserTool,
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
import CustomArrowAnnotateTool from "../common/customTools/CustomArrowAnnotateTool";
import CustomLabelTool from "../common/customTools/CustomLabelTool";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";
import useDicomEditorStore from "../store/useDicomEditorStore";
import type { Point3 } from "@cornerstonejs/core/types";

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
  const navRef = useRef<HTMLCanvasElement>(null);

  // canvas nền lưu ảnh gốc, không render trực tiếp ra UI
  const bgCanvasRef = useRef<HTMLCanvasElement>(
    document.createElement("canvas")
  );

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

  function worldToImageCoordsFake(
    world: [number, number, number],
    spacing: Point3
  ) {
    const [xSpacing, ySpacing] = spacing;
    const col = world[0] / xSpacing;
    const row = world[1] / ySpacing;
    return [row, col];
  }

  // Thay toàn bộ hàm updateNavigatorRectangle bằng bản này
  const updateNavigatorRectangle = (stackViewport: StackViewport) => {
    if (!navRef.current) return;
    const ctx = navRef.current.getContext("2d");
    if (!ctx) return;

    const navCanvas = navRef.current;

    // 1) Vẽ lại thumbnail từ hidden bgCanvas
    ctx.clearRect(0, 0, navCanvas.width, navCanvas.height);
    ctx.drawImage(bgCanvasRef.current, 0, 0, navCanvas.width, navCanvas.height);

    // 2) Lấy kích thước ảnh gốc (pixel) để tính scale sang navigator
    const imageData = stackViewport.getImageData();
    if (!imageData) return;

    const [imgWidth, imgHeight] = imageData.dimensions; // [x, y]
    const scaleX = navCanvas.width / imgWidth;
    const scaleY = navCanvas.height / imgHeight;

    // 3) Lấy bốn góc của main canvas (theo pixel canvas)
    const mainCanvas = stackViewport.getCanvas();
    const canvasW = mainCanvas.width;
    const canvasH = mainCanvas.height;

    const corners: Types.Point2[] = [
      [0, 0],
      [canvasW, 0],
      [canvasW, canvasH],
      [0, canvasH],
    ];

    // 4) Map: canvas → world → image(ij) → navigator(x,y)
    const mapped: [number, number][] = [];
    const imageId = stackViewport.getCurrentImageId();

    for (const pt of corners) {
      const world = stackViewport.canvasToWorld(pt);
      let ij;
      try {
        if (imageId && world) {
          ij = worldToImageCoordsFake(world, imageData.spacing);
        }
      } catch (error) {
        console.log("worldToImageCoords:::error", error);
      }

      console.log("ij", ij);

      if (!ij) continue;

      const row = ij[0];
      const col = ij[1];

      const clampedCol = Math.max(0, Math.min(imgWidth, col));
      const clampedRow = Math.max(0, Math.min(imgHeight, row));

      const nx = clampedCol * scaleX;
      const ny = clampedRow * scaleY;

      mapped.push([nx, ny]);
    }

    if (mapped.length !== 4) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(mapped[0][0], mapped[0][1]);
    ctx.lineTo(mapped[1][0], mapped[1][1]);
    ctx.lineTo(mapped[2][0], mapped[2][1]);
    ctx.lineTo(mapped[3][0], mapped[3][1]);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";
    ctx.stroke();
    ctx.restore();
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
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });

      toolGroup.setToolActive(PanTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Auxiliary }],
      });

      toolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Secondary }],
      });

      // Instantiate rendering engine
      const renderingEngine = new RenderingEngine(renderingEngineId);

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

      // segmentation setup (giữ nguyên như code của bạn)
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

      await segmentation.addSegmentationRepresentations(selectedViewportId, [
        {
          segmentationId,
          type: SegmentationRepresentations.Labelmap,
          config: {},
        },
      ]);

      segmentation.segmentIndex.setActiveSegmentIndex(
        segmentationId,
        activeSegmentIndex
      );

      viewportRef.current.render();

      // Load ảnh gốc vào hidden background canvas
      await loadImageToCanvas({
        canvas: bgCanvasRef.current,
        imageId: selectedImageId,
        useCPURendering: true,
        renderingEngineId,
      });

      // Render initial navigator
      if (viewportRef.current.getCurrentImageId()) {
        updateNavigatorRectangle(viewportRef.current);

        // Listen camera events
        viewportRef.current.element.addEventListener(
          Enums.Events.CAMERA_MODIFIED,
          () => updateNavigatorRectangle(viewportRef.current!)
        );
      }
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

      <canvas
        ref={navRef}
        width={150}
        height={150}
        style={{ border: "1px solid gray" }}
      />
    </>
  );
};

export default DicomEditor;
