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
    bp.log.info("wumpus - eat")
    bp.log.info(wumpus)
    let e = sync({waitFor: AnyActionDone})
    bp.log.info("WUMPUS! " + e.data.id)
    bp.log.info(e)
    //TODO
})
