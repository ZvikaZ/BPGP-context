/* global bp, importPackage, Packages, EventSets */ // <-- Turn off warnings

//region EventSets - basic game

// TODO remove after fixing BPjs bug
importPackage(Packages.connectedFour);

const MYCOLOR = "Yellow"

//TODO is it better to turn these to functions? (like AnyPutInCol)
const redColES = bp.EventSet("Red Col moves", function(evt){
    return evt.name.equals("Put") && evt.data.color.equals("Red");
});

const yellowColES = bp.EventSet("Yellow Col moves", function(evt){
    return evt.name.equals("Put") && evt.data.color.equals("Yellow");
});

const AnyCoin = bp.EventSet("Any Coin", function (evt) {
    return evt.name.equals("Coin")
})

function AnyPutInCol(j) {
    return bp.EventSet("Any put in column " + j, function (evt) {
        // bp.log.info("ZZ AnyPutInCol. j=" + j + ". evt.name=" + evt.name + ". evt.data.col="+evt.data.col + ". ==?" + (evt.data.col==j) + ". result: " + (evt.name.equals("Put") && evt.data.col == j))
        return evt.name.equals("Put") && evt.data.col == j;
    })
}

function AnyCoinInLine(id, lineCells) {
    return bp.EventSet("Any coin in line " + id, function (e) {
        if (!e.name.equals("Coin"))
            return false
        for (let i = 0; i < lineCells.length; i++)
            if (lineCells[i].row == e.data.row && lineCells[i].col == e.data.col)
                return true
        return false
    })
}
//endregion

//region Helper functions - basic game
function Coin(row, col, color) {
    return Event("Coin", {color: color, row: row, col: col});
}
//endregion

//region rules
ctx.bthread("block put in full columns", "Column.All", function (column) {
    for (let i = 0; i < ROWS; i++)
        sync({waitFor: AnyPutInCol(column.col)})
    bp.log.info("block put in full columns: " + column.col)
    sync({block: AnyPutInCol(column.col)})
})

ctx.bthread("put to coin", "Column.All", function (column) {
    for (let i = 0; i < ROWS; i++) {
        let color = sync({waitFor: AnyPutInCol(column.col)}).data.color
        sync({request: Coin(i, column.col, color)})
    }
})

//TODO should it be ctx.bthread?
bthread("EnforceTurns", function() {
    while (true) {
        sync({ waitFor: yellowColES, block: [redColES, AnyCoin]});
        sync({ waitFor: AnyCoin, block: [yellowColES, redColES]})
        sync({ waitFor: redColES, block: [yellowColES, AnyCoin]});
        sync({ waitFor: AnyCoin, block: [yellowColES, redColES]})
    }
});


ctx.bthread("win", "Four.All", function (four) {
    let color = sync({waitFor: AnyCoinInLine(four.id, four.cells)}).data.color
    for (let i = 0; i < 3; i++) {
        let e = sync({waitFor: AnyCoinInLine(four.id, four.cells)})
        if (e.data.color != color)
            return
    }
    bp.log.info(four.id + " Winner: " + color)
    sync({request: Event("Win", {color: color})})
})

ctx.bthread("Game over", "Game over", function (data) {
    bp.log.info("Game over. ")
    bp.log.info(data)
    sync({block: bp.eventSets.all})
})

//TODO verify draw (after fixing block issue)
ctx.bthread("Detect draw", "Game ongoing", function (data) {
    sync({waitFor: Event("Potential draw")})
    bp.log.info("Draw")
    sync({request: Event("Draw")})
})


//endregion

//region Random players
ctx.bthread("random yellow player", "Column.All", function (column) {
    while(true) {
        let e = sync({request: Event("Put", {color: 'Yellow', col: column.col})})
        // bp.log.info("ZZ random yellow player, got: " + e)
    }
})

ctx.bthread("random red player", "Column.All", function (column) {
    while(true) {
        let e = sync({request: Event("Put", {color: 'Red', col: column.col})})
        // bp.log.info("ZZ random red player, got: " + e)
    }
})
//endregion

//region printings
bthread("boardPrinter", function() {
    var board = [
        ['*', '*', '*', '*', '*', '*', '*'],
        ['*', '*', '*', '*', '*', '*', '*'],
        ['*', '*', '*', '*', '*', '*', '*'],
        ['*', '*', '*', '*', '*', '*', '*'],
        ['*', '*', '*', '*', '*', '*', '*'],
        ['*', '*', '*', '*', '*', '*', '*'],
    ];

    for (var i = 0; i < ROWS * COLS; i++) {
        var e = sync({waitFor: AnyCoin});
        bp.log.info(e)
        if (e.data.color.equals("Red")) {
            let row = e.data.row;
            let col = e.data.col;
            board[row][col] = 'R';
        } else {
            let row = e.data.row;
            let col = e.data.col;
            board[row][col] = 'Y'
        }

        bp.log.info("--------------------")
        for (var i = ROWS - 1; i >= 0; i--) {
            bp.log.info(board[i][0] + "  " + board[i][1] + "  " + board[i][2] + "  " + board[i][3] + "  " + board[i][4] + "  " + board[i][5] + "  " + board[i][6]);
        }
        bp.log.info(e.data)
        bp.log.info("--------------------")
    }
});
//endregion


// region strategies - five
ctx.bthread("mark fives as ready", "Five.NotBad", function (five) {
    for (let i = 0; i < five.cells_underneath.length; i++)
        sync({waitFor: AnyCoinInLine(five.id, five.cells_underneath)})
    bp.log.info("Five is ready: " + five.id)
    sync({request: Event("Five is ready", five.id)})
})

//TODO remove -else
ctx.bthread("mark fives as bad, or update cell's color", "Five.NotBad", function (five) {
    while (true) {
        let e = sync({waitFor: AnyCoinInLine(five.id, five.cells)})
        if (e.data.color != MYCOLOR) {
            bp.log.info("Bad color: " + five.id)
            sync({request: Event("Five is bad", five.id)})
        } else {
            bp.log.info("Good color: " + five.id)
            //TODO problem: it doesn't interfere with existing five!
            sync({request: Event("Remove cell from five", {id: five.id, coin: e.data})})
        }
    }
})

// TODO array of putincol (initial check)
ctx.bthread("request ready fives", "Five.Ready", function (five) {
    while (true) {
        let requesting = []
        // TODO edge
        // currently it doesn't handle 'edge's - the neighboring 2 pieces]
        for (let i = 0; i < five.cells.length; i++) {
            requesting.push(Event("Put", {color: MYCOLOR, col: five.cells[i].col}))
        }
        let e = bp.sync({request: requesting}, 50)      //TODO calc priority
    }
})

//endregion
