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
    })(Errors = Classes.Errors || (Classes.Errors = {})); //Errors
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
            let completer = (async function completer(line, cb) {
                const completions = this.cmds.map((cmd) => cmd._compl), hits = completions.filter((c) => c.startsWith(line));
                return cb(null, [hits.length ? hits : completions, line]);
            }).bind(this); //completer
            let rl = readline.createInterface({
                input, output, completer
            });
            rl.on("line", async (line) => {
                let tmp;
                if (this.sock)
                    this.sock.of("/admin").in("admin").emit("cli", tmp = ("> " + util.inspect(line)));
                this._rllog += tmp + "  ---  " + Date() + os.EOL;
                let dat;
                try {
                    console.log(dat = util.inspect(await this.cmds.find(cmd => cmd.exp.test(line)).parse(line, this), true));
                }
                catch (err) {
                    console.error(dat = exports.chalk["red"](util.inspect(err)));
                }
                if (this.sock)
                    this.sock.of("/admin").in("admin").emit("cli", tmp = util.inspect(dat, {
                        colors: false
                    }));
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
        auth: "admin:adm"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3Nlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9DbGFzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBRWI7O0dBRUc7QUFFSCxrRUFBK0I7QUFDL0IsOERBQThCO0FBQzlCLDhEQUF3QztBQUN4QyxtQ0FBd0M7QUFDeEMsbUNBQXNDO0FBQ3RDLDJEQUFxQztBQUNyQyxtREFBNkI7QUFDN0IscURBQStCO0FBQy9CLG1EQUE2QjtBQUM3QiwrQ0FBeUI7QUFJekIsSUFBSTtJQUNILGFBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Q0FDekI7QUFBQyxPQUFPLEdBQUcsRUFBRTtJQUNiLGFBQUssR0FBRyxTQUFTLEtBQUssQ0FBQyxNQUFNO1FBQzVCLE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyxDQUFDO0NBQ0Y7QUFHRCxJQUFjLE9BQU8sQ0FtWnBCO0FBblpELFdBQWMsT0FBTztJQW9EcEIsSUFBaUIsTUFBTSxDQUd0QjtJQUhELFdBQWlCLE1BQU07UUFDVCxZQUFLLEdBQUcsSUFBSSxjQUFjLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUM5RCxhQUFNLEdBQUcsSUFBSSx1QkFBYyxDQUFDLEVBQUUsT0FBTyxFQUFFLG9DQUFvQyxFQUFDLENBQUMsQ0FBQztJQUM1RixDQUFDLEVBSGdCLE1BQU0sR0FBTixjQUFNLEtBQU4sY0FBTSxRQUd0QixDQUFDLFFBQVE7SUFjVjs7Ozs7Ozs7T0FRRztJQUNILE1BQWEsT0FBTztRQVduQixZQUFZLElBQXlCO1lBTnJDLGNBQVMsR0FBVyxDQUFDLENBQUM7WUFPckIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLE1BQU07UUFFUixXQUFXO1FBQ1gsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQWE7UUFFM0IsQ0FBQyxDQUFDLE1BQU07UUFFUixXQUFXO1FBQ1gsS0FB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TVBMOiBzdGFydC9zdG9wIHdlYnNlcnZcbiAqL1xuXG5pbXBvcnQgc29ja2V0IGZyb20gXCJzb2NrZXQuaW9cIjtcbmltcG9ydCBTb2NrZXQgZnJvbSAnLi9zb2NrZXQnO1xuaW1wb3J0ICogYXMgdnNlcnYgZnJvbSBcInZhbGUtc2VydmVyLWlpXCI7XG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCJldmVudHNcIjtcbmltcG9ydCAqIGFzIHJlYWRsaW5lIGZyb20gXCJyZWFkbGluZVwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzLWV4dHJhXCI7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gXCJ1dGlsXCI7XG5pbXBvcnQgKiBhcyBvcyBmcm9tIFwib3NcIjtcblxuZXhwb3J0IHZhciBjaGFsazogRnVuY3Rpb247XG5cbnRyeSB7XG5cdGNoYWxrID0gcmVxdWlyZShcImNoYWxrXCIpO1xufSBjYXRjaCAob3B0KSB7XG5cdGNoYWxrID0gZnVuY3Rpb24gY2hhbGsoc3RyaW5nKSB7XG5cdFx0cmV0dXJuIHN0cmluZztcblx0fTtcbn1cblxuXG5leHBvcnQgbW9kdWxlIENsYXNzZXMge1xuXHRcblx0ZXhwb3J0IGRlY2xhcmUgbmFtZXNwYWNlIE9wdGlvbnMge1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIE9wdGlvbnMgZm9yIENsYXNzZXMuUGFuZWxcblx0XHQgKiBcblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHRcdCAqIEBleHBvcnRcblx0XHQgKiBAaW50ZXJmYWNlIFBhbmVsT3B0c1xuXHRcdCAqL1xuXHRcdGV4cG9ydCBpbnRlcmZhY2UgUGFuZWxPcHRzIHtcblx0XHRcdGF1dGg6IHN0cmluZztcblx0XHRcdHN1Ym9wdHM/OiB2c2Vydi5DbGFzc2VzLk9wdGlvbnMuU2VydmVyT3B0aW9ucztcblx0XHRcdHNvY2tvcHRzPzogc29ja2V0LlNlcnZlck9wdGlvbnM7XG5cdFx0fSAvL1BhbmVsT3B0c1xuXG5cdFx0LyoqXG5cdFx0ICogT3B0aW9ucyBmb3IgQ2xhc3Nlcy5Db21tYW5kXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAZXhwb3J0XG5cdFx0ICogQGludGVyZmFjZSBDb21tYW5kT3B0c1xuXHRcdCAqL1xuXHRcdGV4cG9ydCBpbnRlcmZhY2UgQ29tbWFuZE9wdHMge1xuXHRcdFx0bmFtZTogc3RyaW5nO1xuXHRcdFx0ZXhwOiBSZWdFeHA7XG5cdFx0XHRkZXNjOiBzdHJpbmc7XG5cdFx0XHR1c2FnZTogc3RyaW5nO1xuXHRcdFx0X3ByaW9yaXR5OiBudW1iZXI7XG5cdFx0XHRfY29tcGw6IHN0cmluZztcblx0XHRcdF9kb21haW46IFR5cGVzLkRPTUFJTlM7XG5cdFx0fSAvL0NvbW1hbmRPcHRzXG5cdFx0XG5cdH0gLy9PcHRpb25zXG5cblx0ZXhwb3J0IGRlY2xhcmUgbmFtZXNwYWNlIFR5cGVzIHtcblxuXHRcdC8qKlxuXHRcdCAqIE9ic29sZXRlLlxuXHRcdCAqIFxuXHRcdCAqIEBleHBvcnRcblx0XHQgKiBAZW51bSB7bnVtYmVyfVxuXHRcdCAqL1xuXHRcdGV4cG9ydCBlbnVtIERPTUFJTlMgeyAgLy9PQlNcblx0XHRcdENMSSwgV1MsIFdFQkRBViwgVUkgIC8vY29uc29sZSwgd2Vic29ja2V0cywgdXJsLCBpbmFwcCB1aSB0ZXh0LWFyZWFcblx0XHR9IC8vRE9NQUlOU1xuXG5cdH0gLy9UeXBlc1xuXG5cdGV4cG9ydCBuYW1lc3BhY2UgRXJyb3JzIHsgIC8vVXBkYXRlXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1JMID0gbmV3IFJlZmVyZW5jZUVycm9yKFwiTm8gc3VpdGFibGUgcmVhZGxpbmUgaW50ZXJmYWNlLlwiKTtcblx0XHRleHBvcnQgY29uc3QgRUFMUlJMID0gbmV3IEFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogXCJyZWFkbGluZSBpbnRlcmZhY2UgYWxyZWFkeSBleGlzdHMuXCJ9KTtcblx0fSAvL0Vycm9yc1xuXG5cdHR5cGUgU25hcFJlZyA9IHtcblx0XHRyc3M6IG51bWJlcjtcblx0XHR0aDogbnVtYmVyO1xuXHRcdHVoOiBudW1iZXI7XG5cdFx0ZXh0OiBudW1iZXI7XG5cblx0XHRtZW06IG51bWJlcjsgIC8vZnJlZW1lbS90b3RhbG1lbVxuXG5cdFx0dXM6IE5vZGVKUy5DcHVVc2FnZTtcblx0fTtcblx0XG5cdFxuXHQvKipcblx0ICogRm9yIENMSSBjb21tYW5kcy5cblx0ICogXG5cdCAqIEBhdXRob3IgVi4gSC5cblx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHQgKiBAZXhwb3J0XG5cdCAqIEBjbGFzcyBDb21tYW5kXG5cdCAqIEBpbXBsZW1lbnRzIHtPcHRpb25zLkNvbW1hbmRPcHRzfVxuXHQgKi9cblx0ZXhwb3J0IGNsYXNzIENvbW1hbmQgaW1wbGVtZW50cyBPcHRpb25zLkNvbW1hbmRPcHRzIHtcblx0XHRuYW1lOiBzdHJpbmc7XG5cdFx0ZXhwOiBSZWdFeHA7XG5cdFx0ZGVzYzogc3RyaW5nO1xuXHRcdHVzYWdlOiBzdHJpbmc7XG5cdFx0X3ByaW9yaXR5OiBudW1iZXIgPSAwO1xuXHRcdF9jb21wbDogc3RyaW5nO1xuXHRcdF9kb21haW46IFR5cGVzLkRPTUFJTlM7XG5cblx0XHRzdGF0aWMgcHJlZml4OiBzdHJpbmcgPSBcIlxcXFwuXCI7ICAvL3RvIGJlIGluYydkIGluIHJlZ2V4XG5cblx0XHRjb25zdHJ1Y3RvcihjdG9yOiBPcHRpb25zLkNvbW1hbmRPcHRzKSB7XG5cdFx0XHRPYmplY3QuYXNzaWduKHRoaXMsIGN0b3IpO1xuXHRcdH0gLy9jdG9yXG5cblx0XHQvL0BPdmVycmlkZVxuXHRcdGFzeW5jIGJvZHkoLi4ucGFyYW1zOiBhbnlbXSkge1xuXG5cdFx0fSAvL2JvZHlcblxuXHRcdC8vQE92ZXJyaWRlXG5cdFx0cGFyc2UobGluZTogc3RyaW5nLCBwYW5lbDogUGFuZWwpIHtcblxuXHRcdFx0cmV0dXJuIHRoaXMuYm9keSgpO1xuXHRcdH0gLy9wYXJzZVxuXG5cdH0gLy9Db21tYW5kXG5cblx0LyoqXG5cdCAqIFN0YXJ0aW5nIEludGVyZmFjZS5cblx0ICogXG5cdCAqIEBhdXRob3IgVi4gSC5cblx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHQgKiBAZXhwb3J0XG5cdCAqIEBjbGFzcyBQYW5lbFxuXHQgKiBAZXh0ZW5kcyB7RXZlbnRFbWl0dGVyfVxuXHQgKi9cblx0ZXhwb3J0IGNsYXNzIFBhbmVsIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblx0XHRcblx0XHRybDogcmVhZGxpbmUuSW50ZXJmYWNlO1xuXHRcdF9ybF9wYXVzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblx0XHRzZXJ2OiB2c2Vydi5DbGFzc2VzLlNlcnZlcjtcblx0XHRzb2NrOiBzb2NrZXQuU2VydmVyO1xuXHRcdG9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzO1xuXHRcdGNtZHM6IENvbW1hbmRbXSA9IFsgXTtcblx0XHRfZGVidWdsb2c6IHN0cmluZyA9IFwiXCI7XG5cdFx0X3JsbG9nOiBzdHJpbmcgPSBcIlwiO1xuXHRcdHJlZnJlc2g6IGJvb2xlYW4gPSB0cnVlO1xuXHRcdGN1c3RwaW5nOiBudW1iZXIgPSAxMDAwO1xuXHRcdHN0YXQ6IGJvb2xlYW4gPSBmYWxzZTtcblx0XHRfc3RhdHM6IE5vZGVKUy5UaW1lb3V0O1xuXHRcdHN0YXRlcjogU3RhdHMgPSBuZXcgU3RhdHM7XG5cblx0XHRzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzID0ge1xuXHRcdFx0c3Vib3B0czoge1xuXHRcdFx0XHRwb3J0OiA5OTk5LFxuXHRcdFx0XHRyb290OiBcIi9wYW5lbFwiLFxuXHRcdFx0XHRzZXJ2ZURpcjogcGF0aC5yZXNvbHZlKFwiX19TZXJ2ZXJcIilcblx0XHRcdH0sXG5cdFx0XHRzb2Nrb3B0czoge1xuXHRcdFx0XHRwYXRoOiBcIi93c1wiLFxuXHRcdFx0XHRwaW5nSW50ZXJ2YWw6IDEwMDAwLFxuXHRcdFx0XHRzZXJ2ZUNsaWVudDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGF1dGg6IFwiYWRtaW46YWRtXCJcblx0XHR9O1xuXHRcdFxuXHRcdGNvbnN0cnVjdG9yKG9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzID0gUGFuZWwuZGVmYXVsdE9wdHMpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0XHRsZXQgbm9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzID0gPE9wdGlvbnMuUGFuZWxPcHRzPnt9O1xuXHRcdFx0XG5cdFx0XHRPYmplY3QuYXNzaWduKG5vcHRzLCBQYW5lbC5kZWZhdWx0T3B0cyk7XG5cdFx0XHRPYmplY3QuYXNzaWduKG5vcHRzLCBvcHRzKTtcblxuXHRcdFx0dGhpcy5vcHRzID0gbm9wdHM7XG5cdFx0fSAvL2N0b3Jcblx0XHRcblx0XHQvKipcblx0XHQgKiBTdGFydCB0aGUgc2VydmVyIGFuZCBzb2NrZXQuXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0ge3ZzZXJ2LkNsYXNzZXMuT3B0aW9ucy5TZXJ2ZXJPcHRpb25zfSBbb3B0cz10aGlzLm9wdHMuc3Vib3B0c11cblx0XHQgKiBAcmV0dXJucyB0aGlzXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0YXN5bmMgc3RhcnQob3B0czogdnNlcnYuQ2xhc3Nlcy5PcHRpb25zLlNlcnZlck9wdGlvbnMgPSB0aGlzLm9wdHMuc3Vib3B0cykge1xuXHRcdFx0dGhpcy5zZXJ2ID0gYXdhaXQgdnNlcnYuU2VydmVyLnNldHVwKG9wdHMpO1xuXHRcdFx0dGhpcy5zb2NrID0gc29ja2V0KHRoaXMuc2Vydi5odHRwc3J2LCB0aGlzLm9wdHMuc29ja29wdHMpO1xuXG5cdFx0XHRTb2NrZXQuc2V0dXAodGhpcy5zb2NrLCB0aGlzKTsgLy9NaW5kIHRoZSBvcmRlciEhXG5cdFx0XHRhd2FpdCB0aGlzLnNlcnYuYmluZCgpO1xuXG5cdFx0XHR0aGlzLnNlcnYuZGF0YVtcImF1dGhcIl0gPSB0aGlzLm9wdHMuYXV0aDtcblx0XHRcdHRoaXMuc2Vydi5kYXRhW1wicGFyZW50XCJdID0gdGhpcztcblx0XHRcdHRoaXMuX2RlYnVnKFwiUGFuZWwgU3RhcnRlZC5cIik7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9IC8vc3RhcnRcblxuXHRcdC8qKlxuXHRcdCAqIFN0YXJ0IGEgcmVhZGxpbmUuSW50ZXJmYWNlXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0geyp9IHsgaW5wdXQsIG91dHB1dCB9XG5cdFx0ICogQHJldHVybnMgcmVhZGxpbmUuSW50ZXJmYWNlXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0YXN5bmMgY2xpKHsgaW5wdXQsIG91dHB1dCB9KSB7XG5cdFx0XHRpZiAoIXRoaXMuY21kcy5sZW5ndGgpIHsgYXdhaXQgdGhpcy5fbG9hZENMSSgpOyB9XG5cdFx0XHRpZiAodGhpcy5ybCkgdGhyb3cgRXJyb3JzLkVBTFJSTDtcblxuXHRcdFx0bGV0IGNvbXBsZXRlciA9IChhc3luYyBmdW5jdGlvbiBjb21wbGV0ZXIobGluZTogc3RyaW5nLCBjYikge1xuXHRcdFx0XHRjb25zdCBjb21wbGV0aW9ucyA9IHRoaXMuY21kcy5tYXAoKGNtZDogQ29tbWFuZCkgPT4gY21kLl9jb21wbCksXG5cdFx0XHRcdFx0aGl0cyA9IGNvbXBsZXRpb25zLmZpbHRlcigoYzogc3RyaW5nKSA9PiBjLnN0YXJ0c1dpdGgobGluZSkpO1xuXHRcdFx0XHRcblx0XHRcdFx0cmV0dXJuIGNiKG51bGwsIFtoaXRzLmxlbmd0aCA/IGhpdHMgOiBjb21wbGV0aW9ucywgbGluZV0pO1xuXHRcdFx0fSkuYmluZCh0aGlzKTsgLy9jb21wbGV0ZXJcblxuXHRcdFx0bGV0IHJsOiByZWFkbGluZS5JbnRlcmZhY2UgPSByZWFkbGluZS5jcmVhdGVJbnRlcmZhY2Uoe1xuXHRcdFx0XHRpbnB1dCwgb3V0cHV0LCBjb21wbGV0ZXJcblx0XHRcdH0pO1xuXG5cdFx0XHRybC5vbihcImxpbmVcIiwgYXN5bmMgbGluZSA9PiB7XG5cdFx0XHRcdGxldCB0bXA7XG5cdFx0XHRcdGlmICh0aGlzLnNvY2spIHRoaXMuc29jay5vZihcIi9hZG1pblwiKS5pbihcImFkbWluXCIpLmVtaXQoXCJjbGlcIiwgdG1wID0oXCI+IFwiICsgdXRpbC5pbnNwZWN0KGxpbmUpKSk7XG5cdFx0XHRcdHRoaXMuX3JsbG9nICs9IHRtcCArIFwiICAtLS0gIFwiICsgRGF0ZSgpICsgb3MuRU9MO1xuXHRcdFx0XHRsZXQgZGF0O1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGRhdCA9IHV0aWwuaW5zcGVjdChhd2FpdCB0aGlzLmNtZHMuZmluZChjbWQgPT4gY21kLmV4cC50ZXN0KGxpbmUpKS5wYXJzZShsaW5lLCB0aGlzKSwgdHJ1ZSkpO1xuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGRhdCA9IGNoYWxrW1wicmVkXCJdKHV0aWwuaW5zcGVjdChlcnIpKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuc29jaykgdGhpcy5zb2NrLm9mKFwiL2FkbWluXCIpLmluKFwiYWRtaW5cIikuZW1pdChcImNsaVwiLCB0bXAgPSB1dGlsLmluc3BlY3QoZGF0LCB7XG5cdFx0XHRcdFx0Y29sb3JzOiBmYWxzZVxuXHRcdFx0XHR9KSk7XG5cdFx0XHRcdHRoaXMuX3JsbG9nICs9IHRtcCArIFwiICAtLS0gIFwiICsgRGF0ZSgpICsgb3MuRU9MO1xuXHRcdFx0fSk7XG5cdFx0XHRybC5vbihcInBhdXNlXCIsICgpID0+IHtcblx0XHRcdFx0dGhpcy5fcmxfcGF1c2VkID0gdHJ1ZTtcblx0XHRcdFx0dGhpcy5fZGVidWcoXCJSTCBwYXVzZWRcIik7XG5cdFx0XHR9KTtcblx0XHRcdHJsLm9uKFwicmVzdW1lXCIsICgpID0+IHtcblx0XHRcdFx0dGhpcy5fcmxfcGF1c2VkID0gZmFsc2U7XG5cdFx0XHRcdHRoaXMuX2RlYnVnKFwiUkwgcmVzdW1lZFwiKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gdGhpcy5ybCA9IHJsO1xuXHRcdH0gLy9jbGlcblxuXHRcdC8qKlxuXHRcdCAqIFRvZ2dsZSByZWFkbGluZS5JbnRlcmZhY2Vcblx0XHQgKiBcblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0YXRlXVxuXHRcdCAqIEByZXR1cm5zIFxuXHRcdCAqIEBtZW1iZXJvZiBQYW5lbFxuXHRcdCAqL1xuXHRcdHRvZ2dsZUNMSShzdGF0ZT86IGJvb2xlYW4pIHtcblx0XHRcdGlmICh0aGlzLnJsICYmIHN0YXRlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0aWYgKHRoaXMuX3JsX3BhdXNlZCkge1xuXHRcdFx0XHRcdHRoaXMucmwucmVzdW1lKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5ybC5wYXVzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMucmwpIHtcblx0XHRcdFx0aWYgKHN0YXRlKSB7XG5cdFx0XHRcdFx0dGhpcy5ybC5yZXN1bWUoKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnJsLnBhdXNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9STDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSAvL3RvZ2dsZUNMSVxuXG5cdFx0LyoqXG5cdFx0ICogVG9nZ2xlIFN0YXRlci5cblx0XHQgKiBcblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXVxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBbbXNdXG5cdFx0ICogQHJldHVybnMgdGhpc1xuXHRcdCAqIEBtZW1iZXJvZiBQYW5lbFxuXHRcdCAqL1xuXHRcdHRvZ2dsZVN0YXRzKGZvcmNlPzogYm9vbGVhbiwgbXM/OiBudW1iZXIpIHtcblx0XHRcdGlmIChmb3JjZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGlmICh0aGlzLnN0YXQgPSBmb3JjZSkge1xuXHRcdFx0XHRcdHRoaXMuX3N0YXRzID0gdGhpcy5zdGF0ZXIuX2JpbmQobXMpO1xuXHRcdFx0XHRcdHRoaXMuX2RlYnVnKFwiU3RhdGluZyBzdGFydGVkLlwiKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjbGVhckludGVydmFsKHRoaXMuX3N0YXRzKTtcblx0XHRcdFx0XHR0aGlzLl9kZWJ1ZyhcIlN0YXRpbmcgc3RvcHBlZC5cIik7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuc3RhdCA9ICF0aGlzLnN0YXQ7XG5cdFx0XHRcdGlmICh0aGlzLnN0YXQpIHtcblx0XHRcdFx0XHR0aGlzLl9zdGF0cyA9IHRoaXMuc3RhdGVyLl9iaW5kKG1zKTtcblx0XHRcdFx0XHR0aGlzLl9kZWJ1ZyhcIlN0YXRpbmcgc3RhcnRlZC5cIik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y2xlYXJJbnRlcnZhbCh0aGlzLl9zdGF0cyk7XG5cdFx0XHRcdFx0dGhpcy5fZGVidWcoXCJTdGF0aW5nIHN0b3BwZWQuXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0gLy90b2dnbGVTdGF0c1xuXG5cdFx0LyoqXG5cdFx0ICogTG9hZCBDTEkgY29tbWFuZHMuXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gW2Zyb209cGF0aC5qb2luKFwiX19TZXJ2ZXJcIiwgXCJjb21tYW5kc1wiKV1cblx0XHQgKiBAcmV0dXJucyB0aGlzLmNtZHNcblx0XHQgKiBAbWVtYmVyb2YgUGFuZWxcblx0XHQgKi9cblx0XHRhc3luYyBfbG9hZENMSShmcm9tOiBzdHJpbmcgPSBwYXRoLmpvaW4oXCJfX1NlcnZlclwiLCBcImNvbW1hbmRzXCIpKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG5cdFx0XHRcdGZzLnJlYWRkaXIoZnJvbSwgKGVyciwgZmlsZXMpID0+IHtcblx0XHRcdFx0XHRpZiAoIWVycikge1xuXHRcdFx0XHRcdFx0Zm9yIChsZXQgZmlsZSBvZiBmaWxlcykge1xuXHRcdFx0XHRcdFx0XHRsZXQgZnJtOiBzdHJpbmc7XG5cdFx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIHJlcXVpcmUuY2FjaGVbcmVxdWlyZS5yZXNvbHZlKGZybSA9IHBhdGgucmVzb2x2ZSgnLicgKyBwYXRoLnNlcCArIHBhdGguam9pbihmcm9tLCBmaWxlKSkpXTtcblx0XHRcdFx0XHRcdFx0fSBjYXRjaCAoaWduKSB7IH1cblx0XHRcdFx0XHRcdFx0dGhpcy5jbWRzLnB1c2gocmVxdWlyZShmcm0pLmNvbW1hbmQpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR0aGlzLmNtZHMuc29ydCgoYSwgYikgPT4gYS5fcHJpb3JpdHkgLSBiLl9wcmlvcml0eSk7XG5cdFx0XHRcdFx0XHR0aGlzLl9kZWJ1ZyhgTG9hZGluZyBDTEkgY29tbWFuZHMgZnJvbSAnJHtmcm9tfScgc3VjY2VlZGVkLmApO1xuXHRcdFx0XHRcdFx0cmVzKHRoaXMuY21kcyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJlaihlcnIpO1xuXHRcdFx0XHRcdFx0dGhpcy5fZGVidWcoYExvYWRpbmcgQ0xJIGNvbW1hbmRzIGZyb20gJyR7ZnJvbX0nIGZhaWxlZC5gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSAvL19sb2FkQ0xJXG5cblx0XHQvKipcblx0XHQgKiBXcml0ZSB0byBfZGVidWdsb2dcblx0XHQgKiBcblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHRcdCAqIEBwYXJhbSB7Li4uYW55W119IG1zZ1xuXHRcdCAqIEByZXR1cm5zIFxuXHRcdCAqIEBtZW1iZXJvZiBQYW5lbFxuXHRcdCAqL1xuXHRcdF9kZWJ1ZyguLi5tc2c6IGFueVtdKSB7XG5cdFx0XHR0aGlzLl9kZWJ1Z2xvZyArPSBtc2cuam9pbignICcpICsgXCIgIC0tLSAgXCIgKyBEYXRlKCkgKyBvcy5FT0w7XG5cdFx0XHR0aGlzLmVtaXQoXCJfZGVidWdcIiwgLi4ubXNnKTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0gLy9fZGVidWdcblx0XHRcblx0fSAvL1BhbmVsXG5cblx0LyoqXG5cdCAqIFN0YXRlciBDbGFzcyBmb3IgbWV0cmljcy5cblx0ICogXG5cdCAqIEBhdXRob3IgVi4gSC5cblx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHQgKiBAZXhwb3J0XG5cdCAqIEBjbGFzcyBTdGF0c1xuXHQgKiBAZXh0ZW5kcyB7RXZlbnRFbWl0dGVyfVxuXHQgKi9cblx0ZXhwb3J0IGNsYXNzIFN0YXRzIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuXHRcdGtlZXBTYW1wbGVzOiBudW1iZXIgPSAxMDA7XG5cdFx0X3ByZXZjID0gcHJvY2Vzcy5jcHVVc2FnZSgpO1xuXHRcdHNhbXBsZXM6IFNuYXBSZWdbXSA9IFsgXTtcblx0XHRib3VuZDogYm9vbGVhbjtcblxuXHRcdGNvbnN0cnVjdG9yKCkge1xuXHRcdFx0c3VwZXIoKTtcblx0XHR9IC8vY3RvclxuXG5cdFx0LyoqXG5cdFx0ICogVGFrZSBhIG1ldHJpYyBzbmFwc2hvdC5cblx0XHQgKiBcblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHRcdCAqIEByZXR1cm5zIHtTbmFwUmVnfVxuXHRcdCAqIEBtZW1iZXJvZiBTdGF0c1xuXHRcdCAqL1xuXHRcdHNuYXAoKSB7XG5cdFx0XHR0aGlzLl9wcmV2YyA9IHByb2Nlc3MuY3B1VXNhZ2UodGhpcy5fcHJldmMpO1xuXHRcdFx0bGV0IG1lbSA9IHByb2Nlc3MubWVtb3J5VXNhZ2UoKSxcblx0XHRcdFx0cmVnOiBTbmFwUmVnID0ge1xuXHRcdFx0XHRcdHJzczogbWVtLnJzcyxcblx0XHRcdFx0XHR0aDogbWVtLmhlYXBUb3RhbCxcblx0XHRcdFx0XHR1aDogbWVtLmhlYXBVc2VkLFxuXHRcdFx0XHRcdGV4dDogbWVtLmV4dGVybmFsLFxuXHRcdFx0XHRcdHVzOiB0aGlzLl9wcmV2Yyxcblx0XHRcdFx0XHRtZW06IG9zLmZyZWVtZW0oKVxuXHRcdFx0XHR9O1xuXHRcdFx0dGhpcy5zYW1wbGVzLnB1c2gocmVnKTtcblx0XHRcdGlmICh0aGlzLnNhbXBsZXMubGVuZ3RoID4gdGhpcy5rZWVwU2FtcGxlcykge1xuXHRcdFx0XHR0aGlzLnNhbXBsZXMuc2hpZnQoKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuZW1pdChcInNuYXBcIiwgcmVnKTtcblx0XHRcdHJldHVybiByZWc7XG5cdFx0fSAvL3NuYXBcblxuXHRcdC8qKlxuXHRcdCAqIHNldEludGVydmFsIGZvciBtZXRyaWNzLlxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IFttcz0xMDAwXVxuXHRcdCAqIEByZXR1cm5zIE5vZGVKUy5UaW1lb3V0XG5cdFx0ICogQG1lbWJlcm9mIFN0YXRzXG5cdFx0ICovXG5cdFx0X2JpbmQobXMgPSAxMDAwKSB7XG5cdFx0XHRpZiAoIXRoaXMuYm91bmQpIHtcblx0XHRcdFx0cmV0dXJuIHNldEludGVydmFsKHRoaXMuc25hcC5iaW5kKHRoaXMpLCBtcyk7XG5cdFx0XHR9XG5cdFx0fSAvL19iaW5kXG5cblx0fSAvL1N0YXRzXG5cdFxufSAvL0NsYXNzZXNcblxuZXhwb3J0IGRlZmF1bHQgQ2xhc3NlcztcbiJdfQ==