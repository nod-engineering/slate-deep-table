'use strict';

function getMergeCentre(_ref) {
    var mergeDirection = _ref.mergeDirection,
        table = _ref.table,
        columnIndex = _ref.columnIndex,
        rowIndex = _ref.rowIndex;

    var centre = null;
    if (mergeDirection) {
        if (mergeDirection === 'right' || mergeDirection.right) {
            var nextRow = table.nodes.get(rowIndex);
            for (var i = columnIndex; i >= 0; i -= 1) {
                if (nextRow.nodes.get(i) && nextRow.nodes.get(i).data.get('colspan') > 1) {
                    centre = nextRow.nodes.get(i);
                }
            }
        }
        if (mergeDirection === 'down' || mergeDirection.down) {
            var column = table.nodes.map(function (row) {
                return row.nodes.get(columnIndex);
            });
            for (var _i = columnIndex; _i >= 0; _i -= 1) {
                if (column.get(_i) && column.get(_i).data.get('rowspan') > 1) {
                    centre = column.get(_i);
                }
            }
        }
    }
    return centre;
}

module.exports = getMergeCentre;