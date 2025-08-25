import HeaderBar from "./components/HeaderBar";
import SideBarRight from "./components/SideBarRight";
import DicomEditor from "./components/DicomEditor";
import useDicomEditorStore from "./store/useDicomEditorStore";

function App() {
  const {
    selectedImageId,
    selectedViewportId,
    renderingEngineId,
    selectedToolGroupId,
    activeSegmentIndex,
    segmentationId,
  } = useDicomEditorStore();

  return (
    <div className="max-w-[1440px] m-auto p-2">
      {/* Header */}
      <div className="w-full h-16 bg-slate-500">
        <HeaderBar selectedViewportId={selectedViewportId} />
      </div>

      {/* Main Layout */}
      <div className="flex flex-wrap h-[680px]">
        <div className="w-[75%]  border-2 border-red-200">
          <DicomEditor
            selectedImageId={selectedImageId}
            renderingEngineId={renderingEngineId}
            selectedToolGroupId={selectedToolGroupId}
            selectedViewportId={selectedViewportId}
            activeSegmentIndex={activeSegmentIndex}
            segmentationId={segmentationId}
          />
        </div>

        <div className="w-[25%] bg-slate-50">
          <SideBarRight selectedToolGroupId={selectedToolGroupId} />
        </div>
      </div>

      <div className="">{/* <ImageSelector /> */}</div>
    </div>
  );
}

export default App;
