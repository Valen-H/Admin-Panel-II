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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3Nlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9DbGFzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBRWI7O0dBRUc7QUFFSCxrRUFBK0I7QUFDL0IsOERBQThCO0FBQzlCLDhEQUF3QztBQUN4QyxtQ0FBd0M7QUFDeEMsbUNBQXNDO0FBQ3RDLDJEQUFxQztBQUNyQyxtREFBNkI7QUFDN0IscURBQStCO0FBQy9CLG1EQUE2QjtBQUM3QiwrQ0FBeUI7QUFJekIsSUFBSTtJQUNILGFBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Q0FDekI7QUFBQyxPQUFPLEdBQUcsRUFBRTtJQUNiLGFBQUssR0FBRyxTQUFTLEtBQUssQ0FBQyxNQUFNO1FBQzVCLE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyxDQUFDO0NBQ0Y7QUFHRCxJQUFjLE9BQU8sQ0FzWnBCO0FBdFpELFdBQWMsT0FBTztJQXFEcEIsSUFBaUIsTUFBTSxDQUd0QjtJQUhELFdBQWlCLE1BQU07UUFDVCxZQUFLLEdBQUcsSUFBSSxjQUFjLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUM5RCxhQUFNLEdBQUcsSUFBSSx1QkFBYyxDQUFDLEVBQUUsT0FBTyxFQUFFLG9DQUFvQyxFQUFDLENBQUMsQ0FBQztJQUM1RixDQUFDLEVBSGdCLE1BQU0sR0FBTixjQUFNLEtBQU4sY0FBTSxRQUd0QixDQUFDLFFBQVE7SUFjVjs7Ozs7Ozs7T0FRRztJQUNILE1BQWEsT0FBTztRQVduQixZQUFZLElBQXlCO1lBTnJDLGNBQVMsR0FBVyxDQUFDLENBQUM7WUFPckIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLE1BQU07UUFFUixXQUFXO1FBQ1gsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQWE7UUFFM0IsQ0FBQyxDQUFDLE1BQU07UUFFUixXQUFXO1FBQ1gsS0FB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LGVBQU8sS0FBUCxlQUFPLFFBc1pwQixDQUFDLFNBQVM7QUFFWCxrQkFBZSxPQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuLypcbiAqIElNUEw6IHN0YXJ0L3N0b3Agd2Vic2VydlxuICovXG5cbmltcG9ydCBzb2NrZXQgZnJvbSBcInNvY2tldC5pb1wiO1xuaW1wb3J0IFNvY2tldCBmcm9tICcuL3NvY2tldCc7XG5pbXBvcnQgKiBhcyB2c2VydiBmcm9tIFwidmFsZS1zZXJ2ZXItaWlcIjtcbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcImV2ZW50c1wiO1xuaW1wb3J0ICogYXMgcmVhZGxpbmUgZnJvbSBcInJlYWRsaW5lXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnMtZXh0cmFcIjtcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSBcInV0aWxcIjtcbmltcG9ydCAqIGFzIG9zIGZyb20gXCJvc1wiO1xuXG5leHBvcnQgdmFyIGNoYWxrOiBGdW5jdGlvbjtcblxudHJ5IHtcblx0Y2hhbGsgPSByZXF1aXJlKFwiY2hhbGtcIik7XG59IGNhdGNoIChvcHQpIHtcblx0Y2hhbGsgPSBmdW5jdGlvbiBjaGFsayhzdHJpbmcpIHtcblx0XHRyZXR1cm4gc3RyaW5nO1xuXHR9O1xufVxuXG5cbmV4cG9ydCBtb2R1bGUgQ2xhc3NlcyB7XG5cdFxuXHRleHBvcnQgZGVjbGFyZSBuYW1lc3BhY2UgT3B0aW9ucyB7XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogT3B0aW9ucyBmb3IgQ2xhc3Nlcy5QYW5lbFxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQGV4cG9ydFxuXHRcdCAqIEBpbnRlcmZhY2UgUGFuZWxPcHRzXG5cdFx0ICovXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBQYW5lbE9wdHMge1xuXHRcdFx0YXV0aDogc3RyaW5nO1xuXHRcdFx0X3NlcnZlRGlyOiBzdHJpbmc7XG5cdFx0XHRzdWJvcHRzPzogdnNlcnYuQ2xhc3Nlcy5PcHRpb25zLlNlcnZlck9wdGlvbnM7XG5cdFx0XHRzb2Nrb3B0cz86IHNvY2tldC5TZXJ2ZXJPcHRpb25zO1xuXHRcdH0gLy9QYW5lbE9wdHNcblxuXHRcdC8qKlxuXHRcdCAqIE9wdGlvbnMgZm9yIENsYXNzZXMuQ29tbWFuZFxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQGV4cG9ydFxuXHRcdCAqIEBpbnRlcmZhY2UgQ29tbWFuZE9wdHNcblx0XHQgKi9cblx0XHRleHBvcnQgaW50ZXJmYWNlIENvbW1hbmRPcHRzIHtcblx0XHRcdG5hbWU6IHN0cmluZztcblx0XHRcdGV4cDogUmVnRXhwO1xuXHRcdFx0ZGVzYzogc3RyaW5nO1xuXHRcdFx0dXNhZ2U6IHN0cmluZztcblx0XHRcdF9wcmlvcml0eTogbnVtYmVyO1xuXHRcdFx0X2NvbXBsOiBzdHJpbmc7XG5cdFx0XHRfZG9tYWluOiBUeXBlcy5ET01BSU5TO1xuXHRcdH0gLy9Db21tYW5kT3B0c1xuXHRcdFxuXHR9IC8vT3B0aW9uc1xuXG5cdGV4cG9ydCBkZWNsYXJlIG5hbWVzcGFjZSBUeXBlcyB7XG5cblx0XHQvKipcblx0XHQgKiBPYnNvbGV0ZS5cblx0XHQgKiBcblx0XHQgKiBAZXhwb3J0XG5cdFx0ICogQGVudW0ge251bWJlcn1cblx0XHQgKi9cblx0XHRleHBvcnQgZW51bSBET01BSU5TIHsgIC8vT0JTXG5cdFx0XHRDTEksIFdTLCBXRUJEQVYsIFVJICAvL2NvbnNvbGUsIHdlYnNvY2tldHMsIHVybCwgaW5hcHAgdWkgdGV4dC1hcmVhXG5cdFx0fSAvL0RPTUFJTlNcblxuXHR9IC8vVHlwZXNcblxuXHRleHBvcnQgbmFtZXNwYWNlIEVycm9ycyB7ICAvL1VwZGF0ZVxuXHRcdGV4cG9ydCBjb25zdCBFTk9STCA9IG5ldyBSZWZlcmVuY2VFcnJvcihcIk5vIHN1aXRhYmxlIHJlYWRsaW5lIGludGVyZmFjZS5cIik7XG5cdFx0ZXhwb3J0IGNvbnN0IEVBTFJSTCA9IG5ldyBBc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IFwicmVhZGxpbmUgaW50ZXJmYWNlIGFscmVhZHkgZXhpc3RzLlwifSk7XG5cdH0gLy9FcnJvcnNcblxuXHR0eXBlIFNuYXBSZWcgPSB7XG5cdFx0cnNzOiBudW1iZXI7XG5cdFx0dGg6IG51bWJlcjtcblx0XHR1aDogbnVtYmVyO1xuXHRcdGV4dDogbnVtYmVyO1xuXG5cdFx0bWVtOiBudW1iZXI7ICAvL2ZyZWVtZW0vdG90YWxtZW1cblxuXHRcdHVzOiBOb2RlSlMuQ3B1VXNhZ2U7XG5cdH07XG5cdFxuXHRcblx0LyoqXG5cdCAqIEZvciBDTEkgY29tbWFuZHMuXG5cdCAqIFxuXHQgKiBAYXV0aG9yIFYuIEguXG5cdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0ICogQGV4cG9ydFxuXHQgKiBAY2xhc3MgQ29tbWFuZFxuXHQgKiBAaW1wbGVtZW50cyB7T3B0aW9ucy5Db21tYW5kT3B0c31cblx0ICovXG5cdGV4cG9ydCBjbGFzcyBDb21tYW5kIGltcGxlbWVudHMgT3B0aW9ucy5Db21tYW5kT3B0cyB7XG5cdFx0bmFtZTogc3RyaW5nO1xuXHRcdGV4cDogUmVnRXhwO1xuXHRcdGRlc2M6IHN0cmluZztcblx0XHR1c2FnZTogc3RyaW5nO1xuXHRcdF9wcmlvcml0eTogbnVtYmVyID0gMDtcblx0XHRfY29tcGw6IHN0cmluZztcblx0XHRfZG9tYWluOiBUeXBlcy5ET01BSU5TO1xuXG5cdFx0c3RhdGljIHByZWZpeDogc3RyaW5nID0gXCJcXFxcLlwiOyAgLy90byBiZSBpbmMnZCBpbiByZWdleFxuXG5cdFx0Y29uc3RydWN0b3IoY3RvcjogT3B0aW9ucy5Db21tYW5kT3B0cykge1xuXHRcdFx0T2JqZWN0LmFzc2lnbih0aGlzLCBjdG9yKTtcblx0XHR9IC8vY3RvclxuXG5cdFx0Ly9AT3ZlcnJpZGVcblx0XHRhc3luYyBib2R5KC4uLnBhcmFtczogYW55W10pIHtcblxuXHRcdH0gLy9ib2R5XG5cblx0XHQvL0BPdmVycmlkZVxuXHRcdHBhcnNlKGxpbmU6IHN0cmluZywgcGFuZWw6IFBhbmVsKSB7XG5cblx0XHRcdHJldHVybiB0aGlzLmJvZHkoKTtcblx0XHR9IC8vcGFyc2VcblxuXHR9IC8vQ29tbWFuZFxuXG5cdC8qKlxuXHQgKiBTdGFydGluZyBJbnRlcmZhY2UuXG5cdCAqIFxuXHQgKiBAYXV0aG9yIFYuIEguXG5cdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0ICogQGV4cG9ydFxuXHQgKiBAY2xhc3MgUGFuZWxcblx0ICogQGV4dGVuZHMge0V2ZW50RW1pdHRlcn1cblx0ICovXG5cdGV4cG9ydCBjbGFzcyBQYW5lbCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cdFx0XG5cdFx0cmw6IHJlYWRsaW5lLkludGVyZmFjZTtcblx0XHRfcmxfcGF1c2VkOiBib29sZWFuID0gZmFsc2U7XG5cdFx0c2VydjogdnNlcnYuQ2xhc3Nlcy5TZXJ2ZXI7XG5cdFx0c29jazogc29ja2V0LlNlcnZlcjtcblx0XHRvcHRzOiBPcHRpb25zLlBhbmVsT3B0cztcblx0XHRjbWRzOiBDb21tYW5kW10gPSBbIF07XG5cdFx0X2RlYnVnbG9nOiBzdHJpbmcgPSBcIlwiO1xuXHRcdF9ybGxvZzogc3RyaW5nID0gXCJcIjtcblx0XHRyZWZyZXNoOiBib29sZWFuID0gdHJ1ZTtcblx0XHRjdXN0cGluZzogbnVtYmVyID0gMTAwMDtcblx0XHRzdGF0OiBib29sZWFuID0gZmFsc2U7XG5cdFx0X3N0YXRzOiBOb2RlSlMuVGltZW91dDtcblx0XHRzdGF0ZXI6IFN0YXRzID0gbmV3IFN0YXRzO1xuXHRcdFxuXG5cdFx0c3RhdGljIGRlZmF1bHRPcHRzOiBPcHRpb25zLlBhbmVsT3B0cyA9IHtcblx0XHRcdHN1Ym9wdHM6IHtcblx0XHRcdFx0cG9ydDogOTk5OSxcblx0XHRcdFx0cm9vdDogXCIvcGFuZWxcIixcblx0XHRcdFx0c2VydmVEaXI6IHBhdGgucmVzb2x2ZShcIl9fU2VydmVyXCIpXG5cdFx0XHR9LFxuXHRcdFx0c29ja29wdHM6IHtcblx0XHRcdFx0cGF0aDogXCIvd3NcIixcblx0XHRcdFx0cGluZ0ludGVydmFsOiAxMDAwMCxcblx0XHRcdFx0c2VydmVDbGllbnQ6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRhdXRoOiBcImFkbWluOmFkbVwiLFxuXHRcdFx0X3NlcnZlRGlyOiBwYXRoLnJlc29sdmUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLlwiLCBcIi4uXCIpLCBcIl9fU2VydmVyXCIpXG5cdFx0fTtcblx0XHRcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRpb25zLlBhbmVsT3B0cyA9IFBhbmVsLmRlZmF1bHRPcHRzKSB7XG5cdFx0XHRzdXBlcigpO1xuXHRcdFx0bGV0IG5vcHRzOiBPcHRpb25zLlBhbmVsT3B0cyA9IDxPcHRpb25zLlBhbmVsT3B0cz57fTtcblx0XHRcdFxuXHRcdFx0T2JqZWN0LmFzc2lnbihub3B0cywgUGFuZWwuZGVmYXVsdE9wdHMpO1xuXHRcdFx0T2JqZWN0LmFzc2lnbihub3B0cywgb3B0cyk7XG5cblx0XHRcdHRoaXMub3B0cyA9IG5vcHRzO1xuXHRcdH0gLy9jdG9yXG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogU3RhcnQgdGhlIHNlcnZlciBhbmQgc29ja2V0LlxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHt2c2Vydi5DbGFzc2VzLk9wdGlvbnMuU2VydmVyT3B0aW9uc30gW29wdHM9dGhpcy5vcHRzLnN1Ym9wdHNdXG5cdFx0ICogQHJldHVybnMgdGhpc1xuXHRcdCAqIEBtZW1iZXJvZiBQYW5lbFxuXHRcdCAqL1xuXHRcdGFzeW5jIHN0YXJ0KG9wdHM6IHZzZXJ2LkNsYXNzZXMuT3B0aW9ucy5TZXJ2ZXJPcHRpb25zID0gdGhpcy5vcHRzLnN1Ym9wdHMpIHtcblx0XHRcdHRoaXMuc2VydiA9IGF3YWl0IHZzZXJ2LlNlcnZlci5zZXR1cChvcHRzKTtcblx0XHRcdHRoaXMuc29jayA9IHNvY2tldCh0aGlzLnNlcnYuaHR0cHNydiwgdGhpcy5vcHRzLnNvY2tvcHRzKTtcblxuXHRcdFx0U29ja2V0LnNldHVwKHRoaXMuc29jaywgdGhpcyk7IC8vTWluZCB0aGUgb3JkZXIhIVxuXHRcdFx0YXdhaXQgdGhpcy5zZXJ2LmJpbmQoKTtcblxuXHRcdFx0dGhpcy5zZXJ2LmRhdGFbXCJhdXRoXCJdID0gdGhpcy5vcHRzLmF1dGg7XG5cdFx0XHR0aGlzLnNlcnYuZGF0YVtcInBhcmVudFwiXSA9IHRoaXM7XG5cdFx0XHR0aGlzLl9kZWJ1ZyhcIlBhbmVsIFN0YXJ0ZWQuXCIpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSAvL3N0YXJ0XG5cblx0XHQvKipcblx0XHQgKiBTdGFydCBhIHJlYWRsaW5lLkludGVyZmFjZVxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHsqfSB7IGlucHV0LCBvdXRwdXQgfVxuXHRcdCAqIEByZXR1cm5zIHJlYWRsaW5lLkludGVyZmFjZVxuXHRcdCAqIEBtZW1iZXJvZiBQYW5lbFxuXHRcdCAqL1xuXHRcdGFzeW5jIGNsaSh7IGlucHV0LCBvdXRwdXQgfSkge1xuXHRcdFx0aWYgKCF0aGlzLmNtZHMubGVuZ3RoKSB7IGF3YWl0IHRoaXMuX2xvYWRDTEkoKTsgfVxuXHRcdFx0aWYgKHRoaXMucmwpIHRocm93IEVycm9ycy5FQUxSUkw7XG5cblx0XHRcdGxldCBjb21wbGV0ZXIgPSAoYXN5bmMgZnVuY3Rpb24gY29tcGxldGVyKGxpbmU6IHN0cmluZywgY2IpIHtcblx0XHRcdFx0Y29uc3QgY29tcGxldGlvbnMgPSB0aGlzLmNtZHMubWFwKChjbWQ6IENvbW1hbmQpID0+IGNtZC5fY29tcGwpLFxuXHRcdFx0XHRcdGhpdHMgPSBjb21wbGV0aW9ucy5maWx0ZXIoKGM6IHN0cmluZykgPT4gYy5zdGFydHNXaXRoKGxpbmUpKTtcblx0XHRcdFx0XG5cdFx0XHRcdHJldHVybiBjYihudWxsLCBbaGl0cy5sZW5ndGggPyBoaXRzIDogY29tcGxldGlvbnMsIGxpbmVdKTtcblx0XHRcdH0pLmJpbmQodGhpcyk7IC8vY29tcGxldGVyXG5cblx0XHRcdGxldCBybDogcmVhZGxpbmUuSW50ZXJmYWNlID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKHtcblx0XHRcdFx0aW5wdXQsIG91dHB1dCwgY29tcGxldGVyXG5cdFx0XHR9KTtcblxuXHRcdFx0cmwub24oXCJsaW5lXCIsIGFzeW5jIGxpbmUgPT4ge1xuXHRcdFx0XHRsZXQgdG1wO1xuXHRcdFx0XHRpZiAodGhpcy5zb2NrKSB0aGlzLnNvY2sub2YoXCIvYWRtaW5cIikuaW4oXCJhZG1pblwiKS5lbWl0KFwiY2xpXCIsIHRtcCA9KFwiPiBcIiArIHV0aWwuaW5zcGVjdChsaW5lKSkpO1xuXHRcdFx0XHR0aGlzLl9ybGxvZyArPSB0bXAgKyBcIiAgLS0tICBcIiArIERhdGUoKSArIG9zLkVPTDtcblx0XHRcdFx0bGV0IGRhdDtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhkYXQgPSB1dGlsLmluc3BlY3QoYXdhaXQgdGhpcy5jbWRzLmZpbmQoY21kID0+IGNtZC5leHAudGVzdChsaW5lKSkucGFyc2UobGluZSwgdGhpcyksIHRydWUpKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihkYXQgPSBjaGFsa1tcInJlZFwiXSh1dGlsLmluc3BlY3QoZXJyKSkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLnNvY2spIHRoaXMuc29jay5vZihcIi9hZG1pblwiKS5pbihcImFkbWluXCIpLmVtaXQoXCJjbGlcIiwgdG1wID0gdXRpbC5pbnNwZWN0KGRhdCwge1xuXHRcdFx0XHRcdGNvbG9yczogZmFsc2Vcblx0XHRcdFx0fSkpO1xuXHRcdFx0XHR0aGlzLl9ybGxvZyArPSB0bXAgKyBcIiAgLS0tICBcIiArIERhdGUoKSArIG9zLkVPTDtcblx0XHRcdH0pO1xuXHRcdFx0cmwub24oXCJwYXVzZVwiLCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuX3JsX3BhdXNlZCA9IHRydWU7XG5cdFx0XHRcdHRoaXMuX2RlYnVnKFwiUkwgcGF1c2VkXCIpO1xuXHRcdFx0fSk7XG5cdFx0XHRybC5vbihcInJlc3VtZVwiLCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuX3JsX3BhdXNlZCA9IGZhbHNlO1xuXHRcdFx0XHR0aGlzLl9kZWJ1ZyhcIlJMIHJlc3VtZWRcIik7XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHRoaXMucmwgPSBybDtcblx0XHR9IC8vY2xpXG5cblx0XHQvKipcblx0XHQgKiBUb2dnbGUgcmVhZGxpbmUuSW50ZXJmYWNlXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdGF0ZV1cblx0XHQgKiBAcmV0dXJucyBcblx0XHQgKiBAbWVtYmVyb2YgUGFuZWxcblx0XHQgKi9cblx0XHR0b2dnbGVDTEkoc3RhdGU/OiBib29sZWFuKSB7XG5cdFx0XHRpZiAodGhpcy5ybCAmJiBzdGF0ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGlmICh0aGlzLl9ybF9wYXVzZWQpIHtcblx0XHRcdFx0XHR0aGlzLnJsLnJlc3VtZSgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMucmwucGF1c2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnJsKSB7XG5cdFx0XHRcdGlmIChzdGF0ZSkge1xuXHRcdFx0XHRcdHRoaXMucmwucmVzdW1lKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5ybC5wYXVzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PUkw7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0gLy90b2dnbGVDTElcblxuXHRcdC8qKlxuXHRcdCAqIFRvZ2dsZSBTdGF0ZXIuXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JjZV1cblx0XHQgKiBAcGFyYW0ge251bWJlcn0gW21zXVxuXHRcdCAqIEByZXR1cm5zIHRoaXNcblx0XHQgKiBAbWVtYmVyb2YgUGFuZWxcblx0XHQgKi9cblx0XHR0b2dnbGVTdGF0cyhmb3JjZT86IGJvb2xlYW4sIG1zPzogbnVtYmVyKSB7XG5cdFx0XHRpZiAoZm9yY2UgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRpZiAodGhpcy5zdGF0ID0gZm9yY2UpIHtcblx0XHRcdFx0XHR0aGlzLl9zdGF0cyA9IHRoaXMuc3RhdGVyLl9iaW5kKG1zKTtcblx0XHRcdFx0XHR0aGlzLl9kZWJ1ZyhcIlN0YXRpbmcgc3RhcnRlZC5cIik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y2xlYXJJbnRlcnZhbCh0aGlzLl9zdGF0cyk7XG5cdFx0XHRcdFx0dGhpcy5fZGVidWcoXCJTdGF0aW5nIHN0b3BwZWQuXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnN0YXQgPSAhdGhpcy5zdGF0O1xuXHRcdFx0XHRpZiAodGhpcy5zdGF0KSB7XG5cdFx0XHRcdFx0dGhpcy5fc3RhdHMgPSB0aGlzLnN0YXRlci5fYmluZChtcyk7XG5cdFx0XHRcdFx0dGhpcy5fZGVidWcoXCJTdGF0aW5nIHN0YXJ0ZWQuXCIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNsZWFySW50ZXJ2YWwodGhpcy5fc3RhdHMpO1xuXHRcdFx0XHRcdHRoaXMuX2RlYnVnKFwiU3RhdGluZyBzdG9wcGVkLlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9IC8vdG9nZ2xlU3RhdHNcblxuXHRcdC8qKlxuXHRcdCAqIExvYWQgQ0xJIGNvbW1hbmRzLlxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IFtmcm9tPXBhdGguam9pbihcIl9fU2VydmVyXCIsIFwiY29tbWFuZHNcIildXG5cdFx0ICogQHJldHVybnMgdGhpcy5jbWRzXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0YXN5bmMgX2xvYWRDTEkoZnJvbTogc3RyaW5nID0gcGF0aC5qb2luKFwiX19TZXJ2ZXJcIiwgXCJjb21tYW5kc1wiKSkge1xuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuXHRcdFx0XHRmcy5yZWFkZGlyKGZyb20sIChlcnIsIGZpbGVzKSA9PiB7XG5cdFx0XHRcdFx0aWYgKCFlcnIpIHtcblx0XHRcdFx0XHRcdGZvciAobGV0IGZpbGUgb2YgZmlsZXMpIHtcblx0XHRcdFx0XHRcdFx0bGV0IGZybTogc3RyaW5nO1xuXHRcdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSByZXF1aXJlLmNhY2hlW3JlcXVpcmUucmVzb2x2ZShmcm0gPSBwYXRoLnJlc29sdmUoJy4nICsgcGF0aC5zZXAgKyBwYXRoLmpvaW4oZnJvbSwgZmlsZSkpKV07XG5cdFx0XHRcdFx0XHRcdH0gY2F0Y2ggKGlnbikgeyB9XG5cdFx0XHRcdFx0XHRcdHRoaXMuY21kcy5wdXNoKHJlcXVpcmUoZnJtKS5jb21tYW5kKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0dGhpcy5jbWRzLnNvcnQoKGEsIGIpID0+IGEuX3ByaW9yaXR5IC0gYi5fcHJpb3JpdHkpO1xuXHRcdFx0XHRcdFx0dGhpcy5fZGVidWcoYExvYWRpbmcgQ0xJIGNvbW1hbmRzIGZyb20gJyR7ZnJvbX0nIHN1Y2NlZWRlZC5gKTtcblx0XHRcdFx0XHRcdHJlcyh0aGlzLmNtZHMpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZWooZXJyKTtcblx0XHRcdFx0XHRcdHRoaXMuX2RlYnVnKGBMb2FkaW5nIENMSSBjb21tYW5kcyBmcm9tICcke2Zyb219JyBmYWlsZWQuYCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0gLy9fbG9hZENMSVxuXG5cdFx0LyoqXG5cdFx0ICogV3JpdGUgdG8gX2RlYnVnbG9nXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0gey4uLmFueVtdfSBtc2dcblx0XHQgKiBAcmV0dXJucyBcblx0XHQgKiBAbWVtYmVyb2YgUGFuZWxcblx0XHQgKi9cblx0XHRfZGVidWcoLi4ubXNnOiBhbnlbXSkge1xuXHRcdFx0dGhpcy5fZGVidWdsb2cgKz0gbXNnLmpvaW4oJyAnKSArIFwiICAtLS0gIFwiICsgRGF0ZSgpICsgb3MuRU9MO1xuXHRcdFx0dGhpcy5lbWl0KFwiX2RlYnVnXCIsIC4uLm1zZyk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9IC8vX2RlYnVnXG5cdFx0XG5cdH0gLy9QYW5lbFxuXG5cdC8qKlxuXHQgKiBTdGF0ZXIgQ2xhc3MgZm9yIG1ldHJpY3MuXG5cdCAqIFxuXHQgKiBAYXV0aG9yIFYuIEguXG5cdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0ICogQGV4cG9ydFxuXHQgKiBAY2xhc3MgU3RhdHNcblx0ICogQGV4dGVuZHMge0V2ZW50RW1pdHRlcn1cblx0ICovXG5cdGV4cG9ydCBjbGFzcyBTdGF0cyBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cblx0XHRrZWVwU2FtcGxlczogbnVtYmVyID0gMTAwO1xuXHRcdF9wcmV2YyA9IHByb2Nlc3MuY3B1VXNhZ2UoKTtcblx0XHRzYW1wbGVzOiBTbmFwUmVnW10gPSBbIF07XG5cdFx0Ym91bmQ6IGJvb2xlYW47XG5cblx0XHRjb25zdHJ1Y3RvcigpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0fSAvL2N0b3JcblxuXHRcdC8qKlxuXHRcdCAqIFRha2UgYSBtZXRyaWMgc25hcHNob3QuXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcmV0dXJucyB7U25hcFJlZ31cblx0XHQgKiBAbWVtYmVyb2YgU3RhdHNcblx0XHQgKi9cblx0XHRzbmFwKCkge1xuXHRcdFx0dGhpcy5fcHJldmMgPSBwcm9jZXNzLmNwdVVzYWdlKHRoaXMuX3ByZXZjKTtcblx0XHRcdGxldCBtZW0gPSBwcm9jZXNzLm1lbW9yeVVzYWdlKCksXG5cdFx0XHRcdHJlZzogU25hcFJlZyA9IHtcblx0XHRcdFx0XHRyc3M6IG1lbS5yc3MsXG5cdFx0XHRcdFx0dGg6IG1lbS5oZWFwVG90YWwsXG5cdFx0XHRcdFx0dWg6IG1lbS5oZWFwVXNlZCxcblx0XHRcdFx0XHRleHQ6IG1lbS5leHRlcm5hbCxcblx0XHRcdFx0XHR1czogdGhpcy5fcHJldmMsXG5cdFx0XHRcdFx0bWVtOiBvcy5mcmVlbWVtKClcblx0XHRcdFx0fTtcblx0XHRcdHRoaXMuc2FtcGxlcy5wdXNoKHJlZyk7XG5cdFx0XHRpZiAodGhpcy5zYW1wbGVzLmxlbmd0aCA+IHRoaXMua2VlcFNhbXBsZXMpIHtcblx0XHRcdFx0dGhpcy5zYW1wbGVzLnNoaWZ0KCk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmVtaXQoXCJzbmFwXCIsIHJlZyk7XG5cdFx0XHRyZXR1cm4gcmVnO1xuXHRcdH0gLy9zbmFwXG5cblx0XHQvKipcblx0XHQgKiBzZXRJbnRlcnZhbCBmb3IgbWV0cmljcy5cblx0XHQgKiBcblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBbbXM9MTAwMF1cblx0XHQgKiBAcmV0dXJucyBOb2RlSlMuVGltZW91dFxuXHRcdCAqIEBtZW1iZXJvZiBTdGF0c1xuXHRcdCAqL1xuXHRcdF9iaW5kKG1zID0gMTAwMCkge1xuXHRcdFx0aWYgKCF0aGlzLmJvdW5kKSB7XG5cdFx0XHRcdHJldHVybiBzZXRJbnRlcnZhbCh0aGlzLnNuYXAuYmluZCh0aGlzKSwgbXMpO1xuXHRcdFx0fVxuXHRcdH0gLy9fYmluZFxuXG5cdH0gLy9TdGF0c1xuXHRcbn0gLy9DbGFzc2VzXG5cbmV4cG9ydCBkZWZhdWx0IENsYXNzZXM7XG4iXX0=