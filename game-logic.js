/**
 * register event listeners and emitters. 
 */

var io
var gameSocket
var gamesInSession = []
// stores an array of all active socket connections


const initializeGame = (sio, socket) => {
    // It sets up all the socket event listeners. 
    io = sio
    gameSocket = socket

    // pushes the socket to an array which contains all active sockets.
    gamesInSession.push(gameSocket)

    gameSocket.on("disconnect", onDisconnect)

    gameSocket.on("new move", newMove)

    gameSocket.on("createNewGame", createNewGame)

    gameSocket.on("playerJoinGame", playerJoinsGame)

    gameSocket.on('request username', requestUserName)

    gameSocket.on('recieved userName', recievedUserName)

}



function playerJoinsGame(idData) {
    // reference to the player's Socket.IO socket object
    var sock = this

    // Find the room ID in the Socket.IO manager object.
    var room = io.sockets.adapter.rooms[idData.gameId]
    // console.log(room)

    if (room === undefined) {
        this.emit('status', "This game session does not exist.");
        return
    }
    if (room.length < 2) {
        idData.mySocketId = sock.id;

        sock.join(idData.gameId);

        console.log(room.length)

        if (room.length === 2) {
            io.sockets.in(idData.gameId).emit('start game', idData.userName)
        }

        // notify the clients that the player has joined the room.
        io.sockets.in(idData.gameId).emit('playerJoinedRoom', idData);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('status', "There are already 2 people playing in this room.");
    }
}


function createNewGame(gameId) {
    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('createNewGame', { gameId: gameId, mySocketId: this.id });

    // Join the Room and wait for the other player
    this.join(gameId)
}


function newMove(move) {
    // get the room ID in which to send this message and send the message to all the sockets in that room. 

    const gameId = move.gameId

    io.to(gameId).emit('opponent move', move);
}

function onDisconnect() {
    var i = gamesInSession.indexOf(gameSocket);
    gamesInSession.splice(i, 1);
}


function requestUserName(gameId) {
    io.to(gameId).emit('give userName', this.id);
}

function recievedUserName(data) {
    data.socketId = this.id
    io.to(data.gameId).emit('get Opponent UserName', data);
}

exports.initializeGame = initializeGame