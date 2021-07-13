function near(a, b) {
    return
    (a.row == b.row && ((a.col == b.col + 1) || (a.col == b.col -1))) ||
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

ctx.bthread("random player", "Action.All", function (action) {
    while(true) {
        let e = sync({request: Event("Play", {id: action.id})})
        // bp.log.info("ZZ random player, got: " + e)
    }
})

ctx.bthread("Game over", "Game over", function (data) {
    bp.log.info("Game over. ")
    bp.log.info(data)
    sync({block: bp.eventSets.all})
})

ctx.bthread("wumpus - eat", "Wumpus.Alive", function (wumpus) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (wumpus.row == player.row && wumpus.col == player.col)
            sync({request: Event("Wumpus lunch")})
    }
})

ctx.bthread("wumpus - smell", "Wumpus.Alive", function (wumpus) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (near(wumpus, player))
            sync({request: Event("Stench")})
    }
})

ctx.bthread("gold - glitter", "Gold", function (gold) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (gold.row == player.row && gold.col == player.col)
            sync({request: Event("Glitter")})
    }
})

ctx.bthread("pit - fall", "Pit.All", function (pit) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (pit.row == player.row && pit.col == player.col)
            sync({request: Event("Fell in pit")})
    }
})

ctx.bthread("pit - breeze", "Pit.All", function (pit) {
    while (true) {
        let e = sync({waitFor: AnyActionDone})
        let player = e.data.player
        if (near(pit, player))
            sync({request: Event("Breeze")})
    }
})