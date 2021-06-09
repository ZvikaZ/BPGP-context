//region EventSets - basic game
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

function AnyCoinInRow(i) {
    return bp.EventSet("Any coin in row " + i, function (evt) {
        return evt.name.equals("Coin") && evt.data.row == i;
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

//region behavior

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

ctx.bthread("Game over", "Game over", function (four) {
    bp.log.info("Game over")
    sync({block: bp.eventSets.all})
})

//endregion


// //region manage fives' state
// ctx.bthread("mark horizontal fives as ready", "Five.All", function (five) {
//     let count = 0
//     while (true) {
//         let col = sync({waitFor: AnyCoinInRow(five.cells[0].row - 1)})
//         if (col >= five.cells[0].col || col <= five.cells[5].col)
//             count++
//         if (count == 5) {
//             sync({request: Event("Five is ready", five.id)})
//             return
//         }
//     }
// })
// //endregion

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
