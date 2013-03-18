/*
Copyright (c) by Sushil Kumar

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */
 
/* Import Express module */
var express=require("express");
/* Import HTTP modeule */
var http=require("http");
/* Import Socket.io module */
var socket=require("socket.io");
/* Import game room management module */
var gameroom=require("./game-room.js");
/* create express instance */
var app=express();
var PORT = process.env.OPENSHIFT_INTERNAL_PORT || 8080;

/* Array to hold all gamerooms */
var gamerooms=[];
var i=0;
/* Function to search gameroom based on its name and returns its index */
function searchGameRoom(gamerooms,name){
	for (var i = 0 ; i < gamerooms.length ; i++ ){
		if(gamerooms[i].name === name){
			return i;
		}
	}
	return -1;
}

/* Cretion of some dummy rooms for testing purpose */
gamerooms.push(gameroom.createGameRoom("room2",5));
gamerooms.push(gameroom.createGameRoom("room1",2));


/* create HTTP server and attach express instance with it */
var server=http.createServer(app);
/* server listening at PORT */
server.listen(PORT);

/* Create a route /game for just testing purpose ( to make sure server is running) */
app.use("/game",function(request,response){
	response.set("Content-Type","text/html");
	response.send("Game page");
})

app.use('/images', express.static(__dirname + '/images'));

/* attacj socket.io with the server */
var io=socket.listen(server);
io.set('log level', 3);

/* event fired when a new client connects */
io.on("connection",function(socket){
	/* User for this socket */
	var user={};
	
	/* Join a specific room */
	socket.on("join-room",function(roomNumber){
		/* parse the room number to integer */
		var roomIndex=parseInt(roomNumber,10);
		/* get the actual game room */
		var room=gamerooms[roomIndex];
		/* get the room name */
		var roomName=room.name;
		/* add this socket to room (for grouping events based on room names) */
		socket.join(roomName);
		/* add room number to current user */
		user.roomNumber=roomIndex;
		/* add user to this room (returns true if add was successful and false if room is full) */
		var result=room.addUser(user.name);
		/* Enter the initial position of user in gameplay (just a dummy value now will change once game is complete) */
		room.userPos.push({x : 100 , y : 100});
		/* check if room was not full */
		if(result === true){
			/* Room join successful (send the parametes which are required by client to maintain game state) */
			socket.emit("room-join-successfull",{"room_number" : roomIndex , "room_name" : roomName , "user_number" : room.usersList.length , "user_position" : room.userPos});
			/* update the game room list to every client (not on ly to member of this room every client connected) */
			io.sockets.emit("gamerooms-list",gamerooms);
			/* boradcast inital position of new member to the other members of the room */
			socket.broadcast.to(roomName).emit("user-position" , {"user_position" : room.userPos});
		}else{
			/* Error!!! If room was already full */
			socket.emit("error",{msg : "Game room full..."});
		}
		
	});

	/* Join game (not to be confused with join room)
	   This event just creates a user and attach it 
	   the socket for future use */
	socket.on("join-game",function(data){
		user.name=data.name;
		socket.emit("gamerooms-list",gamerooms);
	});

	/* get user count from game room name */
	socket.on("get-user-count",function(name){
		var roomIndex=searchGameRoom(gamerooms,name);
		var count=gamerooms[roomIndex].getUserCount();
		socket.emit("user-count",count);
	});

	/* get user name of currrent socket */
	socket.on("get-user-name",function(){
		socket.emit("user-name",user.name);
	});

/* create a new game room with given name and capacity (name already present check not done) */
	socket.on("create-game-room",function(data){
		var room=gameroom.createGameRoom(data.name,data.capacity);
		gamerooms.push(room);
	});

	/* get list of all gamerooms with the user information too */
	socket.on("get-gamerooms",function(){
		/* event to return game rooms list */
		socket.emit("gamerooms-list",gamerooms);
	});

	/* get game room name from room number */
	socket.on("get-gameroom-name",function(data){
		var index=data.index;
		var name=gamerooms[index].name;
		/* event to return the game room name */
		socket.emit("gameroom-name",{"name" : name});
	});

	/* the in game chat functionality */
	socket.on("chat",function(data){
		var username=data.username; /* from which user */
		var roomname=data.roomname; /* to which room it is intended */
		var message=data.message;/* actual message */
		/* emit the message to other members of the room */
		socket.broadcast.to(roomname).emit("chat",{"username" : username,"message" : message});

	});

    /* updates the user positio non the server */
	socket.on("update-user-position",function(data){
		/* user index is user_number-1 */
		var userIndex=data.user_number-1;
		/* room_number -- Number of room to which user belongs
		   update the new position */
		gamerooms[data.room_number].userPos[userIndex]={"x" : data.x , "y" : data.y};

	});

	socket.on("show-user-pos",function(data){
		var pos=gamerooms[data.index].userPos;
		for(var i = 0 ; i < pos.length ; i++){
			//console.log("Current : X : "+pos[i].x+" Y : "+pos[i].y+"\n");
		}
	});

	/* User disconnected
	Clear up the user info */
	socket.once("disconnect",function(){
		if(typeof user.roomNumber === 'undefined'){

		}else{
			var index=user.roomNumber;
			var room=gamerooms[index];
			room.removeUser(user.name);
			io.sockets.emit("gamerooms-list",gamerooms);
			socket.broadcast.to(room.name).emit("user-left",{"name" : user.name });
			//console.log(" No. of users remaining : "+room.usersList.length);
			socket.disconnect();
		}
	});



});