const WebSocket = require('ws');

class SexDB {
	constructor(url) {
		this.url = url;
		this.ws = new WebSocket(this.url);
		this.ready = false;
		this.id = 0;
		this.callbacks = [];

		this.ws.on('message', (data) => {
			let split = data.toString().split(" ");
			let id = +split.shift();
			this.callbacks[id](split.join(" "));
		});
	}

	wait() {
		return new Promise((res, rej) => {
			if(this.ready) res();
			this.ws.once('open', () => {
				this.ready = true;
				res();
			});
		});
	}

	set(key, value) {
		return new Promise((res, rej) => {
			let id = this.id++;
			this.ws.send(`${id} SET ${key} ${value}`);
			this.callbacks[id] = (data) => {
				data = data.toString();
				if(!data.startsWith("ERROR:")) res(data);
				else rej(data);
			}
		});
	}

	get(key) {
		return new Promise((res, rej) => {
			let id = this.id++;
			this.ws.send(`${id} GET ${key}`);
			this.callbacks[id] = (data) => {
				data = data.toString();
				if(!data.startsWith("ERROR:")) res(data);
				else rej(data);
			}
		});
	}

	custom(command) {
		return new Promise((res, rej) => {
			let id = this.id++;
			this.ws.send(`${id} ${command}`);
			this.callbacks[id] = (data) => {
				data = data.toString();
				if(!data.startsWith("ERROR:")) res(data);
				else rej(data);
			}
		});
	}
}

module.exports = SexDB;
