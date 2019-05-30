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

export var chalk: Function;

try {
	chalk = require("chalk");
} catch (opt) {
	chalk = function chalk(string: string): string {
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
			readonly auth: string;
			readonly _serveDir?: string;
			readonly subopts?: vserv.Classes.Options.ServerOptions;
			readonly sockopts?: socket.ServerOptions;
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
			readonly name: string;
			readonly exp: RegExp;
			readonly desc?: string;
			readonly usage?: string;
			readonly _priority: number;
			readonly _compl: string;
			readonly _domain?: Types.DOMAINS;
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
		export const ENORL: ReferenceError = new ReferenceError("No suitable readline interface.");
		export const EALRRL: AssertionError = new AssertionError({ message: "readline interface already exists." });
		export const EALRLIS: AssertionError = new AssertionError({ message: "Already listening."});
	} //Errors

	export type SnapReg = {
		readonly rss: number;
		readonly th: number;
		readonly uh: number;
		readonly ext: number;

		readonly mem: number;  //freemem/totalmem

		readonly us: NodeJS.CpuUsage;
	};

	export const Null: symbol = Symbol("NULL");
	
	
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
		desc?: string;
		usage?: string;
		_priority: number = 0;
		_compl: string;
		_domain?: Types.DOMAINS;

		public static prefix: string = "\\.";  //to be inc'd in regex

		public constructor(ctor: Options.CommandOpts) {
			Object.assign(this, ctor);
		} //ctor

		//@Override
		/**
		 * @description Execute command code.
		 * @author V. H.
		 * @date 2019-05-30
		 * @param {...any[]} params
		 * @returns {Promise<any>}
		 * @memberof Command
		 * @override
		 */
		public async body(...params: any[]): Promise<any> {

		} //body

		//@Override
		/**
		 * @description Sanitize before calling `body`
		 * @author V. H.
		 * @date 2019-05-30
		 * @param {string} line
		 * @param {Panel} panel
		 * @returns {*}
		 * @memberof Command
		 * @override
		 */
		public parse(line: string, panel: Panel): any {

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
		private _rl_paused: boolean = false;
		serv: vserv.Classes.Server;
		sock: socket.Server;
		opts: Options.PanelOpts;
		cmds: Command[] = [ ];
		_debuglog: string = "";
		_rllog: string = "";
		refresh: boolean = true;
		custping: number = 1000;
		stat: boolean = false;
		private _stats: NodeJS.Timeout;
		readonly stater: Stats = new Stats;
		_input: NodeJS.ReadStream = process.stdin;
		_output: NodeJS.WriteStream = process.stdout;
		_error: NodeJS.WriteStream = process.stderr;
		

		public static defaultOpts: Options.PanelOpts = {
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
		
		public constructor(opts: Options.PanelOpts = Panel.defaultOpts) {
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
		public async start(opts: vserv.Classes.Options.ServerOptions = this.opts.subopts): Promise<this> {
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
		public async cli({ input, output }: { input: NodeJS.ReadStream, output: NodeJS.WriteStream, error: NodeJS.WriteStream}) {
			if (!this.cmds.length) { await this._loadCLI(); }
			if (this.rl) throw Errors.EALRRL;

			this._output = output;
			this._input = input;
			
			let completer: readline.AsyncCompleter = (async function completer(line: string, cb: (err?: Error, result?: [string[], string]) => void): Promise<any> {
				const completions: string[] = this.cmds.map((cmd: Command) => cmd._compl),
					hits: string[] = completions.filter((c: string): boolean => c.startsWith(line));
				
				return cb(null, [hits.length ? hits : completions, line]);
			}).bind(this); //completer

			let rl: readline.Interface = readline.createInterface({
				input, output, completer
			});

			rl.on("line", async (line: string): Promise<void> => {
				line = line.trim();

				let tmp: string,
					dat: any;
				
				if (this.sock) this.sock.of("/admin").in("admin").emit("cli", tmp = ("> " + util.inspect(line, { colors: false })));
				this._rllog += tmp + "  ---  " + Date() + os.EOL;
				
				try {
					dat = await this.cmds.find((cmd: Command): boolean => cmd.exp.test(line)).parse(line, this);
					if (dat !== Null) console.log(dat = util.inspect(dat, true));
				} catch (err) {
					console.error(dat = chalk["red"](util.inspect(err)));
				}
				
				if (this.sock && dat !== Null) this.sock.of("/admin").in("admin").emit("cli", tmp = util.inspect(dat, { colors: false }));
				
				this._rllog += tmp + "  ---  " + Date() + os.EOL;
			});
			rl.on("pause", (): void => {
				this._rl_paused = true;
				this._debug("RL paused");
			});
			rl.on("resume", (): void => {
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
		public toggleCLI(state?: boolean): this {
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
		public toggleStats(force?: boolean, ms?: number): this {
			if (force !== undefined) {
				if (this.stat = force) {
					this._stats = this.stater._bind(ms);
					this._debug("Stating started.");
				} else {
					clearInterval(this._stats);
					this._debug("Stating stopped.");
				}
			} else {
				if (this.stat = !this.stat) {
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
		async _loadCLI(from: string = path.join("__Server", "commands")): Promise<Command[]> {
			return new Promise((res: (value?: Command[] | PromiseLike<Command[]>) => void, rej: (reason?: any) => void): void => {
				fs.readdir(from, (err: Error, files: string[]): void => {
					if (!err) {
						for (let file of files) {
							let frm: string;

							try {
								delete require.cache[require.resolve(frm = path.resolve('.' + path.sep + path.join(from, file)))];
							} catch (ign) { }

							this.cmds.push(require(frm).command);
						}

						this.cmds.sort((a: Command, b: Command): number => a._priority - b._priority);
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
		_debug(...msg: any[]): this {
			this._debuglog += msg.join(' ') + "  ---  " + Date() + os.EOL;
			this.emit("_debug", ...msg);
			return this;
		} //_debug

		//@Override
		public on(event: "_debug", listener: (...args: any[]) => void): this;
		//@Override
		public on(event: string | symbol, listener: (...args: any[]) => void): this {
			return super.on(event, listener);
		} //on
		//@Override
		public once(event: "_debug", listener: (...args: any[]) => void): this;
		//@Override
		public once(event: string | symbol, listener: (...args: any[]) => void): this {
			return super.once(event, listener);
		} //on
		
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
		private _prevc: NodeJS.CpuUsage = process.cpuUsage();
		samples: SnapReg[] = [ ];
		private bound: boolean;

		public constructor() {
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
		public snap(): SnapReg {
			this._prevc = process.cpuUsage(this._prevc);
			let mem: NodeJS.MemoryUsage = process.memoryUsage(),
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
		_bind(ms: number = 1000): NodeJS.Timeout {
			if (!this.bound) {
				this.bound = true;
				return setInterval(this.snap.bind(this), ms);
			}
		} //_bind

		//@Override
		public on(event: "snap", listener: (...args: any[]) => void): this;
		//@Override
		public on(event: string | symbol, listener: (...args: any[]) => void): this {
			return super.on(event, listener);
		} //on
		//@Override
		public once(event: "snap", listener: (...args: any[]) => void): this;
		//@Override
		public once(event: string | symbol, listener: (...args: any[]) => void): this {
			return super.once(event, listener);
		} //on

	} //Stats
	
} //Classes

export default Classes;
