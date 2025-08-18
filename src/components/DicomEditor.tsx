import {
  init as csRenderInit,
  RenderingEngine,
  volumeLoader,
  type Types,
} from "@cornerstonejs/core";
import { ViewportType } from "@cornerstonejs/core/enums";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import {
  addTool,
  BrushTool,
  init as csToolsInit,
  PanTool,
  segmentation,
  ToolGroupManager,
  WindowLevelTool,
  ZoomTool,
} from "@cornerstonejs/tools";
import {
  MouseBindings,
  SegmentationRepresentations,
} from "@cornerstonejs/tools/enums";
import { useEffect, useRef } from "react";
import initProviders from "../helpers/initProviders";
import initVolumeLoader from "../helpers/initVolumeLoader";
import useDicomEditorStore from "../store/useDicomEditorStore";
import dicomParser from "dicom-parser";

const toolGroupId = "myToolGroup";
const renderingEngineId = "myRenderingEngine";
const segmentationId = "SEGMENTATION_ID_1";
// const imageId =
//   "wadouri:https://ohif-assets-new.s3.us-east-1.amazonaws.com/ACRIN-Regular/CT+CT+IMAGES/CT000009.dcm";

const nhanMtImageId =
  "wadouri:https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000";

const volumeName = "CT_VOLUME_ID"; // Id of the volume less loader prefix
const volumeLoaderScheme = "cornerstoneStreamingImageVolume"; // Loader id which defines which volume loader to use
const volumeId = `${volumeLoaderScheme}:${volumeName}`; // VolumeId with loader id + volume id

const DicomEditor = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const running = useRef(false);
  const viewportRef = useRef<Types.IStackViewport | null>(null);
  const { setSingleViewPortStack } = useDicomEditorStore();

  const initialize = async () => {
    await initProviders();
    await dicomImageLoaderInit({
      maxWebWorkers: navigator.hardwareConcurrency || 1,
    });
    await initVolumeLoader();
    await csRenderInit();
    await csToolsInit();

    const response = await fetch(
      "https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000"
    );
    const arrayBuffer = await response.arrayBuffer();

    // 2. Parse with dicomParser
    const dataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));

    const studyInstanceUID = dataSet.string("x0020000d");
    const seriesInstanceUID = dataSet.string("x0020000e");
    const sopInstanceUID = dataSet.string("x00080018");

    console.log("StudyInstanceUID:", studyInstanceUID);
    console.log("SeriesInstanceUID:", seriesInstanceUID);
    console.log("SOP Instance UID:", sopInstanceUID);
  };

  // const addSegmentationsToState = async () => {
  //   // Create a segmentation of the same resolution as the source data
  //   // volumeLoader.createAndCacheDerivedLabelmapVolume(volumeId, {
  //   //   volumeId: segmentationId,
  //   // });

  //   // Add the segmentations to state
  //   segmentation.addSegmentations([
  //     {
  //       segmentationId,
  //       representation: {
  //         // The type of segmentation
  //         type: SegmentationRepresentations.Labelmap,
  //         // The actual segmentation data, in the case of labelmap this is a
  //         // reference to the source volume of the segmentation.
  //         data: {
  //           imageIds: [nhanMtImageId],
  //         },
  //       },
  //     },
  //   ]);
  // };

  useEffect(() => {
    const setUp = async () => {
      if (running.current) {
        return;
      }

      running.current = true;

      await initialize();

      addTool(WindowLevelTool);
      addTool(PanTool);
      addTool(ZoomTool);
      addTool(BrushTool);

      const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);

      toolGroup.addToolInstance("CircularBrush", BrushTool.toolName, {
        activeStrategy: "FILL_INSIDE_CIRCLE",
        preview: {
          enabled: true,
        },
        useCenterSegmentIndex: true,
      });

      toolGroup.setToolActive(WindowLevelTool.toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Primary, // Left Click
          },
        ],
      });
      toolGroup.setToolActive(PanTool.toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Auxiliary, // Middle Click
          },
        ],
      });
      toolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Secondary, // Right Click
          },
        ],
      });

      const volume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds: [nhanMtImageId],
      });

      if (volume) {
        volume.load();

        volumeLoader.createAndCacheDerivedLabelmapVolume(volumeId, {
          volumeId: segmentationId,
        });
        
        segmentation.addSegmentations([
          {
            segmentationId: segmentationId,
            representation: {
              type: SegmentationRepresentations.Labelmap,
              data: {
                volumeId: segmentationId,
              }
            }
          }
        ])
      }

      // const stackVolumeId = `stackVolume:${nhanMtImageId}`;
      // await volumeLoader.createAndCacheVolume(stackVolumeId, {
      //   imageIds: [nhanMtImageId],
      // });

      // await volumeLoader.createAndCacheDerivedLabelmapVolume(
      //   `${volume.referencedVolumeId}`
      // );

      // await addSegmentationsToState();

      // Instantiate a rendering engine
      const renderingEngine = new RenderingEngine(renderingEngineId);
      // Create a stack viewport
      const viewportId = "CT_STACK";
      const viewportInput = {
        viewportId,
        type: ViewportType.STACK,
        element: elementRef.current,
        defaultOptions: {
          background: [0.2, 0, 0.2] as Types.Point3,
        },
      };

      renderingEngine.enableElement(viewportInput);

      const viewport = renderingEngine.getViewport(
        viewportId
      ) as Types.IStackViewport;

      // Store viewport reference for zoom functions
      viewportRef.current = viewport;
      // TODO: CLARIFY LATER
      // BaseTool.createZoomPanMemo(viewport);

      setSingleViewPortStack(viewport);

      toolGroup.addViewport(viewportId, renderingEngineId);

      const segmentationRepresentation = {
        segmentationId,
        type: SegmentationRepresentations.Labelmap,
      };

      await segmentation.addSegmentationRepresentations(viewportId, [
        segmentationRepresentation,
      ]);

      await viewportRef.current.setStack([nhanMtImageId]);
      viewportRef.current.render();
    };

    setUp();

    return () => {
      setSingleViewPortStack(null);
    };
  }, []);

  return (
    <div
      className="w-full h-full"
      ref={elementRef}
      onContextMenu={(e) => e.preventDefault()}
    ></div>
  );
};

export default DicomEditor;
