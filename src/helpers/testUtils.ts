const colors = [
  [255, 0, 0],
  [0, 255, 0],
  [128, 0, 0],
  [0, 0, 255],
  [0, 128, 0],
  [255, 255, 0],
  [0, 255, 255],
  [0, 0, 0],
  [0, 0, 128],
  [255, 0, 255],
];

Object.freeze(colors);

function decodeImageIdInfo(imageId) {
  const [scheme, encodedInfo] = imageId.split(":");
  if (scheme !== "fakeImageLoader") {
    return null;
  }
  return JSON.parse(decodeURIComponent(encodedInfo));
}

export { decodeImageIdInfo, colors };
