import { Canvas, FabricImage } from "fabric";
import React, { useEffect, useRef } from "react";
import { dicomUrlToDataURL } from "../helpers/dicomToCanvas";

const DicomToFabricDemo: React.FC = () => {
  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricInstanceRef = useRef<Canvas | null>(null);

  const nhanMtImageId =
    "https://nhanmt.s3.ap-northeast-1.amazonaws.com/I0000000";

  useEffect(() => {
    const run = async () => {
      
      const imageUrl = await dicomUrlToDataURL(nhanMtImageId);

      // 4. Khởi tạo fabric.js
      if (fabricCanvasRef.current) {
        const fabricCanvas = new Canvas(fabricCanvasRef.current, {
          backgroundColor: "#111",
          selection: false,
        });
        fabricInstanceRef.current = fabricCanvas;

        // 5. Load ảnh PNG vào fabric.js
        const fabricImg = await FabricImage.fromURL(imageUrl, {
          crossOrigin: "anonymous", // Important for cross-domain image loading
        });

        if (fabricImg) {
          fabricImg.set({
            selectable: true,
            imageUrl,
          });

          fabricInstanceRef.current.centerObject(fabricImg);
          fabricInstanceRef.current.add(fabricImg);
          fabricInstanceRef.current.setActiveObject(fabricImg);
          fabricInstanceRef.current.requestRenderAll();
        }

        // Ví dụ thêm brush tool
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.freeDrawingBrush.width = 5;
        fabricCanvas.freeDrawingBrush.color = "red";
      }
    };

    run();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">DICOM → PNG → Fabric.js Demo</h2>
      <canvas ref={fabricCanvasRef} width={512} height={512} />
    </div>
  );
};

export default DicomToFabricDemo;
