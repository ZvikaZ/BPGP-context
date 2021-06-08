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


// const redCoinEs = bp.EventSet("Red Coin moves", function(evt){
//     return evt.name.equals("Coin") && evt.data.color.equals("Red");
// });
//
// const yellowCoinEs = bp.EventSet("Yellow moves", function(evt){
//     return evt.name.equals("Coin") && evt.data.color.equals("Yellow");
// });


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
//endregion

//region EventSets - strategies
function AnyCoinInFive(id, fiveCells) {
    return bp.EventSet("Any coin in five " + id, function (e) {
        if (!e.name.equals("Coin")) return false
        for (let i = 0; i < fiveCells.length; i++)
            if (fiveCells[i].row == e.data.row && fiveCells[i].col == e.data.col)
                return true
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
        bp.log.info("put to coin, requesting " + color)
        sync({request: Coin(i, column.col, color)})
        bp.log.info("put to coin, got " + color)
    }
})

//TODO should it be ctx.bthread?
bthread("EnforceTurns", function() {
    while (true) {
        sync({ waitFor:yellowColES, block: [redColES]});
        sync({ waitFor:redColES, block: [yellowColES]});
    }
});
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
//TODO should it be ctx.bthread?
bthread('random yellow player', function() {
    const possiblePuts = Array.from(Array(COLS).keys()).map(j => Event( "Put", {color:'Yellow', col:j}))
    while(true) {
        sync({request: possiblePuts}, 10)
    }
})

bthread('random red player', function() {
    const possiblePuts = Array.from(Array(COLS).keys()).map(j => Event( "Put", {color:'Red', col:j}))
    while(true) {
        sync({request: possiblePuts}, 10)
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
        bp.log.info("ZZ - start")
        var e = sync({waitFor: AnyCoin});
        bp.log.info("ZZ - got:")
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
        for (var i = 0; i < ROWS; i++) {
            bp.log.info(board[i][0] + "  " + board[i][1] + "  " + board[i][2] + "  " + board[i][3] + "  " + board[i][4] + "  " + board[i][5] + "  " + board[i][6]);
        }
        bp.log.info(e.data)
        bp.log.info("--------------------")
    }
});
//endregion
