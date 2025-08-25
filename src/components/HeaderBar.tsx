import { ToolGroupManager } from "@cornerstonejs/tools";
import WindowLevelButton from "./WindowLevelButton";
interface IProps {
  selectedViewportId: string;
}

const HeaderBar = ({ selectedViewportId }: IProps) => {
  const toolGroup =
    ToolGroupManager.getToolGroupForViewport(selectedViewportId);

  return (
    <div className="h-full p-2 flex items-center">
      <WindowLevelButton toolGroup={toolGroup} />
    </div>
  );
};

export default HeaderBar;
