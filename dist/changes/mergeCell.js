'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Slate = require('slate');
var TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param  {Object} mergeOptions
 * @return {Slate.Editor}
 */

var directions = {
    down: 'down',
    right: 'right'
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

    var isHeadless = table.data.get('headless');
    var direction = mergeOptions.direction;


    if (isHeadless || !isHeadless && pos.getRowIndex() >= 0) {
        var currentCellRowIndex = pos.getRowIndex();
        var currentCellColumnIndex = pos.getColumnIndex();

        var currentCell = table.nodes.get(currentCellRowIndex).nodes.get(currentCellColumnIndex);
        var rowSpan = currentCell.data.get('rowspan') || 1;
        var colSpan = currentCell.data.get('colspan') || 1;

        var nextCells = [];

        if (direction === directions.down) {
            var firstCell = table.nodes.get(currentCellRowIndex + rowSpan).nodes.get(currentCellColumnIndex);
            var firstCellRowSpan = firstCell.data.get('rowspan') || 1;
            var firstCellColSpan = firstCell.data.get('colspan') || 1;

            rowSpan += firstCellRowSpan;

            if (firstCellColSpan > 1) {
                for (var rowCount = 0; rowCount < rowSpan; rowCount += 1) {
                    for (var columnCount = 0; columnCount < firstCellColSpan; columnCount += 1) {
                        if (!(rowCount === 0 && columnCount === 0)) {
                            var nextCell = table.nodes.get(currentCellRowIndex + rowCount).nodes.get(currentCellColumnIndex + columnCount);
                            if (nextCell) nextCells.push({ cell: nextCell, path: { x: columnCount, y: rowCount } });
                        }
                    }
                }
            } else {
                nextCells.push({ cell: firstCell, path: { x: 0, y: rowSpan - 1 } });
            }
        } else {
            var _firstCell = table.nodes.get(currentCellRowIndex).nodes.get(currentCellColumnIndex + colSpan);
            var _firstCellRowSpan = _firstCell.data.get('rowspan') || 1;
            var _firstCellColSpan = _firstCell.data.get('colspan') || 1;

            colSpan += _firstCellColSpan;

            if (_firstCellRowSpan > 1) {
                for (var _rowCount = 0; _rowCount < _firstCellRowSpan; _rowCount += 1) {
                    for (var _columnCount = 0; _columnCount < colSpan; _columnCount += 1) {
                        if (!(_rowCount === 0 && _columnCount === 0)) {
                            var _nextCell = table.nodes.get(currentCellRowIndex + _rowCount).nodes.get(currentCellColumnIndex + _columnCount);

                            if (_nextCell) nextCells.push({ cell: _nextCell, path: { x: _columnCount, y: _rowCount } });
                        }
                    }
                }
            } else {
                nextCells.push({ cell: _firstCell, path: { x: colSpan - 1, y: 0 } });
            }
        }

        if (nextCells.length > 0 && nextCells.every(function (_ref2) {
            var cell = _ref2.cell;
            return cell.type === opts.typeCell;
        })) {
            var _ref5;

            var contents = nextCells.filter(function (_ref3) {
                var cell = _ref3.cell;
                return cell.text !== '';
            }).map(function (_ref4) {
                var cell = _ref4.cell;
                return getNodeContentsAsBlocks(cell);
            });

            var cellContents = (_ref5 = []).concat.apply(_ref5, _toConsumableArray(contents));
            editor.withoutNormalizing(function () {
                for (var i = 0; i < cellContents.length; i++) {
                    editor.insertNodeByKey(currentCell.key, currentCell.nodes.size + i, cellContents[i]);
                }
            });

            editor.withoutNormalizing(function () {
                return nextCells.forEach(function (_ref6) {
                    var cell = _ref6.cell;
                    return cell.nodes.forEach(function (node) {
                        return editor.removeNodeByKey(node.key);
                    });
                });
            });

            var firstCellData = currentCell.data.toJSON();
            firstCellData['rowspan'] = rowSpan;
            firstCellData['colspan'] = colSpan;
            firstCellData['mergeDirection'] = createMergeDirection(firstCellData.mergeDirection, direction);

            editor.setNodeByKey(currentCell.key, { data: firstCellData });

            editor.withoutNormalizing(function () {
                nextCells.forEach(function (_ref7) {
                    var cell = _ref7.cell,
                        path = _ref7.path;

                    var nextCellData = cell.data.toJSON();
                    delete nextCellData.colspan;
                    delete nextCellData.rowspan;
                    nextCellData['mergeCentre'] = path;
                    nextCellData['isMerged'] = true;
                    nextCellData['mergeDirection'] = createMergeDirection(nextCellData.mergeDirection, direction);
                    editor.setNodeByKey(cell.key, { data: nextCellData });
                });
                editor.focus();
            });
        }
    }

    return editor;
}

module.exports = mergeCell;