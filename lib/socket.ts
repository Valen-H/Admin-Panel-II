"use strict";

import Classes from './Classes';

export module Socket {

	export function setup(io: SocketIO.Server, panel: Classes.Panel) {
		let admin = io.of("/admin"),
			login: boolean = false,
			ladm: SocketIO.Socket;

		panel.on("_debug", (...data: any[]) => {
			if (ladm) ladm.emit("_debug", ...data);
		});
		panel.serv.on("_debug", (...data: any[]) => {
			if (ladm) ladm.emit("_s_debug", ...data);
		});
		
		admin.on("connect", socket => {
			panel._debug(socket.id + " connected.");
			socket.once("disconnecting", reason => {
				panel._debug(socket.id + " disconnecting  " + reason);
				login = false;
			});

			if (!login) {
				socket.join("admin", err => {
					if (!err) {
						socket.emit("joined", "admin");
						panel._debug(`${socket.id} is admin.`);
						login = true;
						ladm = socket;
					}
				});
				socket.on("error", err => {
					panel._debug(err);
				});
				socket.on("command", async (name, ...params) => {
					params = params.map(param => param === "$panel$" ? panel : param);
					panel._debug(`Command:  ${name} ${params.slice(0, params.length - 1).join(' ')}  -->`);
					let out = await panel.cmds.find(cmd => cmd.name === name).body(...params);
					panel._debug(`  ${out}`);
					params[params.length - 1](out);
				});
			} else {
				socket.disconnect(true);
			}
		});

		return admin;
	} //setup

} //Socket

export default Socket;
