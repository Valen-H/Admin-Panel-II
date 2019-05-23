"use strict";

/*
 * IMPL: start/stop webserv
 */

import socket from "socket.io";
import Socket from './socket';
import * as vserv from "vale-server-ii";
import { AssertionError } from "assert";
import { EventEmitter } from "events";
import * as readline from "readline";
import * as path from "path";
import * as fs from "fs-extra";
import * as util from "util";
import * as os from "os";
import * as stream from "stream";

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
		
		/**
		 * Options for Classes.Panel
		 * 
		 * @author V. H.
		 * @date 2019-05-12
		 * @export
		 * @interface PanelOpts
		 */
		export interface PanelOpts {
			auth: string;
			_serveDir: string;
			subopts?: vserv.Classes.Options.ServerOptions;
			sockopts?: socket.ServerOptions;
		} //PanelOpts

		/**
		 * Options for Classes.Command
		 * 
		 * @author V. H.
		 * @date 2019-05-12
		 * @export
		 * @interface CommandOpts
		 */
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

		/**
		 * Obsolete.
		 * 
		 * @export
		 * @enum {number}
		 */
		export enum DOMAINS {  //OBS
			CLI, WS, WEBDAV, UI  //console, websockets, url, inapp ui text-area
		} //DOMAINS

	} //Types

	export namespace Errors {  //Update
		export const ENORL = new ReferenceError("No suitable readline interface.");
		export const EALRRL = new AssertionError({ message: "readline interface already exists." });
		export const EALRLIS = new AssertionError({ message: "Already listening."});
	} //Errors

	type SnapReg = {
		rss: number;
		th: number;
		uh: number;
		ext: number;

		mem: number;  //freemem/totalmem

		us: NodeJS.CpuUsage;
	};

	export const Null: Symbol = Symbol("NULL");
	
	
	/**
	 * For CLI commands.
	 * 
	 * @author V. H.
	 * @date 2019-05-12
	 * @export
	 * @class Command
	 * @implements {Options.CommandOpts}
	 */
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
		async body(...params: any[]): Promise<any> {

		} //body

		//@Override
		parse(line: string, panel: Panel): any {

			return this.body();
		} //parse

	} //Command

	/**
	 * Starting Interface.
	 * 
	 * @author V. H.
	 * @date 2019-05-12
	 * @export
	 * @class Panel
	 * @extends {EventEmitter}
	 */
	export class Panel extends EventEmitter {
		
		rl: readline.Interface;
		_rl_paused: boolean = false;
		serv: vserv.Classes.Server;
		sock: socket.Server;
		opts: Options.PanelOpts;
		cmds: Command[] = [ ];
		_debuglog: string = "";
		_rllog: string = "";
		refresh: boolean = true;
		custping: number = 1000;
		stat: boolean = false;
		_stats: NodeJS.Timeout;
		stater: Stats = new Stats;
		_input: stream.Duplex;
		_output: stream.Duplex;
		_error: stream.Writable = process.stderr;
		

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
			auth: "admin:adm",
			_serveDir: path.resolve(path.resolve(__dirname, "..", ".."), "__Server")
		};
		
		constructor(opts: Options.PanelOpts = Panel.defaultOpts) {
			super();
			let nopts: Options.PanelOpts = <Options.PanelOpts>{};
			
			Object.assign(nopts, Panel.defaultOpts);
			Object.assign(nopts, opts);

			this.opts = nopts;
		} //ctor
		
		/**
		 * Start the server and socket.
		 * 
		 * @author V. H.
		 * @date 2019-05-12
		 * @param {vserv.Classes.Options.ServerOptions} [opts=this.opts.subopts]
		 * @returns this
		 * @memberof Panel
		 */
		async start(opts: vserv.Classes.Options.ServerOptions = this.opts.subopts) {
			if (this.serv && this.serv.httpsrv.listening) throw Errors.EALRLIS;

			this.serv = await vserv.Server.setup(opts);
			this.sock = socket(this.serv.httpsrv, this.opts.sockopts);

			Socket.setup(this.sock, this); //Mind the order!!
			await this.serv.bind();

			this.serv.data["auth"] = this.opts.auth;
			this.serv.data["parent"] = this;
			this._debug("Panel Started.");
			return this;
		} //start

		/**
		 * Start a readline.Interface
		 * 
		 * @author V. H.
		 * @date 2019-05-12
		 * @param {*} { input, output }
		 * @returns readline.Interface
		 * @memberof Panel
		 */
		async cli({ input, output }: any) {
			if (!this.cmds.length) { await this._loadCLI(); }
			if (this.rl) throw Errors.EALRRL;

			this._output = output;
			this._input = input;
			
			let completer = (async function completer(line: string, cb) {
				const completions = this.cmds.map((cmd: Command) => cmd._compl),
					hits = completions.filter((c: string) => c.startsWith(line));
				
				return cb(null, [hits.length ? hits : completions, line]);
			}).bind(this); //completer

			let rl: readline.Interface = readline.createInterface({
				input, output, completer
			});

			rl.on("line", async line => {
				line = line.trim();

				let tmp: string,
					dat: any;
				
				if (this.sock) this.sock.of("/admin").in("admin").emit("cli", tmp = ("> " + util.inspect(line, { colors: false })));
				this._rllog += tmp + "  ---  " + Date() + os.EOL;
				
				try {
					dat = await this.cmds.find(cmd => cmd.exp.test(line)).parse(line, this);
					if (dat !== Null) console.log(dat = util.inspect(dat, true));
				} catch (err) {
					console.error(dat = chalk["red"](util.inspect(err)));
				}
				
				if (this.sock && dat !== Null) this.sock.of("/admin").in("admin").emit("cli", tmp = util.inspect(dat, { colors: false }));
				
				this._rllog += tmp + "  ---  " + Date() + os.EOL;
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

		/**
		 * Toggle readline.Interface
		 * 
		 * @author V. H.
		 * @date 2019-05-12
		 * @param {boolean} [state]
		 * @returns 
		 * @memberof Panel
		 */
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

		/**
		 * Toggle Stater.
		 * 
		 * @author V. H.
		 * @date 2019-05-12
		 * @param {boolean} [force]
		 * @param {number} [ms]
		 * @returns this
		 * @memberof Panel
		 */
		toggleStats(force?: boolean, ms?: number) {
			if (force !== undefined) {
				if (this.stat = force) {
					this._stats = this.stater._bind(ms);
					this._debug("Stating started.");
				} else {
					clearInterval(this._stats);
					this._debug("Stating stopped.");
				}
			} else {
				this.stat = !this.stat;
				if (this.stat) {
					this._stats = this.stater._bind(ms);
					this._debug("Stating started.");
				} else {
					clearInterval(this._stats);
					this._debug("Stating stopped.");
				}
			}

			return this;
		} //toggleStats

		/**
		 * Load CLI commands.
		 * 
		 * @author V. H.
		 * @date 2019-05-12
		 * @param {string} [from=path.join("__Server", "commands")]
		 * @returns this.cmds
		 * @memberof Panel
		 */
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

		/**
		 * Write to _debuglog
		 * 
		 * @author V. H.
		 * @date 2019-05-12
		 * @param {...any[]} msg
		 * @returns 
		 * @memberof Panel
		 */
		_debug(...msg: any[]) {
			this._debuglog += msg.join(' ') + "  ---  " + Date() + os.EOL;
			this.emit("_debug", ...msg);
			return this;
		} //_debug
		
	} //Panel

	/**
	 * Stater Class for metrics.
	 * 
	 * @author V. H.
	 * @date 2019-05-12
	 * @export
	 * @class Stats
	 * @extends {EventEmitter}
	 */
	export class Stats extends EventEmitter {

		keepSamples: number = 100;
		_prevc = process.cpuUsage();
		samples: SnapReg[] = [ ];
		bound: boolean;

		constructor() {
			super();
		} //ctor

		/**
		 * Take a metric snapshot.
		 * 
		 * @author V. H.
		 * @date 2019-05-12
		 * @returns {SnapReg}
		 * @memberof Stats
		 */
		snap(): SnapReg {
			this._prevc = process.cpuUsage(this._prevc);
			let mem = process.memoryUsage(),
				reg: SnapReg = {
					rss: mem.rss,
					th: mem.heapTotal,
					uh: mem.heapUsed,
					ext: mem.external,
					us: this._prevc,
					mem: os.freemem()
				};
			this.samples.push(reg);
			if (this.samples.length > this.keepSamples) {
				this.samples.shift();
			}
			this.emit("snap", reg);
			return reg;
		} //snap

		/**
		 * setInterval for metrics.
		 * 
		 * @author V. H.
		 * @date 2019-05-12
		 * @param {number} [ms=1000]
		 * @returns NodeJS.Timeout
		 * @memberof Stats
		 */
		_bind(ms: number = 1000) {
			if (!this.bound) {
				return setInterval(this.snap.bind(this), ms);
			}
		} //_bind

	} //Stats
	
} //Classes

export default Classes;
