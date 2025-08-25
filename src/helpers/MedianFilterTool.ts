import { EVENTS, getEnabledElement, triggerEvent } from "@cornerstonejs/core";
import { BaseTool } from "@cornerstonejs/tools";
import type {
  EventTypes,
  PublicToolProps,
  ToolProps,
} from "@cornerstonejs/tools/types";
/**
 * Tool that applies a median filter on the current image pixels.
 */
class MedianFilterTool extends BaseTool {
  static toolName;

  constructor(
    toolProps: PublicToolProps = {},
    defaultToolProps: ToolProps = {
      supportedInteractionTypes: ["Mouse", "Touch"],
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  // trigger filter when user clicks (you can change to drag or double click)
  mouseClickCallback(evt: EventTypes.InteractionEventType) {
    console.log(evt);
    this._applyMedianFilter(evt);
  }

  touchTapCallback(evt: EventTypes.InteractionEventType) {
    this._applyMedianFilter(evt);
  }

  _applyMedianFilter(evt: EventTypes.InteractionEventType) {
   
    const { element } = evt.detail;
    const enabledElement = getEnabledElement(element);
    const viewport = enabledElement.viewport;

    const imageData = viewport.getImageData();
    if (!imageData) {
      console.warn("No image data found for median filter");
      return;
    }

    const dims = imageData.imageData.getDimensions(); // [x,y,z]
    const width = dims[0];
    const height = dims[1];

    const scalars = imageData.scalarData;
    const values = scalars;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = new (values.constructor as any)(values.length);

    const getPixel = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return 0;
      return values[y * width + x];
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const neighborhood: number[] = [];
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            neighborhood.push(getPixel(x + i, y + j));
          }
        }
        neighborhood.sort((a, b) => a - b);
        filtered[y * width + x] = neighborhood[4]; // median
      }
    }

    values.set(filtered);

    // Notify cornerstone that the volume was modified
    triggerEvent(viewport.element, EVENTS.IMAGE_VOLUME_MODIFIED, {});

    viewport.render();
  }
}

MedianFilterTool.toolName = "MedianFilter";
export default MedianFilterTool;
