//region Helper functions
function buildCellId(row, col) {
    return 'cell: ' + row + ", " + col
}

function buildLine(line) {
    return 'line: ' + line.map(cell => cell.row + ',' + cell.col).join("; ")
}

//endregion

//TODO draw

//region Context population - basic game
const ROWS = 6
const COLS = 7

const cells = []
const columns = []

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

let fours = []

for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j <= COLS - 4; j++) {
        let right = []
        for (let k = 0; k < 4; k++) {
            right.push({row: i, col: j + k})
        }
        fours.push(ctx.Entity("four right (" + i + "," + j + ")", "four", {
            cells: right
        }))
    }
}

for (let i = 0; i < ROWS - 4; i++) {
    for (let j = 0; j <= COLS; j++) {
        let up = []
        for (let k = 0; k < 4; k++) {
            up.push({row: i + k, col: j})
        }
        fours.push(ctx.Entity("four up (" + i + "," + j + ")", "four", {
            cells: up
        }))
    }
}

//TODO add diagonals

//endregion

//region Context population - strategies
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

// TODO is it possible to split to two?
ctx.populateContext(cells.concat(columns).concat(fives).concat(fours))
//endregion

//region Queries - basic game
ctx.registerQuery("Cell.All", function (entity) {
    return entity.type.equals("cell")
})

ctx.registerQuery("Column.All", function (entity) {
    return entity.type.equals("column")
})

ctx.registerQuery("Four.All", function (entity) {
    return entity.type.equals("four")
})

ctx.registerQuery("Game over", function (entity) {
    return entity.id.equals("Game over")
})

//endregion

//region Queries - strategies
ctx.registerQuery("Five.Ready", function (entity) {
    return entity.type.equals("five") && entity.status.equals("READY")
})
//endregion

//region Effects - basic game
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

ctx.registerEffect("Win", function (data) {
    ctx.insertEntity(ctx.Entity("Game over"))
})
//endregion

//region Effects - strategies
ctx.registerEffect("Five is ready", function (data) {
    const five = ctx.getEntityById(data)
    five.status = "READY"
    ctx.updateEntity(five)
})
//endregion
