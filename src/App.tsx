import DicomEditor from "./components/DicomEditor";
import HeaderBar from "./components/HeaderBar";
import SideBarRight from "./components/SideBarRight";

function App() {
  return (
    <div className="max-w-[1440px] m-auto p-2">
      {/* Header */}
      <div className="w-full h-16 bg-slate-500">
        <HeaderBar />
      </div>

      {/* Main Layout */}
      <div className="flex flex-wrap h-[680px]">
        <div className="w-[75%]  border-2 border-red-200">
          <DicomEditor />
        </div>

        <div className="w-[25%] bg-slate-50">
          <SideBarRight />
        </div>
      </div>

      <div className="">{/* <ImageSelector /> */}</div>
    </div>
  );
}

export default App;
