function near(a, b) {
    return  (a.row == b.row && ((a.col == b.col + 1) || (a.col == b.col -1))) ||
            (a.col == b.col && ((a.row == b.row + 1) || (a.row == b.row -1)))
}

const AnyPlay = bp.EventSet("Play", function (evt) {
    return evt.name.equals("play")
})

const AnyActionDone = bp.EventSet("Action done", function (evt) {
    return evt.name.equals("Action done")
})

bthread("EnforceTurns", function() {
    while (true) {
        sync({ waitFor: AnyPlay});
        sync({ waitFor: AnyActionDone, block: [AnyPlay]})
    }
});


ctx.bthread("wumpus - eat", "Wumpus.Alive", function (wumpus) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (wumpus.row == player.row && wumpus.col == player.col)
            sync({request: Event("Wumpus lunch")}, 1000)
    }
})

ctx.bthread("wumpus - smell", "Wumpus.Alive", function (wumpus) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (near(wumpus, player))
            sync({request: Event("Stench")}, 1000)
    }
})

ctx.bthread("gold - glitter", "Gold", function (gold) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (gold.row == player.row && gold.col == player.col)
            sync({request: Event("Glitter")}, 1000)
    }
})

ctx.bthread("pit - fall", "Pit.All", function (pit) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (pit.row == player.row && pit.col == player.col)
            sync({request: Event("Fell in pit")}, 1000)
    }
})

ctx.bthread("pit - breeze", "Pit.All", function (pit) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (near(pit, player))
            sync({request: Event("Breeze")}, 1000)
    }
})

bthread("Start", function () {
    sync({request: Event("Start")}, 1000)
})

///////////////////////////////////////////////////////////
///////////            strategies            //////////////
///////////////////////////////////////////////////////////


bthread("Grab gold", function() {
    while (true) {
        sync({waitFor: Event("Glitter")});
        sync({request: Event("Play", {id: 'grab'})}, 100)
    }
});

ctx.bthread("player - default", "Cell.All", function (cell) {
    while(true) {
        sync({request: Event("Play", {id: 'forward'})}, 10)
    }
})

ctx.bthread("player - bumps - turn", "Cell.All", function (cell) {
    while(true) {
        sync({waitFor: Event("Bump")})
        //TODO smarter turns?
        sync({request: [Event("Play", {id: 'turn-right'}),
                             Event("Play", {id: 'turn-left'})]}, 20)
    }
})

//TODO not good enough. currently it goes in cycles
ctx.bthread("player - breeze/stench - turn and advance", "Cell.All", function (cell) {
    while(true) {
        sync({waitFor: [Event("Breeze"), Event("Stench")]})
        //TODO smarter turns?
        sync({request: [Event("Play", {id: 'turn-right'}),
                             Event("Play", {id: 'turn-left'})]}, 30)
        sync({request: Event("Play", {id: 'forward'})}, 30)
    }
})

/*
ctx.bthread("player - stench - turn and advance", "Cell.All", function (cell) {
    while(true) {
        sync({waitFor: Event("Stench")})
        //TODO smarter turns?
        sync({request: Event("Play", {id: 'turn-right'})}, 20)
        sync({request: Event("Play", {id: 'turn-right'})}, 20)
        sync({request: Event("Play", {id: 'forward'})}, 20)
    }
})
 */

ctx.bthread("leave", "Cell.Opening", function (cell) {
    while(true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (e.data.kb.has_gold && cell.row == player.row && cell.col == player.col)
            sync({request: Event("Play", {id: 'climb'})}, 90)
    }
})

//TODO when to shoot?