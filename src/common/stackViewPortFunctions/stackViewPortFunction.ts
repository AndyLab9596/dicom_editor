import type { StackViewport } from "@cornerstonejs/core";
import { utilities as csUtils } from "@cornerstonejs/core";

const { DefaultHistoryMemo } = csUtils.HistoryMemo;

export const applyZoom = (stackViewPort: StackViewport, scale: number) => {
  if (stackViewPort) {
    const camera = stackViewPort.getCamera();
    const { parallelScale } = camera;
    camera.parallelScale = parallelScale * scale;
    stackViewPort.setCamera(camera);
    stackViewPort.render();
  } else {
    throw new Error("No stack view port found");
  }
};

export const resetStackViewPort = (stackViewPort: StackViewport) => {
  if (stackViewPort) {
    stackViewPort.resetCamera({
      resetZoom: true,
      resetToCenter: true,
      resetPan: true,
      suppressEvents: true,
    });
    stackViewPort.render();
  }
};

export const rotateLeft = (stackViewPort: StackViewport, deg: number) => {
  if (stackViewPort) {
    const camera = stackViewPort.getCamera();
    let rotation = camera.rotation - deg;

    // normalize to [0, 360)
    if (rotation < 0) {
      rotation += 360;
    }
    stackViewPort.setViewPresentation({ rotation });
    stackViewPort.render();
  }
};

export const rotateRight = (stackViewPort: StackViewport, deg: number) => {
  if (stackViewPort) {
    const camera = stackViewPort.getCamera();
    let rotation = camera.rotation + deg;

    // normalize to [0, 360)
    if (rotation >= 360) {
      rotation -= 360;
    }
    stackViewPort.setViewPresentation({ rotation });
    stackViewPort.render();
  }
};

export const resetRotate = (stackViewPort: StackViewport) => {
  if (stackViewPort) {
    stackViewPort.setViewPresentation({ rotation: 0 });
    stackViewPort.render();
  }
};

export const panUp = (stackViewPort: StackViewport) => {
  if (stackViewPort) {
    const currentPan = stackViewPort.getPan() || [0, 0];
    const newPan: [number, number] = [currentPan[0], currentPan[1] - 50]; // Pan up by 50 pixels
    stackViewPort.setViewPresentation({ pan: newPan });
    stackViewPort.render();
  }
};

export const panDown = (stackViewPort: StackViewport) => {
  if (stackViewPort) {
    const currentPan = stackViewPort.getPan() || [0, 0];
    const newPan: [number, number] = [currentPan[0], currentPan[1] + 50]; // Pan down by 50 pixels

    stackViewPort.setViewPresentation({ pan: newPan });
    stackViewPort.render();
  }
};

export const panLeft = (stackViewPort: StackViewport) => {
  if (stackViewPort) {
    const currentPan = stackViewPort.getPan() || [0, 0];
    const newPan: [number, number] = [currentPan[0] - 50, currentPan[1]]; // Pan left by 50 pixels

    stackViewPort.setViewPresentation({ pan: newPan });
    stackViewPort.render();
  }
};

export const panRight = (stackViewPort: StackViewport) => {
  if (stackViewPort) {
    const currentPan = stackViewPort.getPan() || [0, 0];
    const newPan: [number, number] = [currentPan[0] + 50, currentPan[1]]; // Pan right by 50 pixels

    stackViewPort.setViewPresentation({ pan: newPan });
    stackViewPort.render();
  }
};

export const resetPan = (stackViewPort: StackViewport) => {
  if (stackViewPort) {
    stackViewPort.setViewPresentation({
      pan: [0, 0] as [number, number],
    });
    stackViewPort.render();
  }
};

export const flipH = (stackViewPort: StackViewport) => {
  if (stackViewPort) {
    const { flipHorizontal } = stackViewPort.getCamera();
    stackViewPort.setCamera({ flipHorizontal: !flipHorizontal });
    stackViewPort.render();
  }
};

export const flipV = (stackViewPort: StackViewport) => {
  if (stackViewPort) {
    const { flipVertical } = stackViewPort.getCamera();
    stackViewPort.setCamera({ flipVertical: !flipVertical });
    stackViewPort.render();
  }
};

export const resetViewPort = (stackViewPort: StackViewport) => {
  if (stackViewPort) {
    stackViewPort.resetCamera();
    stackViewPort.resetProperties();
    stackViewPort.render();
  }
};

export const undo = () => {
  DefaultHistoryMemo.undo();
};

export const redo = () => {
  DefaultHistoryMemo.redo();
};
