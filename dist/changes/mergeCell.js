"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/* eslint-disable */
var createRow = require("../createRow");
var Slate = require("slate");
var TablePosition = require("../TablePosition");

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param  {Object} mergeOptions
 * @return {Slate.Editor}
 */

var spanTypes = {
  colSpan: "colspan",
  rowSpan: "rowspan"
};

var directions = {
  down: "down",
  right: "right"
};

var getNodeContentsAsBlocks = function getNodeContentsAsBlocks(node) {
  var _ref;

  return (_ref = []).concat.apply(_ref, _toConsumableArray(node.nodes.map(function (innerNode) {
    return Slate.Block.fromJSON(innerNode.toJSON());
  })));
};

var createMergeDirection = function createMergeDirection(currentMergeDirection, additionalMerge) {
  var updatedMerge = _defineProperty({}, additionalMerge, true);
  if (currentMergeDirection === 'right' || currentMergeDirection && currentMergeDirection.right) {
    updatedMerge.right = true;
  }
  if (currentMergeDirection === 'down' || currentMergeDirection && currentMergeDirection.down) {
    updatedMerge.down = true;
  }
  return updatedMerge;
};

function mergeCell(opts, editor, mergeOptions) {
  var value = editor.value;
  var startBlock = value.startBlock;

  var pos = TablePosition.create(value, startBlock, opts);
  var table = pos.table;

  var isHeadless = table.data.get("headless");
  var direction = mergeOptions.direction;


  if (isHeadless || !isHeadless && pos.getRowIndex() >= 0) {
    var firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
    var rowSpan = firstCell.data.get("rowspan") || 1;
    var colSpan = firstCell.data.get("colspan") || 1;

    var firstCellRowIndex = pos.getRowIndex();
    var firstCellColumnIndex = pos.getColumnIndex();

    var nextCells = [];

    if (direction === directions.down) {
      var _firstCell = table.nodes.get(firstCellRowIndex + rowSpan).nodes.get(pos.getColumnIndex());
      var firstCellRowSpan = _firstCell.data.get("rowspan") || 1;
      var firstCellColSpan = _firstCell.data.get("colspan") || 1;

      rowSpan += firstCellRowSpan;

      if (firstCellColSpan > 1) {
        for (var rowCount = 0; rowCount < rowSpan; rowCount += 1) {
          for (var columnCount = 0; columnCount < firstCellColSpan; columnCount += 1) {
            if (!(rowCount === 0 && columnCount === 0)) {
              var nextCell = table.nodes.get(firstCellRowIndex + rowCount).nodes.get(firstCellColumnIndex + columnCount);
              if (nextCell) nextCells.push(nextCell);
            }
          }
        }
      } else {
        nextCells.push(_firstCell);
      }
    } else {
      var _firstCell2 = table.nodes.get(firstCellRowIndex).nodes.get(pos.getColumnIndex() + colSpan);
      var _firstCellRowSpan = _firstCell2.data.get("rowspan") || 1;
      var _firstCellColSpan = _firstCell2.data.get("colspan") || 1;

      colSpan += _firstCellColSpan;

      if (_firstCellRowSpan > 1) {
        for (var _rowCount = 0; _rowCount < _firstCellRowSpan; _rowCount += 1) {
          for (var _columnCount = 0; _columnCount < colSpan; _columnCount += 1) {
            if (!(_rowCount === 0 && _columnCount === 0)) {
              var _nextCell = table.nodes.get(firstCellRowIndex + _rowCount).nodes.get(firstCellColumnIndex + _columnCount);

              if (_nextCell && !(_nextCell.data.get("isMerged") && _nextCell.data.get("mergeDirection").down)) nextCells.push(_nextCell);
            }
          }
        }
      } else {
        nextCells.push(_firstCell2);
      }
    }

    if (nextCells.length > 0 && nextCells.every(function (cell) {
      return cell.type === opts.typeCell;
    })) {
      var _ref2;

      var contents = nextCells.map(function (nextCell) {
        return getNodeContentsAsBlocks(nextCell);
      });

      var cellContents = (_ref2 = []).concat.apply(_ref2, _toConsumableArray(contents));
      for (var i = 0; i < cellContents.length; i++) {
        if (cellContents[i].text !== '') editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, cellContents[i]);
      }

      editor.withoutNormalizing(function () {
        return nextCells.forEach(function (cell) {
          return cell.nodes.forEach(function (node) {
            editor.removeNodeByKey(node.key);
          });
        });
      });

      var firstCellData = firstCell.data.toJSON();
      firstCellData["rowspan"] = rowSpan;
      firstCellData["colspan"] = colSpan;
      firstCellData["mergeDirection"] = createMergeDirection(firstCellData.mergeDirection, direction);

      editor.setNodeByKey(firstCell.key, { data: firstCellData });

      editor.withoutNormalizing(function () {
        nextCells.forEach(function (nextCell) {
          var nextCellData = nextCell.data.toJSON();
          delete nextCellData.colspan;
          delete nextCellData.rowspan;
          nextCellData["isMerged"] = true;
          nextCellData["mergeDirection"] = createMergeDirection(nextCellData.mergeDirection, direction);
          editor.setNodeByKey(nextCell.key, { data: nextCellData });
        });
        editor.focus();
      });
    }
  }

  return editor;
}

module.exports = mergeCell;