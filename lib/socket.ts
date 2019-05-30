"use strict";

import Classes from './Classes';
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";

export module Socket {

	/**
	 * Wrapper for setting up the Socket.
	 * 
	 * @author V. H.
	 * @date 2019-05-12
	 * @export
	 * @param {SocketIO.Server} io
	 * @param {Classes.Panel} panel
	 * @returns {SocketIO.Namespace}
	 */
	export function setup(io: SocketIO.Server, panel: Classes.Panel): SocketIO.Namespace {
		let admin: SocketIO.Namespace = io.of("/admin"),
			login: boolean = false,
			ladm: SocketIO.Socket;

		panel.on("_debug", async (...data: any[]): Promise<void> => {
			if (ladm) ladm.emit("_debug", ...data);
		});
		panel.serv.on("_debug", async (...data: any[]): Promise<void> => {
			if (ladm) ladm.emit("_s_debug", ...data);
		});
		panel.stater.on("snap", async (reg: Classes.SnapReg): Promise<void> => {
			if (ladm) ladm.emit("snap", reg);
		});
		if (panel.refresh) {
			let ends: Set<string> = new Set([
				".htm",
				".html",
				".htmx",
				".htmlx",
				".js",
				".xjs",
				".css",
				".cssx"
			]);

			fs.watch(path.join(panel.serv.opts.serveDir, panel.serv.opts.public), {
				recursive: true
			}, (evt: string, file: string): void => {
				if (panel.refresh && Array.from(ends.values()).some(end => file.endsWith(end))) {
					panel._debug("Refreshing...");
					admin.emit("refresh");
				}
			});
		}
		
		admin.on("connect", async (socket: SocketIO.Socket): Promise<void> => {
			panel._debug(socket.id + " connected.");
			socket.once("disconnecting", async (reason: string): Promise<void> => {
				panel._debug(socket.id + " disconnecting  " + reason);
				login = false;
			});

			if (!login) {  //user already inside and pass changed?? vulnerable
				socket.join("admin", async (err: Error): Promise<void> => {
					if (!err) {
						socket.emit("_debug", panel._debuglog);
						socket.emit("_s_debug", panel.serv._debuglog);
						socket.emit("cli", panel._rllog);

						for (let snap of panel.stater.samples) {
							socket.emit("snap", snap);
						}

						socket.emit("joined", "admin");
						panel._debug(`${socket.id} is admin.`);
						login = true;
						ladm = socket;

						socket.emit("stat", "arch", os.arch());
						socket.emit("stat", "cpus", os.cpus().length);
						socket.emit("stat", "endian", os.endianness());
						socket.emit("stat", "platform", os.platform());
						socket.emit("stat", "release", os.release());
						socket.emit("stat", "type", os.type());
						socket.emit("stat", "version", process.version);

						let prev1: NodeJS.CpuUsage = process.cpuUsage();

						async function tick() {
							let mem: NodeJS.MemoryUsage = process.memoryUsage();
							prev1 = process.cpuUsage(prev1);

							socket.emit("stat", "freemem", Math.round((os.freemem() / 1024 / 1024 / 1024) * 100) / 100);
							socket.emit("stat", "totalmem", Math.round((os.totalmem() / 1024 / 1024 / 1024) * 100) / 100);
							socket.emit("stat", "priority", os.getPriority());
							socket.emit("stat", "home", os.homedir());
							socket.emit("stat", "host", os.hostname());
							socket.emit("stat", "tmp", os.tmpdir());
							socket.emit("stat", "up", Math.round(os.uptime() / 6) / 10);
							socket.emit("stat", "pup", Math.round(process.uptime() / 6) / 10);
							socket.emit("stat", "cpuus", process.cpuUsage().user / 1000);  //micro -> milli
							socket.emit("stat", "cpuusp", prev1.user / 1000);
							socket.emit("stat", "cpusy", process.cpuUsage().system / 1000);
							socket.emit("stat", "cpusyp", prev1.system / 1000);
							socket.emit("stat", "cwd", process.cwd());
							socket.emit("stat", "rss", Math.round(100 * mem.rss / 1024 / 1024) / 100);
							socket.emit("stat", "total1", Math.round(100 * mem.heapTotal / 1024 / 1024) / 100);
							socket.emit("stat", "used1", Math.round(100 * mem.heapUsed / 1024 / 1024) / 100);
							socket.emit("stat", "ext", Math.round(100 * mem.external / 1024 / 1024) / 100);
							socket.emit("stat", "title", process.title);
							socket.emit("stat", "port", process.debugPort);
							return tick;
						} //tick

						setInterval(await tick(), panel.custping);
					}
				});
				socket.on("error", async (err: Error): Promise<void> => {
					panel._debug(err);
				});
				socket.on("command", async (name: string, ...params: any[]): Promise<void> => {
					params = params.map((param: string): string | Classes.Panel => param === "$panel$" ? panel : param);
					panel._debug(`Command:  ${name} ${params.slice(0, params.length - 1).join(' ')}  -->`);
					let out = await panel.cmds.find((cmd: Classes.Command): boolean => cmd.name === name).body(...params);
					panel._debug(`  ${out}`);
					params[params.length - 1](out);
				});
				socket.on("cli", async (comm: string): Promise<void> => panel.rl.write(comm + os.EOL));
			} else {
				socket.disconnect(true);
			}
		});

		return admin;
	} //setup

} //Socket

export default Socket;
