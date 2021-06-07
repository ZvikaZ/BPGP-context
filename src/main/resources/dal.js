//region Helper functions
function buildCellId(row, col) {
  return 'cell: ' + row + ", " + col
}

function buildLine(line) {
  return 'line: ' + line.map(cell => cell.row + ',' + cell.col).join("; ")
}

//TODO move to official: ctx.has
function ctx_has(id) {
  try {
    let entity = ctx.getEntityById(id)
    return true
  } catch (e) {
    return false
  }
}

//endregion

//region Context population
const ROWS = 6
const COLS = 7
const cells = []
const columns = []
const fives = []
for (let i = 0; i < ROWS - 5; i++) { // ACHIYA: These are not all fives...
  for (let j = 0; j < COLS - 5; j++) {
    let right = []
    for (let k = 0; k < 5; k++) {
      right.push({row: i, col: j + k, edge: k == 0 || k == 4 ? true : false})
    }
    fives.push(ctx.Entity("five right (" + i + "," + j + ")", "five", {
      cells: right,
      status: i == 0 ? "READY" : "NOT-READY"
    }))
  }
}

for (let j = 0; j < COLS; j++) {
  columns.push(ctx.Entity("column: " + j, 'column', {col: j}))
  for (let i = 0; i < ROWS; i++) {
    cells.push(ctx.Entity(buildCellId(i, j), 'cell', {
      row: i,
      col: j,
      color: "",
      status: i == 0 ? "READY" : "NOT-READY"
    }))
  }
}

ctx.populateContext(cells.concat(columns).concat(fives))
//endregion

//region Queries
ctx.registerQuery("Column.All", function (entity) {
  return entity.type.equals("column")
})
ctx.registerQuery("Five.Ready", function (entity) {
  return entity.type.equals("five") && entity.status.equals("READY")
})
ctx.registerQuery("Cell.All", function (entity) {
  return entity.type.equals("cell")
})
//endregion

//region Effects
ctx.registerEffect("Coin", function (data) {
  let cell = ctx.getEntityById(buildCellId(data.row, data.col))
  cell.color = data.color
  ctx.updateEntity(cell)

  if (data.row < ROWS - 1) {
    let cellAbove = ctx.getEntityById(buildCellId(data.row + 1, data.col))
    cellAbove.status = "READY"
    ctx.updateEntity(cell)
  }

// let fiveRight = ctx.getEntityById("")
})

ctx.registerEffect("Five is ready", function (data) {
  const five = ctx.getEntityById(data)
  five.status = "READY"
  ctx.updateEntity(five)
})
//endregion

//region Old code
/*//TODO
// let line = [{row: 5, col: 1, edge: true}, {row: 5, col: 2}, {row: 5, col: 3, edge: true}]
let allFives = [
  [{row: 5, col: 0, edge: true}, {row: 5, col: 1}, {row: 5, col: 2, edge: true}],
  [{row: 5, col: 1, edge: true}, {row: 5, col: 2}, {row: 5, col: 3, edge: true}],
  [{row: 5, col: 2, edge: true}, {row: 5, col: 3}, {row: 5, col: 4, edge: true}],
  [{row: 5, col: 3, edge: true}, {row: 5, col: 4}, {row: 5, col: 5, edge: true}]

]*/


/*
let allFives = []
for(var i = 0; i < 2; i++ ) {
    for(var j = 0; j < 3; j++) {
        allFives.push( [ { row : i, col : j, edge: true } , { row : i, col : j+1 } , { row : i, col : j+2 } , { row : i, col : j+3 } , { row : i, col : j+4 , edge: true} ] );
        allFives.push( [ { row : i, col : j, edge: true } , { row : i + 1, col : j } , { row : i + 2, col : j } , { row : i + 3, col : j }, { row : i + 4, col : j , edge: true} ] );
    }
}


for(var i = 2; i < 6; i++ ) {
    for(var j = 0; j < 3; j++) {
        allFives.push( [ { row : i, col : j, edge: true } , { row : i, col : j+1 } , { row : i, col : j+2 } , { row : i, col : j+3 },  { row : i, col : j+4 , edge: true} ] );
    }
}


for(var i = 0; i < 2; i++ ) {
    for(var j = 3; j < 7; j++) {
        allFives.push( [ { row : i, col : j, edge: true } , { row : i + 1, col : j } , { row : i + 2, col : j } , { row : i + 3, col : j }, { row : i + 4, col : j , edge: true} ] );
    }
}

for(var i = 0; i < 5; i++ ) {
    for(var j = 0; j < 3; j++) {
        if( i <= 1 && j <= 2 ) {
            allFives.push( [ { row : i, col : j , edge: true} , { row : i + 1, col : j+1 } , { row : i + 2, col : j+2 } , { row : i + 3, col : j+3 }, { row : i + 4, col : j+4, edge: true} ] );
        }
        else {
            allFives.push( [ { row : i, col : j, edge: true } , { row : i - 1, col : j+1 } , { row : i - 2, col : j+2 } , { row : i - 3, col : j+3 }, { row : i - 4, col : j+4, edge: true } ] );
        }
    }
}
 */


/*
ctx.registerEffect('BoardUpdated', function (data) {
  let ev_data = data.ev.data
  let cell = ctx.getEntityById(buildCellId(ev_data.row, ev_data.col))
  cell.color = ev_data.color
  ctx.updateEntity(cell)
  /!*!// update cells
  ctx.removeEntity()
  // bp.log.info("ZZ: remove cell: " + buildCell(ev_data.row, ev_data.col))
  ctx.insertEntity(buildCell(ev_data.row, ev_data.col), ev_data.color)*!/
  // bp.log.info("ZZ: insert cell: " + buildCell(ev_data.row, ev_data.col) + ", " + ev_data.color)
  if (ev_data.row > 0) {
    ctx.insertEntity(buildCell(ev_data.row - 1, ev_data.col), 'READY')
    // bp.log.info("ZZ: insert cell: " + buildCell(ev_data.row - 1, ev_data.col) + ", " + 'READY')
  }

  // update lines
  for (var i = 0; i < allFives.length; i++) {
    (function (line) {
      let all_ready = true
      try {
        for (var i = 0; i < line.length && all_ready; i++) {
          let cell = line[i]
          let entity = ctx.getEntityById(buildCell(cell.row, cell.col))
          if (entity.type != "READY" && entity.type != "Yellow") {
            all_ready = false
            // bp.log.info("ZZ: not ready: " + buildLine(line))
            // bp.log.info(cell)
          }
        }
      } catch (e) {
        all_ready = false
      }
      if (all_ready) {
        if (!ctx_has(buildLine(line))) {
          // ctx.insertEntity(buildLine(line), "ALL_READY", {center: new Set(line.filter((cell) => !cell.edge))}) //TODO fails with 'IO exception serializing a b-thread'
          ctx.insertEntity(buildLine(line), "ALL_READY", {})
          bp.log.info("ZZ inserted: ")
          bp.log.info(ctx.getEntityById(buildLine(line)))
        }
      } else {
        if (ctx_has(buildLine(line))) {
          ctx.removeEntity(buildLine(line))
          bp.log.info("ZZ removed: ")
          bp.log.info(buildLine(line))
        }
      }
    })(allFives[i])
  }
})

for (var i = 0; i < allFives.length; i++) {
  (function (line) {
    bp.log.info("registering:")
    bp.log.info(buildLine(line))
    ctx.registerQuery('Five.AllReady.' + buildLine(line),
      // entity => entity.id === buildLine(line))
      function (entity) {
        // bp.log.info("ZZ querying:")
        // bp.log.info(entity)
        // return entity.id.includes("line")
        // //TODO why isn't it working??
        // // bp.log.info("ZZ query result: " + result)
        return true
        // return !entity.id.includes("cell")
      })
  })(allFives[i])
}
*/
//endregion
