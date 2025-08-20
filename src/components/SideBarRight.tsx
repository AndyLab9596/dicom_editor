import {
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { utilities as csUtils } from "@cornerstonejs/core";
import {
  ArrowAnnotateTool,
  EraserTool,
  LabelTool,
  ToolGroupManager,
} from "@cornerstonejs/tools";
import { MouseBindings } from "@cornerstonejs/tools/enums";
import { Button, Select } from "antd";
import { useEffect } from "react";
import useDicomEditorStore from "../store/useDicomEditorStore";
import CustomLabelTool from "../common/CustomLabelTool";
const { DefaultHistoryMemo } = csUtils.HistoryMemo;

const toolGroupId = "myToolGroup";

const SideBarRight = () => {
  const { singleViewPortStack } = useDicomEditorStore();

  const zoomIn = () => {
    if (singleViewPortStack) {
      console.log(singleViewPortStack.getViewPresentation());
      console.log(singleViewPortStack.getProperties());
      console.log(singleViewPortStack.getProperties());

      const camera = singleViewPortStack.getCamera();
      const { parallelScale } = camera;
      camera.parallelScale = parallelScale * 0.8; // Zoom in by 20%
      singleViewPortStack.setCamera(camera);
      singleViewPortStack.render();
    }
  };

  const zoomOut = () => {
    if (singleViewPortStack) {
      const camera = singleViewPortStack.getCamera();
      const { parallelScale } = camera;
      camera.parallelScale = parallelScale * 1.2; // Zoom in by 20%
      singleViewPortStack.setCamera(camera);
      singleViewPortStack.render();
    }
  };

  const reset = () => {
    if (singleViewPortStack) {
      singleViewPortStack.resetCamera({
        resetZoom: true,
        resetToCenter: true,
        resetPan: true,
        suppressEvents: true,
      });
      singleViewPortStack.render();
    }
  };

  const rotateRight = () => {
    if (singleViewPortStack) {
      const camera = singleViewPortStack.getCamera();
      const rotation = camera.rotation + 30;
      singleViewPortStack.setViewPresentation({ rotation });
      singleViewPortStack.render();
    }
  };

  const resetRotate = () => {
    if (singleViewPortStack) {
      singleViewPortStack.setViewPresentation({ rotation: 0 });
      singleViewPortStack.render();
    }
  };

  const panUp = () => {
    if (singleViewPortStack) {
      const currentPan = singleViewPortStack.getPan() || [0, 0];
      const newPan: [number, number] = [currentPan[0], currentPan[1] - 50]; // Pan up by 50 pixels
      singleViewPortStack.setViewPresentation({ pan: newPan });
      singleViewPortStack.render();
    }
  };

  const panDown = () => {
    if (singleViewPortStack) {
      const currentPan = singleViewPortStack.getPan() || [0, 0];
      const newPan: [number, number] = [currentPan[0], currentPan[1] + 50]; // Pan down by 50 pixels

      singleViewPortStack.setViewPresentation({ pan: newPan });
      singleViewPortStack.render();
    }
  };

  const panLeft = () => {
    if (singleViewPortStack) {
      const currentPan = singleViewPortStack.getPan() || [0, 0];
      const newPan: [number, number] = [currentPan[0] - 50, currentPan[1]]; // Pan left by 50 pixels

      singleViewPortStack.setViewPresentation({ pan: newPan });
      singleViewPortStack.render();
    }
  };

  const panRight = () => {
    if (singleViewPortStack) {
      const currentPan = singleViewPortStack.getPan() || [0, 0];
      const newPan: [number, number] = [currentPan[0] + 50, currentPan[1]]; // Pan right by 50 pixels

      singleViewPortStack.setViewPresentation({ pan: newPan });
      singleViewPortStack.render();
    }
  };

  const resetPan = () => {
    if (singleViewPortStack) {
      singleViewPortStack.setViewPresentation({
        pan: [0, 0] as [number, number],
      });
      singleViewPortStack.render();
    }
  };

  const flipH = () => {
    if (singleViewPortStack) {
      const { flipHorizontal } = singleViewPortStack.getCamera();
      singleViewPortStack.setCamera({ flipHorizontal: !flipHorizontal });
      singleViewPortStack.render();
    }
  };

  const flipV = () => {
    if (singleViewPortStack) {
      const { flipVertical } = singleViewPortStack.getCamera();
      singleViewPortStack.setCamera({ flipVertical: !flipVertical });
      singleViewPortStack.render();
    }
  };

  const resetViewPort = () => {
    if (singleViewPortStack) {
      singleViewPortStack.resetCamera();
      singleViewPortStack.resetProperties();
      singleViewPortStack.render();
    }
  };

  const undo = () => {
    DefaultHistoryMemo.undo();
  };

  const redo = () => {
    DefaultHistoryMemo.redo();
  };

  const handleSelectDropdownTool = (toolName: string) => {
    if (toolName !== "") {
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      const currentActive = toolGroup.getCurrentActivePrimaryToolName();
      toolGroup.setToolPassive(currentActive);

      toolGroup.setToolActive(toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Primary, // Left Click
          },
        ],
      });
      console.log("value.toolName:::", toolName);
    }
  };

  useEffect(() => {
    console.log(ToolGroupManager.getToolGroup(toolGroupId));
  }, []);

  return (
    <div className="w-full h-full p-2">
      <div className="flex gap-x-1 gap-y-2 flex-wrap">
        <Button icon={<ZoomInOutlined />} onClick={zoomIn}>
          Zoom In
        </Button>
        <Button icon={<ZoomOutOutlined />} onClick={zoomOut}>
          Zoom Out
        </Button>

        <Button icon={<RotateRightOutlined />} onClick={rotateRight}>
          Rotate right (30deg)
        </Button>

        <Button onClick={panUp}>pan up</Button>
        <Button onClick={panDown}>pan down</Button>
        <Button onClick={panLeft}>pan left</Button>
        <Button onClick={panRight}>pan right</Button>
        <Button onClick={flipH}>Flip H</Button>
        <Button onClick={flipV}>Flip V</Button>

        {/* <Select defaultValue="" options={[
            {value: "", label: "select reset option"},
            {value: "reset_zoom", label: "reset zoom"},
            {value: "reset_pan", label: "reset pan"},
            {value: "reset zoom + pan", label: "reset zoom + pan"},
            {}
        ]} /> */}

        <Button onClick={resetPan}>reset right</Button>

        <Button onClick={reset}>Reset</Button>

        <Button onClick={resetRotate}>Reset Rotate</Button>

        <Button onClick={resetViewPort}>Reset Viewport</Button>
        <Button onClick={undo}>Undo</Button>
        <Button onClick={redo}>Redo</Button>

        <Select
          defaultValue=""
          options={[
            { value: "", label: "Select your tool" },
            // { value: LengthTool.toolName, label: "Lenght" },
            // { value: HeightTool.toolName, label: "height" },
            { value: ArrowAnnotateTool.toolName, label: "Arrow Annotate" },
            { value: EraserTool.toolName, label: "Eraser" },
            { value: LabelTool.toolName, label: "Label" },
            { value: CustomLabelTool.toolName, label: "Label custom" },
          ]}
          onChange={(value) => handleSelectDropdownTool(value)}
        />
      </div>
    </div>
  );
};

export default SideBarRight;
