
module.exports.getMergeCentre = function({mergeDirection, table, columnIndex, rowIndex}) {
    const centre = { x: 0, y: 0 };
    if (mergeDirection) {
        if (mergeDirection === 'right' || mergeDirection.right) {
            const nextRow = table.nodes.get(rowIndex);
            for (let i = columnIndex; i >= 0; i -= 1) {
                if (nextRow.nodes.get(i) && nextRow.nodes.get(i).data.get('colspan') > 1) {
                    centre.x = columnIndex;
                }
            }
        }
        if (mergeDirection === 'down' || mergeDirection.down) {
            const column = table.nodes.map((row) => row.nodes.get(columnIndex));
            for (let i = columnIndex; i >= 0; i -= 1) {
                if (column.get(i) && column.get(i).data.get('rowspan') > 1) {
                    centre.y = columnIndex;
                }
            }

        } }
    return centre;
};


module.exports.getMergeCentreByPath = function({ table, path, cellPosition }) {
    if (path && Object.keys(path).length === 2) {
        const row = table.nodes
            .get(cellPosition.y - path.y);
        if (row) return { mergeCentreNode: row.nodes.get(cellPosition.x - path.x), mergeCentreNodePath: { x: cellPosition.x - path.x, y: cellPosition.y - path.y } };
    }
    return { mergeCentreNode: null, mergeCentreNodePath: null };
};

