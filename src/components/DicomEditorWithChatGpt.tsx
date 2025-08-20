import {
  Enums,
  RenderingEngine,
  volumeLoader,
  type Types,
} from "@cornerstonejs/core";
import { ViewportType } from "@cornerstonejs/core/enums";
import { useEffect, useRef } from "react";
import { initialize } from "../helpers/initCornerstone";
import setCtTransferFunctionForVolumeActor from "../helpers/setCtTransferFunctionForVolumeActor";
import { registerFakeLoader } from "../helpers/fakeImageLoader";

// ---- Fake Loader ----

const createFakeVolume = async (volumeId: string, dicomImageId: string) => {
  registerFakeLoader();

  // Thay vì chỉ có 1 slice, ta giả lập thành 3 slice identical
  const fakeImageIds = [
    dicomImageId,
    `fake:${dicomImageId}-slice1`,
    `fake:${dicomImageId}-slice2`,
  ];

  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds: fakeImageIds,
  });

  await volume.load();
  return volume;
};

const DicomEditorWithChatGpt = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const running = useRef(false);

  useEffect(() => {
    const setUp = async () => {
      if (running.current) return;
      running.current = true;
      await initialize();

      // Đăng ký fake loader
      registerFakeLoader();

      // Fake imageIds (mình gắn 1 slice cho volume)
      // const imageIds = ["fake:myImage0", "fake:myImage1", "fake:myImage2"];

      const nhanMtImageId =
        "wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000";


      // Tạo rendering engine
      const renderingEngineId = "myRenderingEngine";
      const renderingEngine = new RenderingEngine(renderingEngineId);

      // Tạo viewport
      const viewportId = "CT_VOLUME_VIEWPORT";
      const viewportInput = {
        viewportId,
        type: ViewportType.ORTHOGRAPHIC,
        element: elementRef.current,
        defaultOptions: {
          orientation: Enums.OrientationAxis.ACQUISITION,
          background: [0.2, 0, 0.2] as Types.Point3,
        },
      };

      renderingEngine.enableElement(viewportInput);

      const viewport = renderingEngine.getViewport(
        viewportId
      ) as Types.IVolumeViewport;

      // Tạo fake volume
      const volumeName = "CT_VOLUME_ID";
      const volumeLoaderScheme = "cornerstoneStreamingImageVolume";
      const volumeId = `${volumeLoaderScheme}:${volumeName}`;

      const volume = await createFakeVolume(volumeId, nhanMtImageId);

      // Set volume vào viewport
      viewport.setVolumes([
        {
          volumeId: volume.volumeId,
          callback: setCtTransferFunctionForVolumeActor,
        },
      ]);

      viewport.render();
    };

    setUp();
  }, []);

  return (
    <div
      className="w-full h-full"
      ref={elementRef}
      onContextMenu={(e) => e.preventDefault()}
    ></div>
  );
};

export default DicomEditorWithChatGpt;
