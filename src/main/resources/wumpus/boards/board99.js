
// 0 - nothing. 1 - gold. 2 - wumpus. 4 - pit
const gameBoard = [
//   1,2,3,4,5,6,7,8,9,10    (cols)
    [0,0,0,4,0,0,4,0,0,0],       // row: 10
    [0,0,0,0,0,0,0,0,4,4],       // row: 9
    [0,4,0,0,0,0,0,0,0,0],       // row: 8
    [0,0,0,0,4,4,0,0,0,4],       // row: 7
    [0,0,0,0,4,0,4,0,4,0],       // row: 6
    [0,0,0,0,0,0,0,0,4,4],       // row: 5
    [4,4,0,0,0,2,0,0,0,4],       // row: 4
    [0,0,0,4,0,0,0,0,0,0],       // row: 3
    [0,0,0,0,4,0,0,0,0,0],       // row: 2
    [0,4,1,0,4,4,0,0,0,0],       // row: 1
]