import { MouseBindings } from "@cornerstonejs/tools/enums";

export const MouseConstant = {
    [MouseBindings.Primary]: "Left",
    [MouseBindings.Auxiliary]: "Middle",
    [MouseBindings.Secondary]: "Right",
}

export const MAPPING_EVENT_MOUSE_DOWN = {
    0: MouseBindings.Primary,
    1: MouseBindings.Auxiliary,
    2: MouseBindings.Secondary
}