import type { Types } from "@cornerstonejs/core";
import { create } from "zustand";

type State = {
  singleViewPortStack: Types.IStackViewport | null;
  toolGroupId: string;
  imagesIds: string[],

  selectedImageUrl: string,
  selectedImageId: string,
  selectedViewportId: string,
  renderingEngineId: string,
  selectedToolGroupId: string,
  segmentationId: string,
  activeSegmentIndex: number
};

type Action = {
  setSingleViewPortStack: (singleViewPortStack: Types.IStackViewport) => void;
};

const useDicomEditorStore = create<State & Action>((set) => ({
  singleViewPortStack: null,
  imagesIds: [
    "wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000",
    "wadouri:https://ohif-assets-new.s3.us-east-1.amazonaws.com/ACRIN-Regular/CT+CT+IMAGES/CT000009.dcm"
  ],
  toolGroupId: "toolGroupId:::wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000",

  selectedImageUrl: "https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000",
  selectedImageId: "wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000",
  selectedViewportId: "selectedViewportStackId",
  renderingEngineId: "renderingEngineId",
  selectedToolGroupId: "selectedToolGroupId",
  segmentationId: "mySegmentation",
  activeSegmentIndex: 1,
  
  
  setSingleViewPortStack: (singleViewPortStack: Types.IStackViewport) =>
    set(() => ({
      singleViewPortStack,
    })),
}));


export default useDicomEditorStore;