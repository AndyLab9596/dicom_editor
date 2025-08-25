import { ArrowAnnotateTool } from "@cornerstonejs/tools";

export default class CustomArrowAnnotateTool extends ArrowAnnotateTool {
  constructor(props = {}) {
    super({
      ...props,
      configuration: {
        // override getTextCallback ngay từ config
        getTextCallback: (doneChangingTextCallback) => {
          this.getLabelFromUI().then((value) => {
            doneChangingTextCallback(value);
          });
        },
        changeTextCallback: (data, eventData, doneChangingTextCallback) => {
          this.getLabelFromUI().then((value) => {
            doneChangingTextCallback(value);
          });
        },
      },
    });
  }

  async getLabelFromUI(): Promise<string> {
    return new Promise((resolve) => {
      // Tạo overlay
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.background = "rgba(0,0,0,0.5)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "9999";

      // Tạo modal box
      const modal = document.createElement("div");
      modal.style.background = "#fff";
      modal.style.padding = "20px";
      modal.style.borderRadius = "8px";
      modal.style.minWidth = "300px";
      modal.style.textAlign = "center";

      // Tiêu đề
      const title = document.createElement("h3");
      title.innerText = "Nhập nhãn:";
      modal.appendChild(title);

      // Input
      const input = document.createElement("input");
      input.type = "text";
      input.style.width = "100%";
      input.style.marginBottom = "10px";
      input.autofocus = true;
      modal.appendChild(input);

      // Nút OK
      const okBtn = document.createElement("button");
      okBtn.innerText = "OK";
      okBtn.style.marginRight = "10px";
      modal.appendChild(okBtn);

      // Nút Cancel
      const cancelBtn = document.createElement("button");
      cancelBtn.innerText = "Cancel";
      modal.appendChild(cancelBtn);

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Xử lý sự kiện
      okBtn.onclick = () => {
        resolve(input.value || "");
        document.body.removeChild(overlay);
      };

      cancelBtn.onclick = () => {
        resolve("");
        document.body.removeChild(overlay);
      };

      input.onkeydown = (e) => {
        if (e.key === "Enter") {
          resolve(input.value || "");
          document.body.removeChild(overlay);
        }
      };
    });
  }
}
ArrowAnnotateTool.toolName = "CustomArrowAnnotateTool";
