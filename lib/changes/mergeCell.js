/* eslint-disable */
const createRow = require("../createRow");
const Slate = require("slate");
const TablePosition = require("../TablePosition");

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param  {Object} mergeOptions
 * @return {Slate.Editor}
 */

const spanTypes = {
  colSpan: "colspan",
  rowSpan: "rowspan",
};

const directions = {
  down: "down",
  right: "right",
};

const getNodeContentsAsBlocks = (node) =>
  [].concat(
    ...node.nodes.map((innerNode) => {
      return Slate.Block.fromJSON(innerNode.toJSON());
    })
  );

  const createMergeDirection = (currentMergeDirection, additionalMerge) => {
    const updatedMerge = {[additionalMerge]: true};
    if (currentMergeDirection === 'right' || (currentMergeDirection && currentMergeDirection.right)) {
      updatedMerge.right = true;
    }
    if (currentMergeDirection === 'down' || ( currentMergeDirection && currentMergeDirection.down)) {
      updatedMerge.down = true;
    }
    return updatedMerge;
  }

function mergeCell(opts, editor, mergeOptions) {
  const { value } = editor;
  const { startBlock } = value;
  const pos = TablePosition.create(value, startBlock, opts);
  const { table } = pos;
  const isHeadless = table.data.get("headless");
  const { direction } = mergeOptions;

  if (
    isHeadless ||
    (!isHeadless && pos.getRowIndex() > 0) ||
    direction === directions.right
  ) {
    const firstCell = table.nodes
      .get(pos.getRowIndex())
      .nodes.get(pos.getColumnIndex());
    let rowSpan = firstCell.data.get("rowspan") || 1;
    let colSpan = firstCell.data.get("colspan") || 1;

    const firstCellRowIndex = pos.getRowIndex();
    const firstCellColumnIndex = pos.getColumnIndex();

    let nextCells = [];

    if (direction === directions.down) {
      const firstCell = table.nodes
        .get(firstCellRowIndex + rowSpan)
        .nodes.get(pos.getColumnIndex());
      const firstCellRowSpan = firstCell.data.get("rowspan") || 1;
      const firstCellColSpan = firstCell.data.get("colspan") || 1;

      rowSpan += firstCellRowSpan;

      if (firstCellColSpan > 1) {
        for (let rowCount = 0; rowCount < rowSpan; rowCount += 1) {
          for (
            let columnCount = 0;
            columnCount < firstCellColSpan;
            columnCount += 1
          ) {
            if (!(rowCount === 0 && columnCount === 0)) {
              const nextCell = table.nodes
              .get(firstCellRowIndex + rowCount)
              .nodes.get(firstCellColumnIndex + columnCount);
            if (nextCell)
              nextCells.push(nextCell);
            }
          }
        }
      } else {
        nextCells.push(firstCell);
      }
    } else {
      const firstCell = table.nodes
        .get(firstCellRowIndex)
        .nodes.get(pos.getColumnIndex() + colSpan);
      const firstCellRowSpan = firstCell.data.get("rowspan") || 1;
      const firstCellColSpan = firstCell.data.get("colspan") || 1;

      colSpan += firstCellColSpan;

      if (firstCellRowSpan > 1) {
        for (let rowCount = 0; rowCount < firstCellRowSpan; rowCount += 1) {
          for (let columnCount = 0; columnCount < colSpan; columnCount += 1) {
            if (!(rowCount === 0 && columnCount === 0)) {
              const nextCell = table.nodes
                .get(firstCellRowIndex + rowCount)
                .nodes.get(firstCellColumnIndex + columnCount);

              if (nextCell && !(nextCell.data.get("isMerged") && nextCell.data.get("mergeDirection").down))
                nextCells.push(nextCell);
            }
          }
        }
      } else {
        nextCells.push(firstCell);
      }
    }

    if (
      nextCells.length > 0 &&
      nextCells.every((cell) => cell.type === opts.typeCell)
    ) {
      const contents = nextCells.map((nextCell) =>
        getNodeContentsAsBlocks(nextCell)
      );

      const cellContents = [].concat(...contents);
      for (let i = 0; i < cellContents.length; i++) {
        editor.insertNodeByKey(
          firstCell.key,
          firstCell.nodes.size + i,
          cellContents[i]
        );
      }

      editor.withoutNormalizing(() =>
        nextCells.forEach((cell) =>
          cell.nodes.forEach((node) => {
            editor.removeNodeByKey(node.key);
          })
        )
      );

      let firstCellData = firstCell.data.toJSON();
      firstCellData["rowspan"] = rowSpan;
      firstCellData["colspan"] = colSpan;
      firstCellData["mergeDirection"] = createMergeDirection(firstCellData.mergeDirection, direction);

      editor.setNodeByKey(firstCell.key, { data: firstCellData });

      editor.withoutNormalizing(() => {
        nextCells.forEach((nextCell) => {
          let nextCellData = nextCell.data.toJSON();
          delete nextCellData.colspan;
          delete nextCellData.rowspan;
          nextCellData["isMerged"] = true;
          nextCellData["mergeDirection"] = createMergeDirection(nextCellData.mergeDirection, direction);
          editor.setNodeByKey(nextCell.key, { data: nextCellData });
        })
        editor.focus();
      });
    }
  }

  return editor;
}

module.exports = mergeCell;
