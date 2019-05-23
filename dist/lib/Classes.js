"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * IMPL: start/stop webserv
 */
const socket_io_1 = tslib_1.__importDefault(require("socket.io"));
const socket_1 = tslib_1.__importDefault(require("./socket"));
const vserv = tslib_1.__importStar(require("vale-server-ii"));
const assert_1 = require("assert");
const events_1 = require("events");
const readline = tslib_1.__importStar(require("readline"));
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs-extra"));
const util = tslib_1.__importStar(require("util"));
const os = tslib_1.__importStar(require("os"));
try {
    exports.chalk = require("chalk");
}
catch (opt) {
    exports.chalk = function chalk(string) {
        return string;
    };
}
var Classes;
(function (Classes) {
    let Errors;
    (function (Errors) {
        Errors.ENORL = new ReferenceError("No suitable readline interface.");
        Errors.EALRRL = new assert_1.AssertionError({ message: "readline interface already exists." });
        Errors.EALRLIS = new assert_1.AssertionError({ message: "Already listening." });
    })(Errors = Classes.Errors || (Classes.Errors = {})); //Errors
    Classes.Null = Symbol("NULL");
    /**
     * For CLI commands.
     *
     * @author V. H.
     * @date 2019-05-12
     * @export
     * @class Command
     * @implements {Options.CommandOpts}
     */
    class Command {
        constructor(ctor) {
            this._priority = 0;
            Object.assign(this, ctor);
        } //ctor
        //@Override
        async body(...params) {
        } //body
        //@Override
        parse(line, panel) {
            return this.body();
        } //parse
    } //Command
    Command.prefix = "\\."; //to be inc'd in regex
    Classes.Command = Command;
    /**
     * Starting Interface.
     *
     * @author V. H.
     * @date 2019-05-12
     * @export
     * @class Panel
     * @extends {EventEmitter}
     */
    class Panel extends events_1.EventEmitter {
        constructor(opts = Panel.defaultOpts) {
            super();
            this._rl_paused = false;
            this.cmds = [];
            this._debuglog = "";
            this._rllog = "";
            this.refresh = true;
            this.custping = 1000;
            this.stat = false;
            this.stater = new Stats;
            this._error = process.stderr;
            let nopts = {};
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
        async start(opts = this.opts.subopts) {
            if (this.serv && this.serv.httpsrv.listening)
                throw Errors.EALRLIS;
            this.serv = await vserv.Server.setup(opts);
            this.sock = socket_io_1.default(this.serv.httpsrv, this.opts.sockopts);
            socket_1.default.setup(this.sock, this); //Mind the order!!
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
        async cli({ input, output }) {
            if (!this.cmds.length) {
                await this._loadCLI();
            }
            if (this.rl)
                throw Errors.EALRRL;
            this._output = output;
            this._input = input;
            let completer = (async function completer(line, cb) {
                const completions = this.cmds.map((cmd) => cmd._compl), hits = completions.filter((c) => c.startsWith(line));
                return cb(null, [hits.length ? hits : completions, line]);
            }).bind(this); //completer
            let rl = readline.createInterface({
                input, output, completer
            });
            rl.on("line", async (line) => {
                line = line.trim();
                let tmp, dat;
                if (this.sock)
                    this.sock.of("/admin").in("admin").emit("cli", tmp = ("> " + util.inspect(line, { colors: false })));
                this._rllog += tmp + "  ---  " + Date() + os.EOL;
                try {
                    dat = await this.cmds.find(cmd => cmd.exp.test(line)).parse(line, this);
                    if (dat !== Classes.Null)
                        console.log(dat = util.inspect(dat, true));
                }
                catch (err) {
                    console.error(dat = exports.chalk["red"](util.inspect(err)));
                }
                if (this.sock && dat !== Classes.Null)
                    this.sock.of("/admin").in("admin").emit("cli", tmp = util.inspect(dat, { colors: false }));
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
        toggleCLI(state) {
            if (this.rl && state === undefined) {
                if (this._rl_paused) {
                    this.rl.resume();
                }
                else {
                    this.rl.pause();
                }
            }
            else if (this.rl) {
                if (state) {
                    this.rl.resume();
                }
                else {
                    this.rl.pause();
                }
            }
            else {
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
        toggleStats(force, ms) {
            if (force !== undefined) {
                if (this.stat = force) {
                    this._stats = this.stater._bind(ms);
                    this._debug("Stating started.");
                }
                else {
                    clearInterval(this._stats);
                    this._debug("Stating stopped.");
                }
            }
            else {
                this.stat = !this.stat;
                if (this.stat) {
                    this._stats = this.stater._bind(ms);
                    this._debug("Stating started.");
                }
                else {
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
        async _loadCLI(from = path.join("__Server", "commands")) {
            return new Promise((res, rej) => {
                fs.readdir(from, (err, files) => {
                    if (!err) {
                        for (let file of files) {
                            let frm;
                            try {
                                delete require.cache[require.resolve(frm = path.resolve('.' + path.sep + path.join(from, file)))];
                            }
                            catch (ign) { }
                            this.cmds.push(require(frm).command);
                        }
                        this.cmds.sort((a, b) => a._priority - b._priority);
                        this._debug(`Loading CLI commands from '${from}' succeeded.`);
                        res(this.cmds);
                    }
                    else {
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
        _debug(...msg) {
            this._debuglog += msg.join(' ') + "  ---  " + Date() + os.EOL;
            this.emit("_debug", ...msg);
            return this;
        } //_debug
    } //Panel
    Panel.defaultOpts = {
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
    Classes.Panel = Panel;
    /**
     * Stater Class for metrics.
     *
     * @author V. H.
     * @date 2019-05-12
     * @export
     * @class Stats
     * @extends {EventEmitter}
     */
    class Stats extends events_1.EventEmitter {
        constructor() {
            super();
            this.keepSamples = 100;
            this._prevc = process.cpuUsage();
            this.samples = [];
        } //ctor
        /**
         * Take a metric snapshot.
         *
         * @author V. H.
         * @date 2019-05-12
         * @returns {SnapReg}
         * @memberof Stats
         */
        snap() {
            this._prevc = process.cpuUsage(this._prevc);
            let mem = process.memoryUsage(), reg = {
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
        _bind(ms = 1000) {
            if (!this.bound) {
                return setInterval(this.snap.bind(this), ms);
            }
        } //_bind
    } //Stats
    Classes.Stats = Stats;
})(Classes = exports.Classes || (exports.Classes = {})); //Classes
exports.default = Classes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3Nlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9DbGFzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBRWI7O0dBRUc7QUFFSCxrRUFBK0I7QUFDL0IsOERBQThCO0FBQzlCLDhEQUF3QztBQUN4QyxtQ0FBd0M7QUFDeEMsbUNBQXNDO0FBQ3RDLDJEQUFxQztBQUNyQyxtREFBNkI7QUFDN0IscURBQStCO0FBQy9CLG1EQUE2QjtBQUM3QiwrQ0FBeUI7QUFLekIsSUFBSTtJQUNILGFBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Q0FDekI7QUFBQyxPQUFPLEdBQUcsRUFBRTtJQUNiLGFBQUssR0FBRyxTQUFTLEtBQUssQ0FBQyxNQUFNO1FBQzVCLE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyxDQUFDO0NBQ0Y7QUFHRCxJQUFjLE9BQU8sQ0FzYXBCO0FBdGFELFdBQWMsT0FBTztJQXFEcEIsSUFBaUIsTUFBTSxDQUl0QjtJQUpELFdBQWlCLE1BQU07UUFDVCxZQUFLLEdBQUcsSUFBSSxjQUFjLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUM5RCxhQUFNLEdBQUcsSUFBSSx1QkFBYyxDQUFDLEVBQUUsT0FBTyxFQUFFLG9DQUFvQyxFQUFFLENBQUMsQ0FBQztRQUMvRSxjQUFPLEdBQUcsSUFBSSx1QkFBYyxDQUFDLEVBQUUsT0FBTyxFQUFFLG9CQUFvQixFQUFDLENBQUMsQ0FBQztJQUM3RSxDQUFDLEVBSmdCLE1BQU0sR0FBTixjQUFNLEtBQU4sY0FBTSxRQUl0QixDQUFDLFFBQVE7SUFhRyxZQUFJLEdBQVcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRzNDOzs7Ozs7OztPQVFHO0lBQ0gsTUFBYSxPQUFPO1FBV25CLFlBQVksSUFBeUI7WUFOckMsY0FBUyxHQUFXLENBQUMsQ0FBQztZQU9yQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMs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Q0FBQztZQUN2QixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDckI7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN2QixPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUMsQ0FBQyxNQUFNO1FBRVI7Ozs7Ozs7O1dBUUc7UUFDSCxLQUFLLENBQUMsS0FBYSxJQUFJO1lBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNoQixPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUM3QztRQUNGLENBQUMsQ0FBQyxPQUFPO0tBRVQsQ0FBQyxPQUFPO0lBckRJLGFBQUssUUFxRGpCLENBQUE7QUFFRixDQUFDLEVBdGFhLE9BQU8sR0FBUCxlQUFPLEtBQVAsZUFBTyxRQXNhcEIsQ0FBQyxTQUFTO0FBRVgsa0JBQWUsT0FBTyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qXG4gKiBJTVBMOiBzdGFydC9zdG9wIHdlYnNlcnZcbiAqL1xuXG5pbXBvcnQgc29ja2V0IGZyb20gXCJzb2NrZXQuaW9cIjtcbmltcG9ydCBTb2NrZXQgZnJvbSAnLi9zb2NrZXQnO1xuaW1wb3J0ICogYXMgdnNlcnYgZnJvbSBcInZhbGUtc2VydmVyLWlpXCI7XG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCJldmVudHNcIjtcbmltcG9ydCAqIGFzIHJlYWRsaW5lIGZyb20gXCJyZWFkbGluZVwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzLWV4dHJhXCI7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gXCJ1dGlsXCI7XG5pbXBvcnQgKiBhcyBvcyBmcm9tIFwib3NcIjtcbmltcG9ydCAqIGFzIHN0cmVhbSBmcm9tIFwic3RyZWFtXCI7XG5cbmV4cG9ydCB2YXIgY2hhbGs6IEZ1bmN0aW9uO1xuXG50cnkge1xuXHRjaGFsayA9IHJlcXVpcmUoXCJjaGFsa1wiKTtcbn0gY2F0Y2ggKG9wdCkge1xuXHRjaGFsayA9IGZ1bmN0aW9uIGNoYWxrKHN0cmluZykge1xuXHRcdHJldHVybiBzdHJpbmc7XG5cdH07XG59XG5cblxuZXhwb3J0IG1vZHVsZSBDbGFzc2VzIHtcblx0XG5cdGV4cG9ydCBkZWNsYXJlIG5hbWVzcGFjZSBPcHRpb25zIHtcblx0XHRcblx0XHQvKipcblx0XHQgKiBPcHRpb25zIGZvciBDbGFzc2VzLlBhbmVsXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAZXhwb3J0XG5cdFx0ICogQGludGVyZmFjZSBQYW5lbE9wdHNcblx0XHQgKi9cblx0XHRleHBvcnQgaW50ZXJmYWNlIFBhbmVsT3B0cyB7XG5cdFx0XHRhdXRoOiBzdHJpbmc7XG5cdFx0XHRfc2VydmVEaXI6IHN0cmluZztcblx0XHRcdHN1Ym9wdHM/OiB2c2Vydi5DbGFzc2VzLk9wdGlvbnMuU2VydmVyT3B0aW9ucztcblx0XHRcdHNvY2tvcHRzPzogc29ja2V0LlNlcnZlck9wdGlvbnM7XG5cdFx0fSAvL1BhbmVsT3B0c1xuXG5cdFx0LyoqXG5cdFx0ICogT3B0aW9ucyBmb3IgQ2xhc3Nlcy5Db21tYW5kXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAZXhwb3J0XG5cdFx0ICogQGludGVyZmFjZSBDb21tYW5kT3B0c1xuXHRcdCAqL1xuXHRcdGV4cG9ydCBpbnRlcmZhY2UgQ29tbWFuZE9wdHMge1xuXHRcdFx0bmFtZTogc3RyaW5nO1xuXHRcdFx0ZXhwOiBSZWdFeHA7XG5cdFx0XHRkZXNjOiBzdHJpbmc7XG5cdFx0XHR1c2FnZTogc3RyaW5nO1xuXHRcdFx0X3ByaW9yaXR5OiBudW1iZXI7XG5cdFx0XHRfY29tcGw6IHN0cmluZztcblx0XHRcdF9kb21haW46IFR5cGVzLkRPTUFJTlM7XG5cdFx0fSAvL0NvbW1hbmRPcHRzXG5cdFx0XG5cdH0gLy9PcHRpb25zXG5cblx0ZXhwb3J0IGRlY2xhcmUgbmFtZXNwYWNlIFR5cGVzIHtcblxuXHRcdC8qKlxuXHRcdCAqIE9ic29sZXRlLlxuXHRcdCAqIFxuXHRcdCAqIEBleHBvcnRcblx0XHQgKiBAZW51bSB7bnVtYmVyfVxuXHRcdCAqL1xuXHRcdGV4cG9ydCBlbnVtIERPTUFJTlMgeyAgLy9PQlNcblx0XHRcdENMSSwgV1MsIFdFQkRBViwgVUkgIC8vY29uc29sZSwgd2Vic29ja2V0cywgdXJsLCBpbmFwcCB1aSB0ZXh0LWFyZWFcblx0XHR9IC8vRE9NQUlOU1xuXG5cdH0gLy9UeXBlc1xuXG5cdGV4cG9ydCBuYW1lc3BhY2UgRXJyb3JzIHsgIC8vVXBkYXRlXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1JMID0gbmV3IFJlZmVyZW5jZUVycm9yKFwiTm8gc3VpdGFibGUgcmVhZGxpbmUgaW50ZXJmYWNlLlwiKTtcblx0XHRleHBvcnQgY29uc3QgRUFMUlJMID0gbmV3IEFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogXCJyZWFkbGluZSBpbnRlcmZhY2UgYWxyZWFkeSBleGlzdHMuXCIgfSk7XG5cdFx0ZXhwb3J0IGNvbnN0IEVBTFJMSVMgPSBuZXcgQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBcIkFscmVhZHkgbGlzdGVuaW5nLlwifSk7XG5cdH0gLy9FcnJvcnNcblxuXHR0eXBlIFNuYXBSZWcgPSB7XG5cdFx0cnNzOiBudW1iZXI7XG5cdFx0dGg6IG51bWJlcjtcblx0XHR1aDogbnVtYmVyO1xuXHRcdGV4dDogbnVtYmVyO1xuXG5cdFx0bWVtOiBudW1iZXI7ICAvL2ZyZWVtZW0vdG90YWxtZW1cblxuXHRcdHVzOiBOb2RlSlMuQ3B1VXNhZ2U7XG5cdH07XG5cblx0ZXhwb3J0IGNvbnN0IE51bGw6IFN5bWJvbCA9IFN5bWJvbChcIk5VTExcIik7XG5cdFxuXHRcblx0LyoqXG5cdCAqIEZvciBDTEkgY29tbWFuZHMuXG5cdCAqIFxuXHQgKiBAYXV0aG9yIFYuIEguXG5cdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0ICogQGV4cG9ydFxuXHQgKiBAY2xhc3MgQ29tbWFuZFxuXHQgKiBAaW1wbGVtZW50cyB7T3B0aW9ucy5Db21tYW5kT3B0c31cblx0ICovXG5cdGV4cG9ydCBjbGFzcyBDb21tYW5kIGltcGxlbWVudHMgT3B0aW9ucy5Db21tYW5kT3B0cyB7XG5cdFx0bmFtZTogc3RyaW5nO1xuXHRcdGV4cDogUmVnRXhwO1xuXHRcdGRlc2M6IHN0cmluZztcblx0XHR1c2FnZTogc3RyaW5nO1xuXHRcdF9wcmlvcml0eTogbnVtYmVyID0gMDtcblx0XHRfY29tcGw6IHN0cmluZztcblx0XHRfZG9tYWluOiBUeXBlcy5ET01BSU5TO1xuXG5cdFx0c3RhdGljIHByZWZpeDogc3RyaW5nID0gXCJcXFxcLlwiOyAgLy90byBiZSBpbmMnZCBpbiByZWdleFxuXG5cdFx0Y29uc3RydWN0b3IoY3RvcjogT3B0aW9ucy5Db21tYW5kT3B0cykge1xuXHRcdFx0T2JqZWN0LmFzc2lnbih0aGlzLCBjdG9yKTtcblx0XHR9IC8vY3RvclxuXG5cdFx0Ly9AT3ZlcnJpZGVcblx0XHRhc3luYyBib2R5KC4uLnBhcmFtczogYW55W10pOiBQcm9taXNlPGFueT4ge1xuXG5cdFx0fSAvL2JvZHlcblxuXHRcdC8vQE92ZXJyaWRlXG5cdFx0cGFyc2UobGluZTogc3RyaW5nLCBwYW5lbDogUGFuZWwpOiBhbnkge1xuXG5cdFx0XHRyZXR1cm4gdGhpcy5ib2R5KCk7XG5cdFx0fSAvL3BhcnNlXG5cblx0fSAvL0NvbW1hbmRcblxuXHQvKipcblx0ICogU3RhcnRpbmcgSW50ZXJmYWNlLlxuXHQgKiBcblx0ICogQGF1dGhvciBWLiBILlxuXHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdCAqIEBleHBvcnRcblx0ICogQGNsYXNzIFBhbmVsXG5cdCAqIEBleHRlbmRzIHtFdmVudEVtaXR0ZXJ9XG5cdCAqL1xuXHRleHBvcnQgY2xhc3MgUGFuZWwgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXHRcdFxuXHRcdHJsOiByZWFkbGluZS5JbnRlcmZhY2U7XG5cdFx0X3JsX3BhdXNlZDogYm9vbGVhbiA9IGZhbHNlO1xuXHRcdHNlcnY6IHZzZXJ2LkNsYXNzZXMuU2VydmVyO1xuXHRcdHNvY2s6IHNvY2tldC5TZXJ2ZXI7XG5cdFx0b3B0czogT3B0aW9ucy5QYW5lbE9wdHM7XG5cdFx0Y21kczogQ29tbWFuZFtdID0gWyBdO1xuXHRcdF9kZWJ1Z2xvZzogc3RyaW5nID0gXCJcIjtcblx0XHRfcmxsb2c6IHN0cmluZyA9IFwiXCI7XG5cdFx0cmVmcmVzaDogYm9vbGVhbiA9IHRydWU7XG5cdFx0Y3VzdHBpbmc6IG51bWJlciA9IDEwMDA7XG5cdFx0c3RhdDogYm9vbGVhbiA9IGZhbHNlO1xuXHRcdF9zdGF0czogTm9kZUpTLlRpbWVvdXQ7XG5cdFx0c3RhdGVyOiBTdGF0cyA9IG5ldyBTdGF0cztcblx0XHRfaW5wdXQ6IHN0cmVhbS5EdXBsZXg7XG5cdFx0X291dHB1dDogc3RyZWFtLkR1cGxleDtcblx0XHRfZXJyb3I6IHN0cmVhbS5Xcml0YWJsZSA9IHByb2Nlc3Muc3RkZXJyO1xuXHRcdFxuXG5cdFx0c3RhdGljIGRlZmF1bHRPcHRzOiBPcHRpb25zLlBhbmVsT3B0cyA9IHtcblx0XHRcdHN1Ym9wdHM6IHtcblx0XHRcdFx0cG9ydDogOTk5OSxcblx0XHRcdFx0cm9vdDogXCIvcGFuZWxcIixcblx0XHRcdFx0c2VydmVEaXI6IHBhdGgucmVzb2x2ZShcIl9fU2VydmVyXCIpXG5cdFx0XHR9LFxuXHRcdFx0c29ja29wdHM6IHtcblx0XHRcdFx0cGF0aDogXCIvd3NcIixcblx0XHRcdFx0cGluZ0ludGVydmFsOiAxMDAwMCxcblx0XHRcdFx0c2VydmVDbGllbnQ6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRhdXRoOiBcImFkbWluOmFkbVwiLFxuXHRcdFx0X3NlcnZlRGlyOiBwYXRoLnJlc29sdmUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLlwiLCBcIi4uXCIpLCBcIl9fU2VydmVyXCIpXG5cdFx0fTtcblx0XHRcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRpb25zLlBhbmVsT3B0cyA9IFBhbmVsLmRlZmF1bHRPcHRzKSB7XG5cdFx0XHRzdXBlcigpO1xuXHRcdFx0bGV0IG5vcHRzOiBPcHRpb25zLlBhbmVsT3B0cyA9IDxPcHRpb25zLlBhbmVsT3B0cz57fTtcblx0XHRcdFxuXHRcdFx0T2JqZWN0LmFzc2lnbihub3B0cywgUGFuZWwuZGVmYXVsdE9wdHMpO1xuXHRcdFx0T2JqZWN0LmFzc2lnbihub3B0cywgb3B0cyk7XG5cblx0XHRcdHRoaXMub3B0cyA9IG5vcHRzO1xuXHRcdH0gLy9jdG9yXG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogU3RhcnQgdGhlIHNlcnZlciBhbmQgc29ja2V0LlxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHt2c2Vydi5DbGFzc2VzLk9wdGlvbnMuU2VydmVyT3B0aW9uc30gW29wdHM9dGhpcy5vcHRzLnN1Ym9wdHNdXG5cdFx0ICogQHJldHVybnMgdGhpc1xuXHRcdCAqIEBtZW1iZXJvZiBQYW5lbFxuXHRcdCAqL1xuXHRcdGFzeW5jIHN0YXJ0KG9wdHM6IHZzZXJ2LkNsYXNzZXMuT3B0aW9ucy5TZXJ2ZXJPcHRpb25zID0gdGhpcy5vcHRzLnN1Ym9wdHMpIHtcblx0XHRcdGlmICh0aGlzLnNlcnYgJiYgdGhpcy5zZXJ2Lmh0dHBzcnYubGlzdGVuaW5nKSB0aHJvdyBFcnJvcnMuRUFMUkxJUztcblxuXHRcdFx0dGhpcy5zZXJ2ID0gYXdhaXQgdnNlcnYuU2VydmVyLnNldHVwKG9wdHMpO1xuXHRcdFx0dGhpcy5zb2NrID0gc29ja2V0KHRoaXMuc2Vydi5odHRwc3J2LCB0aGlzLm9wdHMuc29ja29wdHMpO1xuXG5cdFx0XHRTb2NrZXQuc2V0dXAodGhpcy5zb2NrLCB0aGlzKTsgLy9NaW5kIHRoZSBvcmRlciEhXG5cdFx0XHRhd2FpdCB0aGlzLnNlcnYuYmluZCgpO1xuXG5cdFx0XHR0aGlzLnNlcnYuZGF0YVtcImF1dGhcIl0gPSB0aGlzLm9wdHMuYXV0aDtcblx0XHRcdHRoaXMuc2Vydi5kYXRhW1wicGFyZW50XCJdID0gdGhpcztcblx0XHRcdHRoaXMuX2RlYnVnKFwiUGFuZWwgU3RhcnRlZC5cIik7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9IC8vc3RhcnRcblxuXHRcdC8qKlxuXHRcdCAqIFN0YXJ0IGEgcmVhZGxpbmUuSW50ZXJmYWNlXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0geyp9IHsgaW5wdXQsIG91dHB1dCB9XG5cdFx0ICogQHJldHVybnMgcmVhZGxpbmUuSW50ZXJmYWNlXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0YXN5bmMgY2xpKHsgaW5wdXQsIG91dHB1dCB9OiBhbnkpIHtcblx0XHRcdGlmICghdGhpcy5jbWRzLmxlbmd0aCkgeyBhd2FpdCB0aGlzLl9sb2FkQ0xJKCk7IH1cblx0XHRcdGlmICh0aGlzLnJsKSB0aHJvdyBFcnJvcnMuRUFMUlJMO1xuXG5cdFx0XHR0aGlzLl9vdXRwdXQgPSBvdXRwdXQ7XG5cdFx0XHR0aGlzLl9pbnB1dCA9IGlucHV0O1xuXHRcdFx0XG5cdFx0XHRsZXQgY29tcGxldGVyID0gKGFzeW5jIGZ1bmN0aW9uIGNvbXBsZXRlcihsaW5lOiBzdHJpbmcsIGNiKSB7XG5cdFx0XHRcdGNvbnN0IGNvbXBsZXRpb25zID0gdGhpcy5jbWRzLm1hcCgoY21kOiBDb21tYW5kKSA9PiBjbWQuX2NvbXBsKSxcblx0XHRcdFx0XHRoaXRzID0gY29tcGxldGlvbnMuZmlsdGVyKChjOiBzdHJpbmcpID0+IGMuc3RhcnRzV2l0aChsaW5lKSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gY2IobnVsbCwgW2hpdHMubGVuZ3RoID8gaGl0cyA6IGNvbXBsZXRpb25zLCBsaW5lXSk7XG5cdFx0XHR9KS5iaW5kKHRoaXMpOyAvL2NvbXBsZXRlclxuXG5cdFx0XHRsZXQgcmw6IHJlYWRsaW5lLkludGVyZmFjZSA9IHJlYWRsaW5lLmNyZWF0ZUludGVyZmFjZSh7XG5cdFx0XHRcdGlucHV0LCBvdXRwdXQsIGNvbXBsZXRlclxuXHRcdFx0fSk7XG5cblx0XHRcdHJsLm9uKFwibGluZVwiLCBhc3luYyBsaW5lID0+IHtcblx0XHRcdFx0bGluZSA9IGxpbmUudHJpbSgpO1xuXG5cdFx0XHRcdGxldCB0bXA6IHN0cmluZyxcblx0XHRcdFx0XHRkYXQ6IGFueTtcblx0XHRcdFx0XG5cdFx0XHRcdGlmICh0aGlzLnNvY2spIHRoaXMuc29jay5vZihcIi9hZG1pblwiKS5pbihcImFkbWluXCIpLmVtaXQoXCJjbGlcIiwgdG1wID0gKFwiPiBcIiArIHV0aWwuaW5zcGVjdChsaW5lLCB7IGNvbG9yczogZmFsc2UgfSkpKTtcblx0XHRcdFx0dGhpcy5fcmxsb2cgKz0gdG1wICsgXCIgIC0tLSAgXCIgKyBEYXRlKCkgKyBvcy5FT0w7XG5cdFx0XHRcdFxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGRhdCA9IGF3YWl0IHRoaXMuY21kcy5maW5kKGNtZCA9PiBjbWQuZXhwLnRlc3QobGluZSkpLnBhcnNlKGxpbmUsIHRoaXMpO1xuXHRcdFx0XHRcdGlmIChkYXQgIT09IE51bGwpIGNvbnNvbGUubG9nKGRhdCA9IHV0aWwuaW5zcGVjdChkYXQsIHRydWUpKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihkYXQgPSBjaGFsa1tcInJlZFwiXSh1dGlsLmluc3BlY3QoZXJyKSkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAodGhpcy5zb2NrICYmIGRhdCAhPT0gTnVsbCkgdGhpcy5zb2NrLm9mKFwiL2FkbWluXCIpLmluKFwiYWRtaW5cIikuZW1pdChcImNsaVwiLCB0bXAgPSB1dGlsLmluc3BlY3QoZGF0LCB7IGNvbG9yczogZmFsc2UgfSkpO1xuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy5fcmxsb2cgKz0gdG1wICsgXCIgIC0tLSAgXCIgKyBEYXRlKCkgKyBvcy5FT0w7XG5cdFx0XHR9KTtcblx0XHRcdHJsLm9uKFwicGF1c2VcIiwgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLl9ybF9wYXVzZWQgPSB0cnVlO1xuXHRcdFx0XHR0aGlzLl9kZWJ1ZyhcIlJMIHBhdXNlZFwiKTtcblx0XHRcdH0pO1xuXHRcdFx0cmwub24oXCJyZXN1bWVcIiwgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLl9ybF9wYXVzZWQgPSBmYWxzZTtcblx0XHRcdFx0dGhpcy5fZGVidWcoXCJSTCByZXN1bWVkXCIpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB0aGlzLnJsID0gcmw7XG5cdFx0fSAvL2NsaVxuXG5cdFx0LyoqXG5cdFx0ICogVG9nZ2xlIHJlYWRsaW5lLkludGVyZmFjZVxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBbc3RhdGVdXG5cdFx0ICogQHJldHVybnMgXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0dG9nZ2xlQ0xJKHN0YXRlPzogYm9vbGVhbikge1xuXHRcdFx0aWYgKHRoaXMucmwgJiYgc3RhdGUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRpZiAodGhpcy5fcmxfcGF1c2VkKSB7XG5cdFx0XHRcdFx0dGhpcy5ybC5yZXN1bWUoKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnJsLnBhdXNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAodGhpcy5ybCkge1xuXHRcdFx0XHRpZiAoc3RhdGUpIHtcblx0XHRcdFx0XHR0aGlzLnJsLnJlc3VtZSgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMucmwucGF1c2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1JMO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9IC8vdG9nZ2xlQ0xJXG5cblx0XHQvKipcblx0XHQgKiBUb2dnbGUgU3RhdGVyLlxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IFttc11cblx0XHQgKiBAcmV0dXJucyB0aGlzXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0dG9nZ2xlU3RhdHMoZm9yY2U/OiBib29sZWFuLCBtcz86IG51bWJlcikge1xuXHRcdFx0aWYgKGZvcmNlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0aWYgKHRoaXMuc3RhdCA9IGZvcmNlKSB7XG5cdFx0XHRcdFx0dGhpcy5fc3RhdHMgPSB0aGlzLnN0YXRlci5fYmluZChtcyk7XG5cdFx0XHRcdFx0dGhpcy5fZGVidWcoXCJTdGF0aW5nIHN0YXJ0ZWQuXCIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNsZWFySW50ZXJ2YWwodGhpcy5fc3RhdHMpO1xuXHRcdFx0XHRcdHRoaXMuX2RlYnVnKFwiU3RhdGluZyBzdG9wcGVkLlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5zdGF0ID0gIXRoaXMuc3RhdDtcblx0XHRcdFx0aWYgKHRoaXMuc3RhdCkge1xuXHRcdFx0XHRcdHRoaXMuX3N0YXRzID0gdGhpcy5zdGF0ZXIuX2JpbmQobXMpO1xuXHRcdFx0XHRcdHRoaXMuX2RlYnVnKFwiU3RhdGluZyBzdGFydGVkLlwiKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjbGVhckludGVydmFsKHRoaXMuX3N0YXRzKTtcblx0XHRcdFx0XHR0aGlzLl9kZWJ1ZyhcIlN0YXRpbmcgc3RvcHBlZC5cIik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSAvL3RvZ2dsZVN0YXRzXG5cblx0XHQvKipcblx0XHQgKiBMb2FkIENMSSBjb21tYW5kcy5cblx0XHQgKiBcblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBbZnJvbT1wYXRoLmpvaW4oXCJfX1NlcnZlclwiLCBcImNvbW1hbmRzXCIpXVxuXHRcdCAqIEByZXR1cm5zIHRoaXMuY21kc1xuXHRcdCAqIEBtZW1iZXJvZiBQYW5lbFxuXHRcdCAqL1xuXHRcdGFzeW5jIF9sb2FkQ0xJKGZyb206IHN0cmluZyA9IHBhdGguam9pbihcIl9fU2VydmVyXCIsIFwiY29tbWFuZHNcIikpIHtcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcblx0XHRcdFx0ZnMucmVhZGRpcihmcm9tLCAoZXJyLCBmaWxlcykgPT4ge1xuXHRcdFx0XHRcdGlmICghZXJyKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGxldCBmaWxlIG9mIGZpbGVzKSB7XG5cdFx0XHRcdFx0XHRcdGxldCBmcm06IHN0cmluZztcblx0XHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0XHRkZWxldGUgcmVxdWlyZS5jYWNoZVtyZXF1aXJlLnJlc29sdmUoZnJtID0gcGF0aC5yZXNvbHZlKCcuJyArIHBhdGguc2VwICsgcGF0aC5qb2luKGZyb20sIGZpbGUpKSldO1xuXHRcdFx0XHRcdFx0XHR9IGNhdGNoIChpZ24pIHsgfVxuXHRcdFx0XHRcdFx0XHR0aGlzLmNtZHMucHVzaChyZXF1aXJlKGZybSkuY29tbWFuZCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRoaXMuY21kcy5zb3J0KChhLCBiKSA9PiBhLl9wcmlvcml0eSAtIGIuX3ByaW9yaXR5KTtcblx0XHRcdFx0XHRcdHRoaXMuX2RlYnVnKGBMb2FkaW5nIENMSSBjb21tYW5kcyBmcm9tICcke2Zyb219JyBzdWNjZWVkZWQuYCk7XG5cdFx0XHRcdFx0XHRyZXModGhpcy5jbWRzKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmVqKGVycik7XG5cdFx0XHRcdFx0XHR0aGlzLl9kZWJ1ZyhgTG9hZGluZyBDTEkgY29tbWFuZHMgZnJvbSAnJHtmcm9tfScgZmFpbGVkLmApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9IC8vX2xvYWRDTElcblxuXHRcdC8qKlxuXHRcdCAqIFdyaXRlIHRvIF9kZWJ1Z2xvZ1xuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHsuLi5hbnlbXX0gbXNnXG5cdFx0ICogQHJldHVybnMgXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0X2RlYnVnKC4uLm1zZzogYW55W10pIHtcblx0XHRcdHRoaXMuX2RlYnVnbG9nICs9IG1zZy5qb2luKCcgJykgKyBcIiAgLS0tICBcIiArIERhdGUoKSArIG9zLkVPTDtcblx0XHRcdHRoaXMuZW1pdChcIl9kZWJ1Z1wiLCAuLi5tc2cpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSAvL19kZWJ1Z1xuXHRcdFxuXHR9IC8vUGFuZWxcblxuXHQvKipcblx0ICogU3RhdGVyIENsYXNzIGZvciBtZXRyaWNzLlxuXHQgKiBcblx0ICogQGF1dGhvciBWLiBILlxuXHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdCAqIEBleHBvcnRcblx0ICogQGNsYXNzIFN0YXRzXG5cdCAqIEBleHRlbmRzIHtFdmVudEVtaXR0ZXJ9XG5cdCAqL1xuXHRleHBvcnQgY2xhc3MgU3RhdHMgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG5cdFx0a2VlcFNhbXBsZXM6IG51bWJlciA9IDEwMDtcblx0XHRfcHJldmMgPSBwcm9jZXNzLmNwdVVzYWdlKCk7XG5cdFx0c2FtcGxlczogU25hcFJlZ1tdID0gWyBdO1xuXHRcdGJvdW5kOiBib29sZWFuO1xuXG5cdFx0Y29uc3RydWN0b3IoKSB7XG5cdFx0XHRzdXBlcigpO1xuXHRcdH0gLy9jdG9yXG5cblx0XHQvKipcblx0XHQgKiBUYWtlIGEgbWV0cmljIHNuYXBzaG90LlxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHJldHVybnMge1NuYXBSZWd9XG5cdFx0ICogQG1lbWJlcm9mIFN0YXRzXG5cdFx0ICovXG5cdFx0c25hcCgpOiBTbmFwUmVnIHtcblx0XHRcdHRoaXMuX3ByZXZjID0gcHJvY2Vzcy5jcHVVc2FnZSh0aGlzLl9wcmV2Yyk7XG5cdFx0XHRsZXQgbWVtID0gcHJvY2Vzcy5tZW1vcnlVc2FnZSgpLFxuXHRcdFx0XHRyZWc6IFNuYXBSZWcgPSB7XG5cdFx0XHRcdFx0cnNzOiBtZW0ucnNzLFxuXHRcdFx0XHRcdHRoOiBtZW0uaGVhcFRvdGFsLFxuXHRcdFx0XHRcdHVoOiBtZW0uaGVhcFVzZWQsXG5cdFx0XHRcdFx0ZXh0OiBtZW0uZXh0ZXJuYWwsXG5cdFx0XHRcdFx0dXM6IHRoaXMuX3ByZXZjLFxuXHRcdFx0XHRcdG1lbTogb3MuZnJlZW1lbSgpXG5cdFx0XHRcdH07XG5cdFx0XHR0aGlzLnNhbXBsZXMucHVzaChyZWcpO1xuXHRcdFx0aWYgKHRoaXMuc2FtcGxlcy5sZW5ndGggPiB0aGlzLmtlZXBTYW1wbGVzKSB7XG5cdFx0XHRcdHRoaXMuc2FtcGxlcy5zaGlmdCgpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5lbWl0KFwic25hcFwiLCByZWcpO1xuXHRcdFx0cmV0dXJuIHJlZztcblx0XHR9IC8vc25hcFxuXG5cdFx0LyoqXG5cdFx0ICogc2V0SW50ZXJ2YWwgZm9yIG1ldHJpY3MuXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gW21zPTEwMDBdXG5cdFx0ICogQHJldHVybnMgTm9kZUpTLlRpbWVvdXRcblx0XHQgKiBAbWVtYmVyb2YgU3RhdHNcblx0XHQgKi9cblx0XHRfYmluZChtczogbnVtYmVyID0gMTAwMCkge1xuXHRcdFx0aWYgKCF0aGlzLmJvdW5kKSB7XG5cdFx0XHRcdHJldHVybiBzZXRJbnRlcnZhbCh0aGlzLnNuYXAuYmluZCh0aGlzKSwgbXMpO1xuXHRcdFx0fVxuXHRcdH0gLy9fYmluZFxuXG5cdH0gLy9TdGF0c1xuXHRcbn0gLy9DbGFzc2VzXG5cbmV4cG9ydCBkZWZhdWx0IENsYXNzZXM7XG4iXX0=