
const TablePosition = require('../TablePosition');
const { getMergeCentre, getMergeCentreByPath } = require('../getMergeCentre');

/**
 * Remove current row in a table. Clear it if last remaining row
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @return {Slate.Editor}
 */
function removeRow(opts, editor, at) {
    const { value } = editor;
    const { startBlock } = value;

    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    if (typeof at === 'undefined') {
        at = pos.getRowIndex();
    }

    const row = table.nodes.get(at);
    // Update table by removing the row
    if (pos.getHeight() > 1) {
        editor.withoutNormalizing(() => {
            row.nodes.forEach((cell, index) => {
                const isMerged = cell.data.get('isMerged');
                const colSpan = cell.data.get('colspan') || 1;
                const rowSpan = cell.data.get('rowspan') || 1;
                const mergeDirection = cell.data.get('mergeDirection');

                if (isMerged) {
                    const mergeCentrePath = cell.data.get('mergeCentre') || getMergeCentre({mergeDirection, table, columnIndex: index, rowIndex: at});
                    const {mergeCentreNode, mergeCentreNodePath} = getMergeCentreByPath({path: mergeCentrePath, table, cellPosition: { x: index, y: at } });

                    if ((mergeDirection.down || mergeDirection === 'down') && mergeCentreNodePath.y !== at) {
                        if (mergeCentreNode && mergeCentreNode.data.get('rowspan') > 1) {
                            const initialMergeCellData = mergeCentreNode.data.toJSON();
                            for (let rowIndex = 0; rowIndex < initialMergeCellData.rowspan || 0; rowIndex += 1) {
                                for (let columnIndex = 0; columnIndex < initialMergeCellData.colspan || 0; columnIndex += 1) {
                                    if (!(rowIndex === 0 && columnIndex === 0) && ((mergeCentreNodePath.y + rowIndex) >= at)) {
                                        const node = table.nodes.get(mergeCentreNodePath.y + rowIndex).nodes.get(mergeCentreNodePath.x + columnIndex);
                                        const cellData = node.data.toJSON();
                                        cellData.mergeCentre = {
                                            x: columnIndex,
                                            y: rowIndex > 0 ? rowIndex - 1 : 0
                                        };
                                        editor.setNodeByKey(node.key, { data: cellData });
                                    }
                                }
                            }
                            initialMergeCellData.rowspan = initialMergeCellData.rowspan - 1;
                            editor.setNodeByKey(mergeCentreNode.key, { data: initialMergeCellData });
                        }

                    }
                }

                if (rowSpan > 1) {
                    for (let rowIndex = 0; rowIndex < rowSpan; rowIndex += 1) {
                        for (let columnIndex = 0; columnIndex < colSpan; columnIndex += 1) {
                            if (!(rowIndex === 0 && columnIndex === 0)) {
                                const nextCell = table.nodes.get(at + rowIndex).nodes.get(index + columnIndex);
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

            });
            editor.removeNodeByKey(row.key).focus();
        });

    // If last remaining row, clear it instead
    } else {
        editor.withoutNormalizing(() => {
            row.nodes.forEach((cell) => {
                // remove all children of cells
                // the schema will create an empty child content block in each cell
                cell.nodes.forEach((node) => {
                    editor.removeNodeByKey(node.key);
                });
            });
            editor.focus();
        });
    }

    return editor;
}

module.exports = removeRow;
