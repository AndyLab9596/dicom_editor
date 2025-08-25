import {
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  UpOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { EraserTool, ToolGroupManager } from "@cornerstonejs/tools";
import { MouseBindings } from "@cornerstonejs/tools/enums";
import { Button, Select } from "antd";
import CustomArrowAnnotateTool from "../common/customTools/CustomArrowAnnotateTool";
import CustomLabelTool from "../common/customTools/CustomLabelTool";
import {
  applyZoom,
  exportToJpeg,
  flipH,
  flipV,
  panDown,
  panLeft,
  panRight,
  panUp,
  resetPan,
  resetRotate,
  resetStackViewPort,
  rotateLeft,
  rotateRight,
} from "../common/stackViewPortFunctions/stackViewPortFunction";
import useDicomEditorStore from "../store/useDicomEditorStore";
import { extractUrlFromImageId } from "../helpers/dicomToCanvas";
import html2canvas from "html2canvas";
// const { DefaultHistoryMemo } = csUtils.HistoryMemo;

interface IProps {
  selectedToolGroupId: string;
}

const SideBarRight = ({ selectedToolGroupId }: IProps) => {
  const { singleViewPortStack } = useDicomEditorStore();

  const handleSelectDropdownTool = (toolName: string) => {
    if (toolName !== "") {
      const toolGroup = ToolGroupManager.getToolGroup(selectedToolGroupId);
      const currentActive = toolGroup.getCurrentActivePrimaryToolName();
      toolGroup.setToolPassive(currentActive);

      toolGroup.setToolActive(toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Primary, // Left Click
          },
        ],
      });
    }
  };

  const handleSelectExport = (type: string) => {
    if (type === "none") return;

    if (type === "jpeg") {
      exportToJpeg(
        extractUrlFromImageId(singleViewPortStack.getCurrentImageId())
      );
    } else if (type === "png") {
      exportToJpeg(
        extractUrlFromImageId(singleViewPortStack.getCurrentImageId())
      );
    } else if (type === "capture") {
      const cornerstoneLayer = document.querySelector(
        "#cornerstone-dicom-layer"
      ) as HTMLElement | null;

      if (cornerstoneLayer) {
        html2canvas(cornerstoneLayer).then((canvas) => {
          const url = canvas.toDataURL("image/png"); // hoặc "image/jpeg"
          const link = document.createElement("a");
          link.href = url;
          link.download = "dicom-image.png"; // khớp với MIME
          link.click();
        });
      } else {
        console.error("Viewport not found!");
      }
    }
  };

  // useEffect(() => {
  //   console.log(ToolGroupManager.getToolGroup(selectedToolGroupId));
  // }, [selectedToolGroupId]);

  return (
    <div className="w-full h-full p-2">
      <div className="flex gap-x-2 gap-y-2 flex-wrap p-1">
        <Button
          size="large"
          icon={<UpOutlined />}
          onClick={() => panUp(singleViewPortStack)}
        ></Button>
        <Button
          size="large"
          icon={<DownOutlined />}
          onClick={() => panDown(singleViewPortStack)}
        ></Button>
        <Button
          size="large"
          icon={<LeftOutlined />}
          onClick={() => panLeft(singleViewPortStack)}
        ></Button>
        <Button
          size="large"
          icon={<RightOutlined />}
          onClick={() => panRight(singleViewPortStack)}
        ></Button>
        <Button size="large" onClick={() => resetPan(singleViewPortStack)}>
          Reset Pan
        </Button>
      </div>

      <div className="flex gap-x-2 gap-y-2 flex-wrap p-1">
        <Button
          size="large"
          icon={<ZoomInOutlined />}
          onClick={() => applyZoom(singleViewPortStack, 0.8)}
        ></Button>
        <Button
          size="large"
          icon={<ZoomOutOutlined />}
          onClick={() => applyZoom(singleViewPortStack, 1.2)}
        ></Button>
        <Button size="large" onClick={() => flipH(singleViewPortStack)}>
          Flip H
        </Button>
        <Button size="large" onClick={() => flipV(singleViewPortStack)}>
          Flip V
        </Button>
      </div>
      <div className="flex gap-x-2 gap-y-2 flex-wrap p-1">
        <Button
          size="large"
          icon={<RotateRightOutlined />}
          onClick={() => rotateRight(singleViewPortStack, 30)}
        ></Button>
        <Button
          size="large"
          icon={<RotateLeftOutlined />}
          onClick={() => rotateLeft(singleViewPortStack, 30)}
        ></Button>
      </div>

      <div className="flex gap-x-5 gap-y-2 flex-wrap p-1">
        <Button size="large" onClick={() => resetRotate(singleViewPortStack)}>
          Reset Rotate
        </Button>
        <Button
          size="large"
          onClick={() => resetStackViewPort(singleViewPortStack)}
        >
          Reset viewport
        </Button>
      </div>

      <div className="flex gap-x-5 gap-y-2 flex-wrap p-1">
        <Select
          defaultValue=""
          options={[
            { value: "", label: "Select your tool" },
            { value: CustomLabelTool.toolName, label: "Label custom" },
            {
              value: CustomArrowAnnotateTool.toolName,
              label: "Arrow annotate custom",
            },
            { value: "CircularBrush", label: "Circular brush tool" },
            { value: "CircularEraser", label: "Circular eraser tool" },
            { value: EraserTool.toolName, label: "Eraser tool" },
          ]}
          onChange={(value) => handleSelectDropdownTool(value)}
          size="large"
        />
      </div>

      <div className="flex gap-x-5 gap-y-2 flex-wrap p-1">
        <Select
          defaultValue="none"
          options={[
            { value: "none", label: "Select your export" },
            { value: "png", label: "Export original to png" },
            { value: "jpeg", label: "Export original to jpeg" },
            { value: "capture", label: "Export with capture" },
          ]}
          onChange={(value) => handleSelectExport(value)}
          size="large"
        />
      </div>
    </div>
  );
};

export default SideBarRight;
