var express = require('express')
var app = express.createServer();

var io = require('socket.io').listen(app);

app.configure(function(){
	app.use(express.static(__dirname + '/public'));
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.listen(8000);

function Server() {
	this.waiting_users = [];
	this.listeners = {};
	this.users = {};
};

Server.prototype = {
	connect_user: function(user) {
		this.users[user.id] = user;
		this.waiting_users.push(user);
		this.update_listeners();
	},
	disconnect_user: function(user) {
		delete this.users[user.id];
		var waiting_user_i = this.waiting_users.indexOf(user)
		if (waiting_user_i != -1)
			this.waiting_users.splice(waiting_user_i, 1);;
		this.update_listeners();
	},
	connect_listener: function(listener) {
		this.listeners[listener.id] = listener;
		listener.update_waiting(this.waiting_users.length);
	},
	update_listeners: function() {
		for (var id in this.listeners)
			this.listeners[id].update_waiting(this.waiting_users.length);
	}
};


function User(server, socket) {
	this.id = socket.id;
	this.server = server;
	this.socket = socket;
	this.listener = null;
	
	server.connect_user(this);
	
	socket.on("disconnect", function() {
		console.log("client disconnect");
		server.disconnect_user(this);
		if (this.listener)
			this.listener.disconnect_user(this);
	}.bind(this));
}

User.prototype = {
	set_listener: function(listener) {
		this.listener = listener;
		this.socket.on("msg", function(msg) {
			this.listener.send_msg(this.id, msg);
		}.bind(this));
		this.socket.emit("connected");
	},
	send_msg: function(msg) {
		this.socket.emit("msg", msg);
	}
};


function Listener(server, socket) {
	this.id = socket.id;
	this.server = server;
	this.socket = socket;
	this.users = {};
	
	socket.on("msg", function(user, msg) {
		this.users[user].send_msg(msg);
	}.bind(this));
	
	socket.on("connect", function(ret) {
		var user = this.server.waiting_users.shift();
		if (user != null) {
			this.server.update_listeners();
			this.connect_user(user);
			ret(user.id);
		} else
			ret(null);
	}.bind(this));
	
	server.connect_listener(this);
}

Listener.prototype = {
	connect_user: function(user) {
		user.set_listener(this);
		this.users[user.id] = user;
	},
	send_msg: function(id, msg) {
		this.socket.emit("msg", id, msg);
	},
	update_waiting: function(n) {
		this.socket.emit("waiting", n);
	},
	disconnect_user: function(user) {
		delete this.users[user.id];
		this.socket.emit("disconnect_user", user.id);
	}
};

var server = new Server();

io.sockets.on('connection', function(socket) {
	console.log('connect');
	socket.on('connect_user', function() {
		console.log('connect user');
		new User(server, socket);
	});
	
	socket.on('connect_listener', function() {
		console.log('connect listener');
		new Listener(server, socket);
	});
	
});
