const TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param  {Object} mergeOptions
 * @return {Slate.Editor}
 */

function unmergeCell(opts, editor) {
    const { value } = editor;
    const { startBlock } = value;
    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    const firstCell = table.nodes
        .get(pos.getRowIndex())
        .nodes.get(pos.getColumnIndex());
    const colSpan = firstCell.data.get('colspan') || 1;
    const rowSpan = firstCell.data.get('rowspan') || 1;

    editor.withoutNormalizing(() => {
        for (let rowCount = 0; rowCount < rowSpan; rowCount += 1) {
            for (let columnCount = 0; columnCount < colSpan; columnCount += 1) {

                const cell = table.nodes
                    .get(pos.getRowIndex() + rowCount)
                    .nodes.get(pos.getColumnIndex() + columnCount);

                const data = cell.data.toJSON();
                delete data.isMerged;
                delete data.colspan;
                delete data.rowspan;
                delete data.mergeDirection;
                delete data.mergeCentre;
                editor.setNodeByKey(cell.key, {
                    data
                });
            }
        }
        editor.focus();
    });

    return editor;
}

module.exports = unmergeCell;
