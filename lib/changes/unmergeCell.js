const createRow = require('../createRow');
const Slate = require("slate");
const TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param  {Object} mergeOptions
 * @return {Slate.Editor}
 */

const spanTypes = {
    colSpan: 'colspan',
    rowSpan: 'rowspan',
}

const directions = {
    down: 'down',
    right: 'right',
}

const getNodeContentsAsBlocks = node => node.nodes.map((innerNode) => { return Slate.Block.fromJSON(innerNode.toJSON()) });;

function unmergeCell(opts, editor) {
    const { value } = editor;
    const { startBlock } = value;
    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    const firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
    const firstCellDirection = firstCell.data.get('mergeDirection');
    const spanAttribute = firstCellDirection === directions.right ? spanTypes.colSpan : spanTypes.rowSpan;
    const span = firstCell.data.get(spanAttribute) || 1;
    const nextRow = table.nodes.get(pos.getRowIndex() + span - 1); 
    let nextCell = null;

    if(firstCellDirection && span > 1) {

        if(firstCellDirection === directions.down){
            if(nextRow){  
                nextCell = nextRow.nodes.get(pos.getColumnIndex());
            }
        } else {
            nextCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex() + span - 1);
        }

        if(nextCell && nextCell.type === opts.typeCell){

            let firstCellData = firstCell.data.toJSON(); 
            firstCellData[`${spanAttribute}`] =  span - 1;

            let nextCellData = nextCell.data.toJSON();
            nextCellData['isMerged'] = false;

            editor.setNodeByKey(firstCell.key, { data: firstCellData}).setNodeByKey(nextCell.key, { data: nextCellData });
        }  
    } 
    
    return editor;
}

module.exports = unmergeCell;
