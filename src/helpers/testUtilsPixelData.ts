import { colors } from "./testUtils";

function getVerticalBarRGBImage(
  imageVoxelManager,
  rows,
  columns,
  barStart,
  barWidth
) {
  let start = barStart;

  colors.forEach((color) => {
    for (let i = 0; i < rows; i++) {
      for (let j = start; j < start + barWidth; j++) {
        // Since our screenshots are taken with the old method, i'm just swapping the i and j
        // to match the new method of setting the pixel data and we don't have to change the
        // screenshot, this is fine
        imageVoxelManager.setAtIJK(j, i, 0, color);
      }
    }

    start += barWidth;
  });
}

function getVerticalBarVolume(volumeVoxelManager, rows, columns, slices) {
  //   const yMultiple = rows;
  //   const zMultiple = rows * columns;

  let barStart = 0;
  const barWidth = Math.floor(rows / slices);

  for (let z = 0; z < slices; z++) {
    for (let i = 0; i < rows; i++) {
      for (let j = barStart; j < barStart + barWidth; j++) {
        // Since our screenshots are taken with the old method, i'm just swapping the i and j
        // to match the new method of setting the pixel data and we don't have to change the
        // screenshot, this is fine
        volumeVoxelManager.setAtIJK(j, i, z, 255);
      }
    }
    barStart += barWidth;
  }
}

export { getVerticalBarRGBImage, getVerticalBarVolume };
