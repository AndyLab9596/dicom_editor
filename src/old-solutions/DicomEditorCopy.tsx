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
import CustomLabelTool from "../common/customTools/CustomLabelTool";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";
import useDicomEditorStore from "../store/useDicomEditorStore";
import CustomArrowAnnotateTool from "../common/customTools/CustomArrowAnnotateTool";
import { Slider } from "antd";

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
  const originalPixelDataRef = useRef<Float32Array | null>(null);
  const [blurStrength, setBlurStrength] = useState(0);

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

  // Create a 2D Gaussian kernel
  const createGaussianKernel = (size: number, sigma: number): number[] => {
    const kernel: number[] = [];
    const center = Math.floor(size / 2);
    let sum = 0;

    for (let i = 0; i < size; i++) {
      const x = i - center;
      const value = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel[i] = value;
      sum += value;
    }

    // Normalize the kernel
    return kernel.map(v => v / sum);
  };

  const apply2DGaussianBlur = (strength: number) => {
    if (!viewportRef.current || !originalPixelDataRef.current) return;

    try {
      const cornerstoneImage = viewportRef.current.getCornerstoneImage();
      const originalPixels = originalPixelDataRef.current;
      
      if (strength === 0) {
        // No blur, restore original image
        cornerstoneImage.voxelManager.setScalarData(originalPixels);
        viewportRef.current.render();
        return;
      }

      // Get image dimensions from the cornerstone image
      const { rows, columns } = cornerstoneImage;
      const width = columns;
      const height = rows;

      // Calculate kernel size and sigma based on strength
      const kernelSize = Math.max(3, Math.floor(strength * 2) * 2 + 1);
      const sigma = strength * 0.8;
      
      const kernel = createGaussianKernel(kernelSize, sigma);
      const radius = Math.floor(kernelSize / 2);
      
      const blurredPixels = new Float32Array(originalPixels.length);
      const tempPixels = new Float32Array(originalPixels.length);

      // Copy original data first
      tempPixels.set(originalPixels);

      // Horizontal pass
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let weightSum = 0;
          
          for (let k = -radius; k <= radius; k++) {
            const px = x + k;
            if (px >= 0 && px < width) {
              const weight = kernel[k + radius];
              sum += originalPixels[y * width + px] * weight;
              weightSum += weight;
            }
          }
          
          tempPixels[y * width + x] = weightSum > 0 ? sum / weightSum : originalPixels[y * width + x];
        }
      }

      // Vertical pass
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let weightSum = 0;
          
          for (let k = -radius; k <= radius; k++) {
            const py = y + k;
            if (py >= 0 && py < height) {
              const weight = kernel[k + radius];
              sum += tempPixels[py * width + x] * weight;
              weightSum += weight;
            }
          }
          
          blurredPixels[y * width + x] = weightSum > 0 ? sum / weightSum : tempPixels[y * width + x];
        }
      }

      // Update the cornerstone image directly
      cornerstoneImage.voxelManager.setScalarData(blurredPixels);
      viewportRef.current.render();

    } catch (error) {
      console.error('Error applying blur:', error);
      // Fallback to original image on error
      if (originalPixelDataRef.current) {
        const cornerstoneImage = viewportRef.current.getCornerstoneImage();
        cornerstoneImage.voxelManager.setScalarData(originalPixelDataRef.current);
        viewportRef.current.render();
      }
    }
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
        bindings: [
          {
            mouseButton: MouseBindings.Primary,
          },
        ],
      });

      toolGroup.setToolActive(PanTool.toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Auxiliary,
          },
        ],
      });

      toolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Secondary,
          },
        ],
      });

      annotation.config.style.setToolGroupToolStyles(selectedToolGroupId, {
        global: {
          textBoxFontSize: "20px",
          textBoxFontFamily: "Noto Sans JP",
          textBoxColor: "rgb(43, 0, 255)",
          textBoxColorSelected: "rgb(255, 0, 140)",
          textBoxColorHighlighted: "rgb(187, 0, 255)",
        },
      });

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

      // Store original pixel data after the image is loaded
      setTimeout(() => {
        try {
          const cornerstoneImage = viewportRef.current.getCornerstoneImage();
          const pixelArray = cornerstoneImage.voxelManager.getScalarData();
          originalPixelDataRef.current = new Float32Array(pixelArray);
          console.log('Original pixel data stored:', {
            length: originalPixelDataRef.current.length,
            dimensions: [cornerstoneImage.columns, cornerstoneImage.rows]
          });
        } catch (error) {
          console.error('Error storing original pixel data:', error);
        }
      }, 100);

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
    };

    setUp();

    return () => {
      setSingleViewPortStack(null);
    };
  }, []);

  const handleBlurChange = (value: number) => {
    setBlurStrength(value);
    apply2DGaussianBlur(value);
  };

  return (
    <>
      <div
        id="cornerstone-dicom-layer"
        className="w-full h-full"
        ref={elementRef}
        onContextMenu={(e) => e.preventDefault()}
      ></div>
      <div style={{ padding: '10px', background: '#f0f0f0' }}>
        <label>Blur Strength: {blurStrength}</label>
        <Slider
          min={0}
          max={5}
          step={0.5}
          value={blurStrength}
          onChange={handleBlurChange}
          style={{ marginTop: '8px' }}
        />
      </div>
    </>
  );
};

export default DicomEditor;