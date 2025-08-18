import { LeftOutlined, WindowsOutlined } from "@ant-design/icons";
import { Button } from "antd";

const HeaderBarControllers = () => {

  const handleMouseDown = (event) => {
    event.preventDefault();

    if (event.button === 1) {
      console.log("middle");
    }
    if (event.button === 2) {
      console.log("right click");
    }
    console.log(event);
  };

  return (
    <div className="w-full h-full">
      <Button
        icon={<LeftOutlined />}
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        <WindowsOutlined />
      </Button>
    </div>
  );
};

export default HeaderBarControllers;
