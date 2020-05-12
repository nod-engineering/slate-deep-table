
function getMergeCentre({mergeDirection, table, columnIndex, rowIndex}) {
    let key = null;
    if (mergeDirection === 'right') {
        const nextRow = table.nodes.get(rowIndex);
        for (let i = columnIndex; i >= 0; i -= 1) {
            if (nextRow.nodes.get(i) && nextRow.nodes.get(i).data.get('colspan') > 1) {
                key = nextRow.nodes.get(i).key;
            }
        }
    }
    if (mergeDirection === 'down') {
        const column = table.nodes.map((row) => row.nodes.get(columnIndex));
        for (let i = columnIndex; i >= 0; i -= 1) {
            if (column.get(i) && column.get(i).data.get('rowspan') > 1) {
                key = column.get(i).key;
            }
        }
    }
    return key;
}

module.exports = getMergeCentre;
