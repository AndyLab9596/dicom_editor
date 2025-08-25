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
  init as csToolsInit,
  PanTool,
  ToolGroupManager,
  WindowLevelTool,
  ZoomTool,
} from "@cornerstonejs/tools";
import { MouseBindings } from "@cornerstonejs/tools/enums";
import { useEffect, useRef, useState } from "react";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";
import useDicomEditorStore from "../store/useDicomEditorStore";
import { injectDenoiseShader } from "./injectDenoisShader";

const toolGroupId = "myToolGroup";
const renderingEngineId = "myRenderingEngine";
const viewportId = "CT_STACK";

const nhanMtImageId =
  "wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000";

const NoiseReduction = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const running = useRef(false);
  const viewportRef = useRef<Types.IStackViewport | null>(null);
  const renderEngineRef = useRef<RenderingEngine | null>(null);
  const { setSingleViewPortStack } = useDicomEditorStore();
  const [sigma, setSigma] = useState(1.0); // “độ mạnh” blur

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

      const image = await imageLoader.loadAndCacheImage(nhanMtImageId);

      console.log(image.getPixelData());

      const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);

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
      renderEngineRef.current = renderingEngine;

      const viewport = renderingEngine.getViewport(
        viewportId
      ) as Types.IStackViewport;

      viewportRef.current = viewport;

      setSingleViewPortStack(viewport);

      toolGroup.addViewport(viewportId, renderingEngineId);

      await viewportRef.current.setStack([nhanMtImageId]);
      viewportRef.current.render();

      injectDenoiseShader(viewportRef.current, sigma);
    };

    setUp();

    return () => {
      setSingleViewPortStack(null);
    };
  }, []);

  useEffect(() => {
    const re = renderEngineRef.current;
    if (!re) return;
    const vp = viewportRef.current;
    if (!vp) return;
    injectDenoiseShader(vp, sigma);
  }, [sigma]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        ref={elementRef}
        style={{ width: 512, height: 512, background: "black" }}
      />
      <label style={{ color: "#fff" }}>
        Noise (sigma): {sigma.toFixed(2)}
        <input
          type="range"
          min={0}
          max={3}
          step={0.1}
          value={sigma}
          onChange={(e) => setSigma(Number(e.target.value))}
        />
      </label>
      <small style={{ color: "#ccc" }}>
        Gợi ý: 0 = tắt blur, ~1.0 = nhẹ, &gt;2.0 = khá mạnh
      </small>
    </div>
  );
};

export default NoiseReduction;
