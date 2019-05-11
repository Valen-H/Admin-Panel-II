"use strict";


/**
 * IMPL: start/stop webserv
 */


import * as vserv from "vale-server-ii";
import socket from "socket.io";
import * as readline from "readline";
import * as path from "path";
import * as fs from "fs-extra";
import * as util from "util";
import { AssertionError } from 'assert';
import Socket from './socket';

export var chalk: Function;

try {
	chalk = require("chalk");
} catch (opt) {
	chalk = function chalk(string) {
		return string;
	};
}


export module Classes {
	
	export declare namespace Options {
		
		export interface PanelOpts {
			auth: string;
			subopts?: vserv.Classes.Options.ServerOptions;
			sockopts?: socket.ServerOptions;
		} //PanelOpts

		export interface CommandOpts {
			name: string;
			exp: RegExp;
			desc: string;
			usage: string;
			_priority: number;
			_compl: string;
			_domain: Types.DOMAINS;
		} //CommandOpts
		
	} //Options

	export declare namespace Types {

		export enum DOMAINS {
			CLI, WS, WEBDAV, UI  //console, websockets, url, inapp ui text-area
		} //DOMAINS

	} //Types

	export namespace Errors {
		export const ENORL = new ReferenceError("No suitable readline interface.");
		export const EALRRL = new AssertionError({ message: "readline interface already exists."});
	} //Errors
	

	export class Command implements Options.CommandOpts {
		name: string;
		exp: RegExp;
		desc: string;
		usage: string;
		_priority: number = 0;
		_compl: string;
		_domain: Types.DOMAINS;

		static prefix: string = "\\.";  //to be inc'd in regex

		constructor(ctor: Options.CommandOpts) {
			Object.assign(this, ctor);
		} //ctor

		//@Override
		async body(...params: any[]) {

		} //body

		//@Override
		parse(line: string, panel: Panel) {

			return this.body();
		} //parse

	} //Command

	export class Panel extends require("events").EventEmitter {
		
		rl: readline.Interface;
		_rl_paused: boolean = false;
		serv: vserv.Classes.Server;
		sock: socket.Server;
		opts: Options.PanelOpts;
		cmds: Command[] = [ ];
		_debuglog: string = "";
		refresh: boolean = true;
		custping: number = 1000;

		static defaultOpts: Options.PanelOpts = {
			subopts: {
				port: 9999,
				root: "/panel",
				serveDir: path.resolve("__Server")
			},
			sockopts: {
				path: "/ws",
				pingInterval: 10000,
				serveClient: true
			},
			auth: "admin:adm"
		};
		
		constructor(opts: Options.PanelOpts = Panel.defaultOpts) {
			super();
			let nopts: Options.PanelOpts = <Options.PanelOpts>{};
			
			Object.assign(nopts, Panel.defaultOpts);
			Object.assign(nopts, opts);

			this.opts = nopts;
		} //ctor
		
		async start(opts: vserv.Classes.Options.ServerOptions = this.opts.subopts) {
			this.serv = await vserv.Server.setup(opts);
			this.sock = socket(this.serv.httpsrv, this.opts.sockopts);

			Socket.setup(this.sock, this); //Mind the order!!
			await this.serv.bind();

			this.serv.data["auth"] = this.opts.auth;
			this.serv.data["parent"] = this;
			this._debug("Panel Started.");
			return this;
		} //start

		async cli({ input, output }) {
			if (!this.cmds.length) { await this._loadCLI(); }
			if (this.rl) throw Errors.EALRRL;

			let completer = (async function completer(line: string, cb) {
				const completions = this.cmds.map((cmd: Command) => cmd._compl),
					hits = completions.filter((c: string) => c.startsWith(line));
				
				return cb(null, [hits.length ? hits : completions, line]);
			}).bind(this); //completer

			let rl: readline.Interface = readline.createInterface({
				input, output, completer
			});

			rl.on("line", async line => {
				if (this.sock) this.sock.of("/admin").in("admin").emit("cli", "> " + util.inspect(line));
				let dat;
				try {
					console.log(dat = util.inspect(await this.cmds.find(cmd => cmd.exp.test(line)).parse(line, this), true));
				} catch (err) {
					console.error(dat = chalk["red"](util.inspect(err)));
				}
				if (this.sock) this.sock.of("/admin").in("admin").emit("cli", util.inspect(dat, {
					colors: false
				}));
			});
			rl.on("pause", () => {
				this._rl_paused = true;
				this._debug("RL paused");
			});
			rl.on("resume", () => {
				this._rl_paused = false;
				this._debug("RL resumed");
			});

			return this.rl = rl;
		} //cli

		toggleCLI(state?: boolean) {
			if (this.rl && state === undefined) {
				if (this._rl_paused) {
					this.rl.resume();
				} else {
					this.rl.pause();
				}
			} else if (this.rl) {
				if (state) {
					this.rl.resume();
				} else {
					this.rl.pause();
				}
			} else {
				throw Errors.ENORL;
			}

			return this;
		} //toggleCLI

		async _loadCLI(from: string = path.join("__Server", "commands")) {
			return new Promise((res, rej) => {
				fs.readdir(from, (err, files) => {
					if (!err) {
						for (let file of files) {
							let frm: string;
							try {
								delete require.cache[require.resolve(frm = path.resolve('.' + path.sep + path.join(from, file)))];
							} catch (ign) { }
							this.cmds.push(require(frm).command);
						}

						this.cmds.sort((a, b) => a._priority - b._priority);
						this._debug(`Loading CLI commands from '${from}' succeeded.`);
						res(this.cmds);
					} else {
						rej(err);
						this._debug(`Loading CLI commands from '${from}' failed.`);
					}
				});
			});
		} //_loadCLI

		_debug(...msg: any[]) {
			this._debuglog += msg.join(' ') + "  ---  " + Date() + '\n';
			this.emit("_debug", ...msg);
			return this;
		} //_debug
		
	} //Panel

	export class Stats {

		constructor() {

		} //ctor

	} //Stats
	
} //Classes

export default Classes;
