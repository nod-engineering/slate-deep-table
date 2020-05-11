const TablePosition = require('../TablePosition');

/**
 * Delete current column in a table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @return {Slate.Editor}
 */
function removeColumn(opts, editor, at) {
    const { value } = editor;
    const { startBlock, document } = value;

    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    if (typeof at === 'undefined') {
        at = pos.getColumnIndex();
    }

    const rows = table.nodes;

    // Remove the cell from every row
    if (pos.getWidth() > 1) {
        editor.withoutNormalizing(() => {
            rows.forEach((row, index) => {
                const cell = row.nodes.get(at);
                const isMerged = cell.data.get('isMerged');
                const mergeDirection = cell.data.get('mergeDirection');
                const mergeCentre = cell.data.get('mergeCentre');
                const colSpan = cell.data.get('colspan') || 1;
                const rowSpan = cell.data.get('rowspan') || 1;

                if (isMerged && mergeDirection.right) {
                    const selectedCell = document.getNode(mergeCentre);

                    if (selectedCell && selectedCell.data.get('colspan') > 1) {
                        const initialMergeCellData = selectedCell.data.toJSON();
                        initialMergeCellData.colspan = initialMergeCellData.colspan - 1;
                        try { editor.setNodeByKey(selectedCell.key, { data: initialMergeCellData });
                        } catch (e) {
                            console.warn(e);
                        }
                    }

                }

                if (colSpan > 1) {
                    for (let rowIndex = 0; rowIndex < rowSpan; rowIndex += 1) {
                        for (let columnIndex = 0; columnIndex < colSpan; columnIndex += 1) {
                            if (!(rowIndex === 0 && columnIndex === 0)) {
                                const nextCell = rows.get(index + rowIndex).nodes.get(at + columnIndex);
                                if (nextCell.data.get('isMerged')) {
                                    const data = nextCell.data.toJSON();
                                    delete data.isMerged;
                                    delete data.colspan;
                                    delete data.rowspan;
                                    delete data.mergeCentre;
                                    delete data.mergeDirection;
                                    editor.setNodeByKey(nextCell.key, { data });
                                }
                            }
                        }
                    }
                }

                editor.removeNodeByKey(cell.key).focus();
            });
        });
    }
    // If last column, clear text in cells instead
    else {
        editor.withoutNormalizing(() => {
            rows.forEach((row) => {
                row.nodes.forEach((cell) => {
                // remove all children of cells
                // the schema will create an empty child content block in each cell
                    cell.nodes.forEach((node) => {
                        editor.removeNodeByKey(node.key);
                    });
                });
            });
            editor.focus();
        });
    }

    // Replace the table
    return editor;
}

module.exports = removeColumn;
