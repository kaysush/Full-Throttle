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

/* User constructor */
User=function(id,userName){
	this.id=id;
	this.userName=userName;
}

/* GameRoom constructor */
var GameRoom=function(name,cpacity){
	this.name=name;
	this.MAX_CAPACITY=cpacity;
	this.usersList=[];
	this.userPos=[];
}

/* add prototype to GameRoom to add user (check of maximum user is done)*/
GameRoom.prototype.addUser=function(name){
	if(this.usersList.length!=this.MAX_CAPACITY){
		this.usersList.push(new User(this.usersList.length+1,name));
			return true;
	}
	return false;
}

/* remove a user based on its name (not working properly)*/
GameRoom.prototype.removeUser=function(name){
	var users=this.usersList;
	var index=-1 /* index -1 if not found */;
	for(var i = 0 ; i < users.length ; i++ ){ /* search the user in the list and return its index */
		var user=users[i];
		if( user.name === name){
			index=i; /* index of the user */
		}
	}
	this.usersList.splice(index,1);
}

/* get list of users in the room */
GameRoom.prototype.getUsersList=function(){
	return this.usersList;
}

/* get user object given the index */
GameRoom.prototype.getUser=function(index){
	return this.usersList[index];
}
/* actual count of user in the room */
GameRoom.prototype.getUserCount=function(){
	return this.usersList.length;
}
/* create a game room (function exported so that it can be accessed within from our server code) */
exports.createGameRoom=function(name,capacity){
return new GameRoom(name,capacity);
}




