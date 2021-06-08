// taken from https://github.com/BennySkidanov/bpjs-Benny/blob/master/4InARowVersion2.js

// Some sort of import 

/* Game Rules : 
 * 2 players - Red and Yellow, each has 21 round pieces in the color of the player. 
 * Lets assume, Yellow ( Computer ) and Red ( player ). 
 * A 6 x 7 board grid, which includes 42 positions for the round pieces mentioned earlier.
 * In an alternating order, each players chooses a column and releases a piece down the column. the piece lands and stays ( from that moment and on thorught the gam ) in the "lowest" 
 * possible position in the chosen column.
 * The goal of the game is to place 4 pieces in a row, column or diagonal. 
 * Strategies : 
 * 1. Of course, do not let the opponent win.
   2. Play the center column as much as possible.
   3. Create bottom 3 Trap.
 
 
 Wikipedia : The pieces fall straight down, occupying the lowest available space within the column. 
 The objective of the game is to be the first to form a horizontal, vertical, or diagonal line of four of one's own discs. 
 Connect Four is a solved game. The first player can always win by playing the right moves.
 */ 
 
bp.log.info("Connect Four - Let's Go!!");
 
StaticEvents = {
	'RedWin':bp.Event("RedWin"),
	'YellowWin':bp.Event("YellowWin"),
	'Draw':bp.Event("Draw")
}; 

// Game ends when : 1. Either of the players has won ( Red or Yellow ) 2. It's a draw
bthread("EndOfGame", function() {
	let e = sync({ waitFor:[ StaticEvents.RedWin, StaticEvents.YellowWin, StaticEvents.Draw ] });
	bp.log.info("End of game: {0}", e)
	sync({ block:[ moves ] });
});

bthread("DetectDraw", function() {
	for (var i=0; i< 42; i++) { sync({ waitFor:[ yellowCoinEs, redCoinEs ] }); }
	sync({ request:[ StaticEvents.Draw ] }, 90);
});


var moves = bp.EventSet("Move events", function(e) {
	return e.name.equals("Put") || e.name.equals("Coin");
});


 
// put in column event 
function putInCol(col, color) {
	return bp.Event( "Put", {color:color, col:col});
}

// put coin in specific cell event 


const redColES = bp.EventSet( "Red Col moves", function(evt){
    return evt.name.equals("Put") && evt.data.color.equals("Red");
});

const yellowColES = bp.EventSet( "Yellow Col moves", function(evt){
	return evt.name.equals("Put") && evt.data.color.equals("Yellow");
});

const redCoinEs = bp.EventSet( "Red Coin moves", function(evt){
	return evt.name.equals("Coin") && evt.data.color.equals("Red");
});

const yellowCoinEs = bp.EventSet( "Yellow moves", function(evt){
	return evt.name.equals("Coin") && evt.data.color.equals("Yellow");
});

const AnyPut = bp.EventSet("Any Put", function(evt) {
	return evt.name.equals("Put");
});



// req1: Represents alternating turns as mentioned in the game rules 
bthread("EnforceTurns", function() {
	while (true) {
		//TODO boardUpdatedES should be first?
		sync({ waitFor:yellowColES, block: [yellowCoinEs, redColES, redCoinEs, boardUpdatedES]});
		sync({ waitFor:yellowCoinEs, block: [redColES, redCoinEs, yellowColES, boardUpdatedES]});
		sync({ waitFor:boardUpdatedES, block: [redColES, redCoinEs, yellowColES, yellowCoinEs]});
		sync({ waitFor:redColES, block: [yellowColES, yellowCoinEs, redCoinEs, boardUpdatedES]});
		sync({ waitFor:redCoinEs, block: [redColES, yellowCoinEs, yellowColES, boardUpdatedES]});
		sync({ waitFor:boardUpdatedES, block: [redColES, redCoinEs, yellowColES, redCoinEs]});
	}
});

//req2: physics - after put in a col, the coin falls to the first available place
bthread("put in col" , function() { 
	let columns = [ 5 , 5 , 5 , 5 , 5 , 5 , 5 ];
	while(true) {
		let e = sync({waitFor: AnyPut });
		let ev = sync({request: putCoin( columns[e.data.col]-- , e.data.col, e.data.color)});
		// bp.dump("put in col", "ev", typeof(ev), ev)
	}
});

//req3: one cannot put a coin in a full column
function blockPutInFullColumn(col){
	bthread("one cannot put a coin in a full column " + col , function() { 
        let es = col == 0 ? col0ES :
        col == 1 ? col1ES : 
        col == 2 ? col2ES : 
        col == 3 ? col3ES : 
        col == 4 ? col4ES : 
        col == 5 ? col5ES :
        col == 6 ? col6ES : null ;

		for(let i = 0; i < 6; i++) {
            sync({ waitFor: es });
        }
        while(true) {
		    sync({ block: es });
        }
    })
}

let j = 0; 
for( j=0; j < 7; j++ ) 
{
	blockPutInFullColumn(j);
}

//req4: if a player places 4 coins in a line - the player wins
let allFours=[];


for(var i = 0; i < 3; i++ ) { 
	for(var j = 0; j < 4; j++) {
		allFours.push( [ { row : i, col : j } , { row : i, col : j+1 } , { row : i, col : j+2 } , { row : i, col : j+3 } ] );
		allFours.push( [ { row : i, col : j } , { row : i + 1, col : j } , { row : i + 2, col : j } , { row : i + 3, col : j } ] );
	}
}


for(var i = 3; i < 6; i++ ) { 
	for(var j = 0; j < 4; j++) {
        allFours.push( [ { row : i, col : j } , { row : i, col : j+1 } , { row : i, col : j+2 } , { row : i, col : j+3 } ] ); 
    }
}


for(var i = 0; i < 3; i++ ) { 
	for(var j = 4; j < 7; j++) {
        allFours.push( [ { row : i, col : j } , { row : i + 1, col : j } , { row : i + 2, col : j } , { row : i + 3, col : j } ] );
    }
}

for(var i = 0; i < 6; i++ ) { 
	for(var j = 0; j < 4; j++) {
		if( i <= 2 && j <= 3 ) {
			allFours.push( [ { row : i, col : j } , { row : i + 1, col : j+1 } , { row : i + 2, col : j+2 } , { row : i + 3, col : j+3 } ] );
		}
		else {
			allFours.push( [ { row : i, col : j } , { row : i - 1, col : j+1 } , { row : i - 2, col : j+2 } , { row : i - 3, col : j+3 } ] );
		}
	}
}


//rules for fours
let len = allFours.length; // number of fours 
for ( var i=0; i<len; i++ ) {
    (function(j){
        let currentFour = allFours[j];
        let btName = "Detect yellow win" + "[" + "(" +  currentFour[0].row + "," + currentFour[0].col + ")" + " ; " +
			"(" +  currentFour[1].row + "," + currentFour[1].col + ")" + " ; " +
			"(" +  currentFour[2].row + "," + currentFour[2].col + ")" + " ; " +
			"(" +  currentFour[3].row + "," + currentFour[3].col + ")" + "]"
        bthread(btName , function() {
            let fourEventArr = [];
            for(var i = 0; i < 4; i++) 
            {
                fourEventArr.push(putCoin(currentFour[i].row, currentFour[i].col, "Yellow"));
            }
			// bp.dump(btName, "j", typeof (j), j)
			// bp.dump(btName, "fourEventArr", typeof (fourEventArr), fourEventArr)

			for ( var i=0; i<4; i++ ) {
				// bp.log.info("Detect YellowWin waiting " + j + " #" + i)
				// bp.log.info(fourEventArr)
				let e = sync({waitFor:fourEventArr});
				if (true) {
					// bp.dump(btName, "e", typeof(e), e)
					// bp.dump(btName, "j", typeof(j), j)
					// bp.dump(btName, "i", typeof(i), i)
					// bp.dump(btName, "fourEventArr", typeof(fourEventArr), fourEventArr)
					// bp.log.info("Detect YellowWin received " + j + ", #" + i + " : " + e)
					// bp.log.info(fourEventArr)
				}
			}

            sync({request:StaticEvents.YellowWin, block: moves }, 100);
        });
    })(i);
};


for ( var i=0; i<len; i++ ) {
    (function(j){
        let currentFour = allFours[j];
        bthread("Detect red win" + "[" + "(" +  currentFour[0].row + "," + currentFour[0].col + ")" + " ; " + 
        "(" +  currentFour[1].row + "," + currentFour[1].col + ")" + " ; " + 
        "(" +  currentFour[2].row + "," + currentFour[2].col + ")" + " ; " + 
        "(" +  currentFour[3].row + "," + currentFour[3].col + ")" + "]" , function() { 
            let fourEventArr = [];
            for(var i = 0; i < 4; i++) 
            {
                fourEventArr.push(putCoin(currentFour[i].row, currentFour[i].col, "Red"));
            }
    
            for ( var i=0; i<4; i++ ) {
                  sync({waitFor:fourEventArr});
            }
            
            sync({request:StaticEvents.RedWin, block: moves }, 100);
        });
    })(i);
};




//From here: strategies

/*
bthread("CenterCol", function() {
	while (true) {
		sync({ request:[ putInCol(3, "Yellow"), 
							putInCol(3, "Red") ] });
	}
});

bthread("semiCenterCol", function() {
	while (true) {
		sync({ request:[  putInCol(1, "Yellow") , putInCol(2, "Yellow") , putInCol(4, "Yellow") , putInCol(5, "Yellow"), 
							 putInCol(1, "Red") , putInCol(2, "Red") , putInCol(4, "Red") , putInCol(5, "Red") ] });
	}
});

bthread("sideCol", function() {
	while (true) {
		sync({ request:[ putInCol(0, "Yellow"),putInCol(6, "Yellow"),
							putInCol(0, "Red"),putInCol(6, "Red")     ] });
	}
});
*/

bthread('random yellow player', function() {
	const possiblePuts = Array.from(Array(7).keys()).map(j => putInCol(j, 'Yellow'))
	while(true) {
		let e = sync({request: possiblePuts}, 10)
		// bp.log.info("random yellow requested: " + e)
	}
})

bthread('random red player', function() {
	const possiblePuts = Array.from(Array(7).keys()).map(j => putInCol(j, 'Red'))
	while(true) {
		sync({request: possiblePuts}, 10)
	}
})


bthread("boardUpdater", function() {
	var board = [
		['*', '*', '*', '*', '*', '*', '*'],

		['*', '*', '*', '*', '*', '*', '*'],

		['*', '*', '*', '*', '*', '*', '*'],

		['*', '*', '*', '*', '*', '*', '*'],

		['*', '*', '*', '*', '*', '*', '*'],

		['*', '*', '*', '*', '*', '*', '*'],
	];

	for (var i = 0; i < 42; i++) {
		var e = sync({waitFor: [redCoinEs, yellowCoinEs]});
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
		for (var i = 0; i < 6; i++) {
			bp.log.info(board[i][0] + "  " + board[i][1] + "  " + board[i][2] + "  " + board[i][3] + "  " + board[i][4] + "  " + board[i][5] + "  " + board[i][6]);
		}
		bp.log.info(e.data)
		bp.log.info("--------------------")

		//TODO: do we need to pass 'board'?
		// sync({request: bp.Event("BoardUpdated", {board: board, ev: e})})
		sync({request: bp.Event("BoardUpdated", {ev: e})})
	}
});


var boardUpdatedES = bp.EventSet("BoardUpdated ES", function(e) {
	return e.name == "BoardUpdated";
});

/*
const ST_TOO_HIGH = 0
const ST_READY = 1
const ST_MY = 2
const ST_BAD = 3


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


function waitAndUpdateSeries(series) {
	for (let players = 0; players < 2; players++) {
		//TODO do we even need boardUpdatedES?
		let e = sync({waitFor: boardUpdatedES})
		ev = e.data.ev
		// bp.log.info("seriesHandler: got boardUpdatedES: " + ev.data.row + ", " + ev.data.col + " : " + ev.data.color)
		for (let i = 0; i < series.length; i++) {
			cell = series[i]
			if (ev.data.row == cell.row && ev.data.col == cell.col) {
				if (ev.data.color == "Yellow")
					cell.status = ST_MY
				else {
					// bp.log.info("BAD BOY!")
					cell.status = ST_BAD
				}
			} else if (ev.data.row == cell.row + 1 && ev.data.col == cell.col) {
				cell.status = ST_READY
			}
		}
	}
}

function initSeries(series) {
	// first row is already available
	for (let i = 0; i < series.length; i++) {
		if (series[i].row == 5)
			series[i].status = ST_READY
		else
			series[i].status = ST_TOO_HIGH
	}
}

// strategy: catch the 3 center cells of empty five, and then one of the edges
function registerFivesHandler(series) {
	bthread("fivesHandler", function () {
		initSeries(series);

		while (true) {
			waitAndUpdateSeries(series);

			let priority = 40
			let ok = true

			// we prefer to use 'requesting' first. only if it's empty, that means that all of it is ours, then we request edge, and should win
			let requesting = []
			let requesting_edge = []
			for (let i = 0; i < series.length; i++) {
				if (series[i].status == ST_READY) {
					if (series[i].edge)
						requesting_edge.push(putInCol(series[i].col, "Yellow"))
					else
						requesting.push(putInCol(series[i].col, "Yellow"))
				} else if (series[i].status == ST_MY) {
					priority += 5
				} else if (series[i].status == ST_BAD) {
					ok = false
				}
			}

			if (ok) {
				bp.log.info("seriesHandler series: ")
				bp.log.info(series)
				if (requesting.length > 0) {
					// bp.log.info("seriesHandler requesting (priority " + priority + "): " + requesting)
					let e = sync({request: requesting}, priority)
					// bp.log.info("seriesHandler requested " + e)
				} else if (requesting_edge.length > 0) {
					// bp.log.info("seriesHandler requesting_edge (priority 90): " + requesting_edge)
					let e = sync({request: requesting_edge}, 90)
					// bp.log.info("seriesHandler requested_edge " + e)
				}
			}
		}
	})
}

for (let i = 0; i < allFives.length; i++) {
	registerFivesHandler(allFives[i])
}
*/

// strategy: catch the 3 center cells of empty five, and then one of the edges
// strategy: catch the fourth cell out of four
// strategy: catch 3 out of two 4-s, such as the opponent would have to block the first one, and we will complete the second above his coin

// strategy: don't let the opponent to catch the fourth cell out of four
// strategy: don't let the opponent to catch the the 3 center cells of empty five


