
function getMergeCentre({mergeDirection, table, columnIndex, rowIndex}) {
    let centre = null;
    if (mergeDirection) {
        if (mergeDirection === 'right' || mergeDirection.right) {
            const nextRow = table.nodes.get(rowIndex);
            for (let i = columnIndex; i >= 0; i -= 1) {
                if (nextRow.nodes.get(i) && nextRow.nodes.get(i).data.get('colspan') > 1) {
                    centre = nextRow.nodes.get(i);
                }
            }
        }
        if (mergeDirection === 'down' || mergeDirection.down) {
            const column = table.nodes.map((row) => row.nodes.get(columnIndex));
            for (let i = columnIndex; i >= 0; i -= 1) {
                if (column.get(i) && column.get(i).data.get('rowspan') > 1) {
                    centre = column.get(i);
                }
            }

        } }
    return centre;
}

module.exports = getMergeCentre;
