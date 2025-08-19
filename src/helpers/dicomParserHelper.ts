import { OrientationAxis } from "@cornerstonejs/core/enums";
import dicomParser from "dicom-parser";

export interface DicomInfo {
  patientName?: string;
  patientID?: string;
  patientBirthDate?: string;
  patientSex?: string;

  studyInstanceUID?: string;
  studyDate?: string;
  studyDescription?: string;

  seriesInstanceUID?: string;
  seriesNumber?: string;
  seriesDescription?: string;

  sopInstanceUID?: string;
  modality?: string;
  protocolName?: string;

  imagePositionPatient?: number[];
  imageOrientationPatient?: number[];
  orientationAxis?: OrientationAxis;
  pixelSpacing?: number[];
  sliceThickness?: number;

  bitsAllocated?: number;
  samplesPerPixel?: number;
  photometricInterpretation?: string;

  manufacturer?: string;
  modelName?: string;
  [key: string]: unknown; // lưu trữ các tag khác nếu muốn
}

export async function parseDicomFromUrl(url: string): Promise<DicomInfo> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Cannot fetch DICOM: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const byteArray = new Uint8Array(arrayBuffer);
  const dataSet = dicomParser.parseDicom(byteArray);

  const orientationString = dataSet.string("x00200037");
  console.log("orientationString", orientationString);
  let orientationAxis: OrientationAxis | undefined = undefined;
  let rowCosines: number[] = [];
  let colCosines: number[] = [];

  if (orientationString) {
    const orientation = orientationString.split("\\").map(Number);
    rowCosines = orientation.slice(0, 3);
    colCosines = orientation.slice(3, 6);

    // tính slice normal
    const sliceNormal = [
      rowCosines[1] * colCosines[2] - rowCosines[2] * colCosines[1],
      rowCosines[2] * colCosines[0] - rowCosines[0] * colCosines[2],
      rowCosines[0] * colCosines[1] - rowCosines[1] * colCosines[0],
    ];
    const absNormal = sliceNormal.map(Math.abs);
    const maxIndex = absNormal.indexOf(Math.max(...absNormal));

    switch (maxIndex) {
      case 0:
        orientationAxis = OrientationAxis.SAGITTAL;
        break;
      case 1:
        orientationAxis = OrientationAxis.CORONAL;
        break;
      case 2:
        orientationAxis = OrientationAxis.AXIAL;
        break;
      default:
        orientationAxis = OrientationAxis.ACQUISITION;
    }
  } else {
    orientationAxis = OrientationAxis.ACQUISITION;
  }

  // Helper để convert chuỗi DICOM dạng "x\y" sang mảng number
  const parseNumberArray = (str: string | undefined) =>
    str?.split("\\").map(Number) || undefined;

  const info: DicomInfo = {
    patientName: dataSet.string("x00100010"),
    patientID: dataSet.string("x00100020"),
    patientBirthDate: dataSet.string("x00100030"),
    patientSex: dataSet.string("x00100040"),

    studyInstanceUID: dataSet.string("x0020000d"),
    studyDate: dataSet.string("x00080020"),
    studyDescription: dataSet.string("x00081030"),

    seriesInstanceUID: dataSet.string("x0020000e"),
    seriesNumber: dataSet.string("x00200011"),
    seriesDescription: dataSet.string("x0008103e"),

    sopInstanceUID: dataSet.string("x00080018"),
    modality: dataSet.string("x00080060"),
    protocolName: dataSet.string("x00181030"),

    imagePositionPatient: parseNumberArray(dataSet.string("x00200032")),
    imageOrientationPatient: orientationString
      ? rowCosines.concat(colCosines)
      : undefined,
    orientationAxis,
    pixelSpacing: parseNumberArray(dataSet.string("x00280030")),
    sliceThickness: dataSet.floatString("x00180050"),

    bitsAllocated: dataSet.uint16("x00280100"),
    samplesPerPixel: dataSet.uint16("x00280002"),
    photometricInterpretation: dataSet.string("x00280004"),

    manufacturer: dataSet.string("x00080070"),
    modelName: dataSet.string("x00081090"),
  };

  return info;
}
