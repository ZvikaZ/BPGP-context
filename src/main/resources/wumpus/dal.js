//TODO draw board

const ROWS = 4
const COLS = 4

let gameOngoing = ctx.Entity("game ongoing")

let score = ctx.Entity("score", "", {val: 0})
let arrows = ctx.Entity("arrows", "", {val: 1})

//TODO: randomize wumpus location
let wumpus = ctx.Entity("wumpus", "", {
    status: 'alive',
    row: 3,
    col: 1
})

//TODO: randomize gold location
let gold = ctx.Entity("gold", "", {
    status: 'ready',
    row: 3,
    col: 2
})

//TODO: randomize pits locations
let pits = []
pits.push(ctx.Entity("pit1", "pit", { row: 1, col: 3 }))
pits.push(ctx.Entity("pit2", "pit", { row: 3, col: 3 }))
pits.push(ctx.Entity("pit3", "pit", { row: 4, col: 4 }))

let player = ctx.Entity("player", "", {
    row: 1,
    col: 1,
    facing: 90
})

let actions = []
actions.push(ctx.Entity("forward", "action", {}))
actions.push(ctx.Entity("turn-left", "action", {}))
actions.push(ctx.Entity("turn-right", "action", {}))
actions.push(ctx.Entity("grab", "action", {}))
actions.push(ctx.Entity("shoot", "action", {}))
actions.push(ctx.Entity("climb", "action", {}))

ctx.populateContext(pits.concat(actions).concat([gameOngoing, score, arrows, wumpus, gold, player]))



ctx.registerQuery("Wumpus.Alive", function (entity) {
    return entity.id.equals("wumpus") && entity.status.equals("alive")
})

ctx.registerQuery("Pit.All", function (entity) {
    return entity.type.equals("pit")
})

ctx.registerQuery("Gold", function (entity) {
    return entity.id.equals("gold")
})

ctx.registerQuery("Game ongoing", function (entity) {
    return entity.id.equals("game ongoing")
})

ctx.registerQuery("Game over", function (entity) {
    return entity.id.equals("game over")
})

ctx.registerQuery("Player", function (entity) {
    return entity.id.equals("player")
})

ctx.registerQuery("Action.All", function (entity) {
    return entity.type.equals("action")
})

function updateScore(delta) {
    let score = ctx.getEntityById("score")
    score.val += delta
    ctx.updateEntity(score)
}

function gameOver(type) {
    let score = ctx.getEntityById("score")
    ctx.removeEntity(ctx.Entity("game ongoing"))
    ctx.insertEntity(ctx.Entity("game over", type, {score: score.val}))
}

ctx.registerEffect("Play", function (action) {
    updateScore(-1)
    let player = ctx.getEntityById("player")
    if (action.id.equals("forward")) {
        if (player.facing == 90 && player.col < COLS)
            player.col++
        if (player.facing == 270 && player.col > 1)
            player.col--
        if (player.facing == 0 && player.row < ROWS)
            player.row++
        if (player.facing == 180 && player.row > 1)
            player.row--
        ctx.updateEntity(player)
    } else if (action.id.equals("turn-right")) {
        player.facing += 90
        if (player.facing >= 360)
            player.facing -= 360
        ctx.updateEntity(player)
    } else if (action.id.equals("turn-left")) {
        player.facing -= 90
        if (player.facing < 0)
            player.facing += 360
        ctx.updateEntity(player)
    } else if (action.id.equals("grab")) {
        let gold = ctx.getEntityById("gold")
        if (gold.status.equals("ready") && gold.row == player.row && gold.col == player.col) {
            gold.status = "taken"
            ctx.updateEntity(gold)
            updateScore(1000);
        }
    } else if (action.id.equals("shoot")) {
        let arrows = ctx.getEntityById("arrows")
        let wumpus = ctx.getEntityById("wumpus")
        if (arrows.val > 0) {
            arrows.val--
            ctx.updateEntity(arrows)
            if (
                ((player.facing == 0 || player.facing == 180) && player.col == wumpus.col) ||
                ((player.facing == 90 || player.facing == 270) && player.row == wumpus.row)
            ) {
                wumpus.status = "dead"
                ctx.updateEntity(wumpus)
                sync({request: Event("Scream")})
            }
        }
    } else if (action.id.equals("climb")) {
        if (player.row == 1 && player.col == 1) {
            gameOver("climbed")
        }
    } else {
        bp.log.info("Unrecognized action: " + action.id)
        exit() // 'exit' is undefined - but anyway, it achieves its goal...
    }
    sync({request: Event("Action done", {
        id: action.id,
        player: player
    })})
})

ctx.registerEffect("Wumpus lunch", function (effect) {
    updateScore(-1000);
    gameOver("wumpus lunch")
})