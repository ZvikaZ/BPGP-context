let i = 0
allFives.forEach(function (line) {
    bthread('FiveHandler.' + i, 'Five.AllReady.' + i,
        function (entity) {
            bp.log.info("ZZ FiveHandler - requesting:")
            bp.log.info(entity.center.map(cell => putInCol(cell.col, "Yellow")))
            sync({request: entity.center.map(cell => putInCol(cell.col, "Yellow"))}, 80)
        })
    i++
})
