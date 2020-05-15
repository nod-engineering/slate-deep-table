'use strict';

module.exports.getMergeCentre = function (_ref) {
    var mergeDirection = _ref.mergeDirection,
        table = _ref.table,
        columnIndex = _ref.columnIndex,
        rowIndex = _ref.rowIndex;

    var centre = { x: 0, y: 0 };
    if (mergeDirection) {
        if (mergeDirection === 'right' || mergeDirection.right) {
            var nextRow = table.nodes.get(rowIndex);
            for (var i = columnIndex; i >= 0; i -= 1) {
                if (nextRow.nodes.get(i) && nextRow.nodes.get(i).data.get('colspan') > 1) {
                    centre.x = columnIndex;
                }
            }
        }
        if (mergeDirection === 'down' || mergeDirection.down) {
            var column = table.nodes.map(function (row) {
                return row.nodes.get(columnIndex);
            });
            for (var _i = columnIndex; _i >= 0; _i -= 1) {
                if (column.get(_i) && column.get(_i).data.get('rowspan') > 1) {
                    centre.y = columnIndex;
                }
            }
        }
    }
    return centre;
};

module.exports.getMergeCentreByPath = function (_ref2) {
    var table = _ref2.table,
        path = _ref2.path,
        cellPosition = _ref2.cellPosition;

    if (path && Object.keys(path).length === 2) {
        var row = table.nodes.get(cellPosition.y - path.y);
        if (row) return { mergeCentreNode: row.nodes.get(cellPosition.x - path.x), mergeCentreNodePath: { x: cellPosition.x - path.x, y: cellPosition.y - path.y } };
    }
    return { mergeCentreNode: null, mergeCentreNodePath: null };
};