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
import {
  setSegmentIndexColor
} from "@cornerstonejs/tools/segmentation/config/segmentationColor";
import { Button, Select } from "antd";
import html2canvas from "html2canvas";
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
import { extractUrlFromImageId } from "../helpers/dicomToCanvas";
import useDicomEditorStore from "../store/useDicomEditorStore";
// const { DefaultHistoryMemo } = csUtils.HistoryMemo;

interface IProps {
  selectedToolGroupId: string;
}

const SideBarRight = ({ selectedToolGroupId }: IProps) => {
  const {
    singleViewPortStack,
    selectedViewportId,
    segmentationId,
    activeSegmentIndex,
  } = useDicomEditorStore();

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

  const handleSelectBrushWithColor = (selectedColor: string) => {
    const toolGroup = ToolGroupManager.getToolGroup(selectedToolGroupId);
    const currentActive = toolGroup.getCurrentActivePrimaryToolName();
    if (currentActive === "CircularBrush") {
      // const color = getSegmentIndexColor(
      //   selectedViewportId,
      //   segmentationId,
      //   activeSegmentIndex
      // );
      const colors: Record<string, [number, number, number, number]> = {
        "#FFFFFF": [255, 255, 255, 0.5],
        "#17B26A": [23, 178, 106, 0.5],
        "#FFE834": [255, 232, 52, 0.5],
        "#344054": [52, 64, 84, 0.5],
        "#F04438": [240, 68, 56, 0.5],
        "#2E90FA": [46, 144, 250, 0.5],
      };

      // const TWO_FIVE_FIVE = 255 as unknown as ColorLUT[0];
      // const ZERO_POINT_FIVE = 0.5 as unknown as ColorLUT[0];

      // addColorLUT([
      //   TWO_FIVE_FIVE,
      //   TWO_FIVE_FIVE,
      //   TWO_FIVE_FIVE,
      //   ZERO_POINT_FIVE,
      // ]);
      // const b26aIndex = addColorLUT([23, 178, 106, 0.5] as unknown as ColorLUT);
      // console.log(b26aIndex);

      // setColorLUT(selectedViewportId, segmentationId, b26aIndex);

      setSegmentIndexColor(
        selectedViewportId,
        segmentationId,
        activeSegmentIndex,
        colors[selectedColor]
      );

      // toolGroup.setToolConfiguration("CircularBrush", {
      //   activeStrategy: "FILL_INSIDE_CIRCLE",
      //   useCenterSegmentIndex: true,
      //   preview: {
      //     enabled: true,
      //     previewColors: {
      //       0: [23, 178, 106, 0.5],
      //     },
      //   },
      // });
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

      <div>
        {["#FFFFFF", "#17B26A", "#FFE834", "#344054", "#F04438", "#2E90FA"].map(
          (color, index) => {
            return (
              <Button
                variant="solid"
                key={color + index}
                onClick={() => handleSelectBrushWithColor(color)}
              >
                {color} {<div className={`bg-[${color}] h-3 w-3`}></div>}
              </Button>
            );
          }
        )}
      </div>
    </div>
  );
};

export default SideBarRight;
