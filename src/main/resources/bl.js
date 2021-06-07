//region EventSets
function AnyPutInCol(j) {
  return bp.EventSet("Any put in column " + j, function (evt) {
    return evt.name.equals("Put") && evt.data.col == j;
  })
}

function AnyCoinInRow(i) {
  return bp.EventSet("Any coin in row " + i, function (evt) {
    return evt.name.equals("Coin") && evt.data.row == i;
  })
}

function AnyCoinInFive(id, fiveCells) {
  return bp.EventSet("Any coin in five " + id, function (e) {
    if(!e.name.equals("Coin")) return false
    for(let i=0; i<fiveCells.length; i++)
      if(fiveCells[i].row==e.data.row && fiveCells[i].col==e.data.col)
        return true
  })
}
//endregion

//region Helper functions
function Coin(row, col, color) {
  return Event("Coin", {color: color, row: row, col: col});
}

//endregion

ctx.bthread("block put in full columns", "Column.All", function (column) {
  for (let i = 0; i < ROWS; i++)
    sync({waitFor: AnyPutInCol(column.col)})
  sync({block: AnyPutInCol(column.col)})
})

ctx.bthread("put to coin", "Column.All", function (column) {
  for (let i = 0; i < ROWS; i++) {
    let color = sync({waitFor: AnyPutInCol(column.col)}).data.color
    sync({request: Coin(i, column.col, color)})
  }
})

ctx.bthread("mark horizontal fives as ready", "Five.All", function (five) {
  let count = 0
  while(true) {
    let col = sync({waitFor: AnyCoinInRow(five.cells[0].row - 1)})
    if(col>=five.cells[0].col || col<=five.cells[5].col)
      count++
    if(count==5) {
      sync({request: Event("Five is ready", five.id)})
      return
    }
  }
})
