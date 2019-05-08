"use strict";

import Classes from './Classes';

export module Socket {

	export function setup(io: SocketIO.Server, panel: Classes.Panel) {
		let admin = io.of("/admin");

		admin.on("connection", socket => {
			if (panel._debug) {
				panel.serv._debug(socket.id + " connected.");
			}

			socket.join("admin", err => {
				if (!err) socket.emit("joined", "admin");
			});
			socket.on("error", err => {
				if (panel._debug) panel.serv._debug(err);
			});
			socket.once("disconnecting", reason => {
				if (panel._debug) panel.serv._debug(socket.id + " disconnecting  " + reason);
			});
			socket.once("disconnected", reason => {
				if (panel._debug) panel.serv._debug(socket.id + " disconnected  " + reason);
			});
		});
	} //setup

} //Socket

export default Socket;

