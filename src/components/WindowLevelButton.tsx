import { WindowsOutlined } from "@ant-design/icons";
import { WindowLevelTool } from "@cornerstonejs/tools";
import type IToolGroup from "@cornerstonejs/tools/types/IToolGroup";
import { Button } from "antd";
import { useMemo, useState } from "react";
import {
    MAPPING_EVENT_MOUSE_DOWN,
    MouseConstant,
} from "../constants/MouseConstant";


interface IProps {
  toolGroup: IToolGroup;
}

const WindowLevelButton = ({ toolGroup }: IProps) => {
  const [mouseBindingInteger, setMouseBindingInteger] = useState(-1);

  useMemo(() => {
    if (toolGroup?.id) {
      const windowLevel = toolGroup.toolOptions[WindowLevelTool.toolName];
      if (windowLevel.mode === "Active") {
        const mouseInteger = windowLevel.bindings.map((b) => b.mouseButton)[0];
        setMouseBindingInteger(mouseInteger);
        return mouseInteger;
      } else {
        setMouseBindingInteger(-1);
        return -1;
      }
    }
  }, [toolGroup?.id, toolGroup?.toolOptions]);

  const handleMouseDown = (event) => {
    event.preventDefault();
    const mappingToMouseBinding = MAPPING_EVENT_MOUSE_DOWN[event.button];

    if (mappingToMouseBinding === mouseBindingInteger) {
      const currentActive = toolGroup.getCurrentActivePrimaryToolName();
      toolGroup.setToolPassive(currentActive);
      setMouseBindingInteger(-1);
      return;
    } else {
      const currentActive = toolGroup.getCurrentActivePrimaryToolName();
      toolGroup.setToolPassive(currentActive);
      toolGroup.setToolActive(WindowLevelTool.toolName, {
        bindings: [
          {
            mouseButton: mappingToMouseBinding,
          },
        ],
      });
      setMouseBindingInteger(mappingToMouseBinding);
    }
  };

  return (
    <Button
      icon={<WindowsOutlined />}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => handleMouseDown(e)}
    >
      {MouseConstant[mouseBindingInteger] ?? ""}
    </Button>
  );
};

export default WindowLevelButton;
