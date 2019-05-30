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
        /**
         * @description Execute command code.
         * @author V. H.
         * @date 2019-05-30
         * @param {...any[]} params
         * @returns {Promise<any>}
         * @memberof Command
         * @override
         */
        async body(...params) {
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
            this._input = process.stdin;
            this._output = process.stdout;
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
                    dat = await this.cmds.find((cmd) => cmd.exp.test(line)).parse(line, this);
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
                if (this.stat = !this.stat) {
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
        //@Override
        on(event, listener) {
            return super.on(event, listener);
        } //on
        //@Override
        once(event, listener) {
            return super.once(event, listener);
        } //on
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
                this.bound = true;
                return setInterval(this.snap.bind(this), ms);
            }
        } //_bind
        //@Override
        on(event, listener) {
            return super.on(event, listener);
        } //on
        //@Override
        once(event, listener) {
            return super.once(event, listener);
        } //on
    } //Stats
    Classes.Stats = Stats;
})(Classes = exports.Classes || (exports.Classes = {})); //Classes
exports.default = Classes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3Nlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9DbGFzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBRWI7O0dBRUc7QUFFSCxrRUFBK0I7QUFDL0IsOERBQThCO0FBQzlCLDhEQUF3QztBQUN4QyxtQ0FBd0M7QUFDeEMsbUNBQXNDO0FBQ3RDLDJEQUFxQztBQUNyQyxtREFBNkI7QUFDN0IscURBQStCO0FBQy9CLG1EQUE2QjtBQUM3QiwrQ0FBeUI7QUFJekIsSUFBSTtJQUNILGFBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Q0FDekI7QUFBQyxPQUFPLEdBQUcsRUFBRTtJQUNiLGFBQUssR0FBRyxTQUFTLEtBQUssQ0FBQyxNQUFjO1FBQ3BDLE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyxDQUFDO0NBQ0Y7QUFHRCxJQUFjLE9BQU8sQ0F3ZHBCO0FBeGRELFdBQWMsT0FBTztJQXFEcEIsSUFBaUIsTUFBTSxDQUl0QjtJQUpELFdBQWlCLE1BQU07UUFDVCxZQUFLLEdBQW1CLElBQUksY0FBYyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDOUUsYUFBTSxHQUFtQixJQUFJLHVCQUFjLENBQUMsRUFBRSxPQUFPLEVBQUUsb0NBQW9DLEVBQUUsQ0FBQyxDQUFDO1FBQy9GLGNBQU8sR0FBbUIsSUFBSSx1QkFBYyxDQUFDLEVBQUUsT0FBTyxFQUFFLG9CQUFvQixFQUFDLENBQUMsQ0FBQztJQUM3RixDQUFDLEVBSmdCLE1BQU0sR0FBTixjQUFNLEtBQU4sY0FBTSxRQUl0QixDQUFDLFFBQVE7SUFhRyxZQUFJLEdBQVcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRzNDOzs7Ozs7OztPQVFHO0lBQ0gsTUFBYSxPQUFPO1FBV25CLFlBQW1CLElBQXlCO1lBTjVDLGNBQVMsR0FBVyxDQUFDLENBQUM7WUFPckIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxD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SUFBSSxDQUFDLEtBQXNCLEVBQUUsUUFBa0M7WUFDckUsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUMsSUFBSTtLQUVOLENBQUMsT0FBTztJQXRFSSxhQUFLLFFBc0VqQixDQUFBO0FBRUYsQ0FBQyxFQXhkYSxPQUFPLEdBQVAsZUFBTyxLQUFQLGVBQU8sUUF3ZHBCLENBQUMsU0FBUztBQUVYLGtCQUFlLE9BQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuXG4vKlxuICogSU1QTDogc3RhcnQvc3RvcCB3ZWJzZXJ2XG4gKi9cblxuaW1wb3J0IHNvY2tldCBmcm9tIFwic29ja2V0LmlvXCI7XG5pbXBvcnQgU29ja2V0IGZyb20gJy4vc29ja2V0JztcbmltcG9ydCAqIGFzIHZzZXJ2IGZyb20gXCJ2YWxlLXNlcnZlci1paVwiO1xuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tIFwiZXZlbnRzXCI7XG5pbXBvcnQgKiBhcyByZWFkbGluZSBmcm9tIFwicmVhZGxpbmVcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmcy1leHRyYVwiO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tIFwidXRpbFwiO1xuaW1wb3J0ICogYXMgb3MgZnJvbSBcIm9zXCI7XG5cbmV4cG9ydCB2YXIgY2hhbGs6IEZ1bmN0aW9uO1xuXG50cnkge1xuXHRjaGFsayA9IHJlcXVpcmUoXCJjaGFsa1wiKTtcbn0gY2F0Y2ggKG9wdCkge1xuXHRjaGFsayA9IGZ1bmN0aW9uIGNoYWxrKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gc3RyaW5nO1xuXHR9O1xufVxuXG5cbmV4cG9ydCBtb2R1bGUgQ2xhc3NlcyB7XG5cdFxuXHRleHBvcnQgZGVjbGFyZSBuYW1lc3BhY2UgT3B0aW9ucyB7XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogT3B0aW9ucyBmb3IgQ2xhc3Nlcy5QYW5lbFxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQGV4cG9ydFxuXHRcdCAqIEBpbnRlcmZhY2UgUGFuZWxPcHRzXG5cdFx0ICovXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBQYW5lbE9wdHMge1xuXHRcdFx0cmVhZG9ubHkgYXV0aDogc3RyaW5nO1xuXHRcdFx0cmVhZG9ubHkgX3NlcnZlRGlyPzogc3RyaW5nO1xuXHRcdFx0cmVhZG9ubHkgc3Vib3B0cz86IHZzZXJ2LkNsYXNzZXMuT3B0aW9ucy5TZXJ2ZXJPcHRpb25zO1xuXHRcdFx0cmVhZG9ubHkgc29ja29wdHM/OiBzb2NrZXQuU2VydmVyT3B0aW9ucztcblx0XHR9IC8vUGFuZWxPcHRzXG5cblx0XHQvKipcblx0XHQgKiBPcHRpb25zIGZvciBDbGFzc2VzLkNvbW1hbmRcblx0XHQgKiBcblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHRcdCAqIEBleHBvcnRcblx0XHQgKiBAaW50ZXJmYWNlIENvbW1hbmRPcHRzXG5cdFx0ICovXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBDb21tYW5kT3B0cyB7XG5cdFx0XHRyZWFkb25seSBuYW1lOiBzdHJpbmc7XG5cdFx0XHRyZWFkb25seSBleHA6IFJlZ0V4cDtcblx0XHRcdHJlYWRvbmx5IGRlc2M/OiBzdHJpbmc7XG5cdFx0XHRyZWFkb25seSB1c2FnZT86IHN0cmluZztcblx0XHRcdHJlYWRvbmx5IF9wcmlvcml0eTogbnVtYmVyO1xuXHRcdFx0cmVhZG9ubHkgX2NvbXBsOiBzdHJpbmc7XG5cdFx0XHRyZWFkb25seSBfZG9tYWluPzogVHlwZXMuRE9NQUlOUztcblx0XHR9IC8vQ29tbWFuZE9wdHNcblx0XHRcblx0fSAvL09wdGlvbnNcblxuXHRleHBvcnQgZGVjbGFyZSBuYW1lc3BhY2UgVHlwZXMge1xuXG5cdFx0LyoqXG5cdFx0ICogT2Jzb2xldGUuXG5cdFx0ICogXG5cdFx0ICogQGV4cG9ydFxuXHRcdCAqIEBlbnVtIHtudW1iZXJ9XG5cdFx0ICovXG5cdFx0ZXhwb3J0IGVudW0gRE9NQUlOUyB7ICAvL09CU1xuXHRcdFx0Q0xJLCBXUywgV0VCREFWLCBVSSAgLy9jb25zb2xlLCB3ZWJzb2NrZXRzLCB1cmwsIGluYXBwIHVpIHRleHQtYXJlYVxuXHRcdH0gLy9ET01BSU5TXG5cblx0fSAvL1R5cGVzXG5cblx0ZXhwb3J0IG5hbWVzcGFjZSBFcnJvcnMgeyAgLy9VcGRhdGVcblx0XHRleHBvcnQgY29uc3QgRU5PUkw6IFJlZmVyZW5jZUVycm9yID0gbmV3IFJlZmVyZW5jZUVycm9yKFwiTm8gc3VpdGFibGUgcmVhZGxpbmUgaW50ZXJmYWNlLlwiKTtcblx0XHRleHBvcnQgY29uc3QgRUFMUlJMOiBBc3NlcnRpb25FcnJvciA9IG5ldyBBc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IFwicmVhZGxpbmUgaW50ZXJmYWNlIGFscmVhZHkgZXhpc3RzLlwiIH0pO1xuXHRcdGV4cG9ydCBjb25zdCBFQUxSTElTOiBBc3NlcnRpb25FcnJvciA9IG5ldyBBc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IFwiQWxyZWFkeSBsaXN0ZW5pbmcuXCJ9KTtcblx0fSAvL0Vycm9yc1xuXG5cdGV4cG9ydCB0eXBlIFNuYXBSZWcgPSB7XG5cdFx0cmVhZG9ubHkgcnNzOiBudW1iZXI7XG5cdFx0cmVhZG9ubHkgdGg6IG51bWJlcjtcblx0XHRyZWFkb25seSB1aDogbnVtYmVyO1xuXHRcdHJlYWRvbmx5IGV4dDogbnVtYmVyO1xuXG5cdFx0cmVhZG9ubHkgbWVtOiBudW1iZXI7ICAvL2ZyZWVtZW0vdG90YWxtZW1cblxuXHRcdHJlYWRvbmx5IHVzOiBOb2RlSlMuQ3B1VXNhZ2U7XG5cdH07XG5cblx0ZXhwb3J0IGNvbnN0IE51bGw6IHN5bWJvbCA9IFN5bWJvbChcIk5VTExcIik7XG5cdFxuXHRcblx0LyoqXG5cdCAqIEZvciBDTEkgY29tbWFuZHMuXG5cdCAqIFxuXHQgKiBAYXV0aG9yIFYuIEguXG5cdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0ICogQGV4cG9ydFxuXHQgKiBAY2xhc3MgQ29tbWFuZFxuXHQgKiBAaW1wbGVtZW50cyB7T3B0aW9ucy5Db21tYW5kT3B0c31cblx0ICovXG5cdGV4cG9ydCBjbGFzcyBDb21tYW5kIGltcGxlbWVudHMgT3B0aW9ucy5Db21tYW5kT3B0cyB7XG5cdFx0bmFtZTogc3RyaW5nO1xuXHRcdGV4cDogUmVnRXhwO1xuXHRcdGRlc2M/OiBzdHJpbmc7XG5cdFx0dXNhZ2U/OiBzdHJpbmc7XG5cdFx0X3ByaW9yaXR5OiBudW1iZXIgPSAwO1xuXHRcdF9jb21wbDogc3RyaW5nO1xuXHRcdF9kb21haW4/OiBUeXBlcy5ET01BSU5TO1xuXG5cdFx0cHVibGljIHN0YXRpYyBwcmVmaXg6IHN0cmluZyA9IFwiXFxcXC5cIjsgIC8vdG8gYmUgaW5jJ2QgaW4gcmVnZXhcblxuXHRcdHB1YmxpYyBjb25zdHJ1Y3RvcihjdG9yOiBPcHRpb25zLkNvbW1hbmRPcHRzKSB7XG5cdFx0XHRPYmplY3QuYXNzaWduKHRoaXMsIGN0b3IpO1xuXHRcdH0gLy9jdG9yXG5cblx0XHQvL0BPdmVycmlkZVxuXHRcdC8qKlxuXHRcdCAqIEBkZXNjcmlwdGlvbiBFeGVjdXRlIGNvbW1hbmQgY29kZS5cblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0zMFxuXHRcdCAqIEBwYXJhbSB7Li4uYW55W119IHBhcmFtc1xuXHRcdCAqIEByZXR1cm5zIHtQcm9taXNlPGFueT59XG5cdFx0ICogQG1lbWJlcm9mIENvbW1hbmRcblx0XHQgKiBAb3ZlcnJpZGVcblx0XHQgKi9cblx0XHRwdWJsaWMgYXN5bmMgYm9keSguLi5wYXJhbXM6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcblxuXHRcdH0gLy9ib2R5XG5cblx0XHQvL0BPdmVycmlkZVxuXHRcdC8qKlxuXHRcdCAqIEBkZXNjcmlwdGlvbiBTYW5pdGl6ZSBiZWZvcmUgY2FsbGluZyBgYm9keWBcblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0zMFxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBsaW5lXG5cdFx0ICogQHBhcmFtIHtQYW5lbH0gcGFuZWxcblx0XHQgKiBAcmV0dXJucyB7Kn1cblx0XHQgKiBAbWVtYmVyb2YgQ29tbWFuZFxuXHRcdCAqIEBvdmVycmlkZVxuXHRcdCAqL1xuXHRcdHB1YmxpYyBwYXJzZShsaW5lOiBzdHJpbmcsIHBhbmVsOiBQYW5lbCk6IGFueSB7XG5cblx0XHRcdHJldHVybiB0aGlzLmJvZHkoKTtcblx0XHR9IC8vcGFyc2VcblxuXHR9IC8vQ29tbWFuZFxuXG5cdC8qKlxuXHQgKiBTdGFydGluZyBJbnRlcmZhY2UuXG5cdCAqIFxuXHQgKiBAYXV0aG9yIFYuIEguXG5cdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0ICogQGV4cG9ydFxuXHQgKiBAY2xhc3MgUGFuZWxcblx0ICogQGV4dGVuZHMge0V2ZW50RW1pdHRlcn1cblx0ICovXG5cdGV4cG9ydCBjbGFzcyBQYW5lbCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cdFx0XG5cdFx0cmw6IHJlYWRsaW5lLkludGVyZmFjZTtcblx0XHRwcml2YXRlIF9ybF9wYXVzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblx0XHRzZXJ2OiB2c2Vydi5DbGFzc2VzLlNlcnZlcjtcblx0XHRzb2NrOiBzb2NrZXQuU2VydmVyO1xuXHRcdG9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzO1xuXHRcdGNtZHM6IENvbW1hbmRbXSA9IFsgXTtcblx0XHRfZGVidWdsb2c6IHN0cmluZyA9IFwiXCI7XG5cdFx0X3JsbG9nOiBzdHJpbmcgPSBcIlwiO1xuXHRcdHJlZnJlc2g6IGJvb2xlYW4gPSB0cnVlO1xuXHRcdGN1c3RwaW5nOiBudW1iZXIgPSAxMDAwO1xuXHRcdHN0YXQ6IGJvb2xlYW4gPSBmYWxzZTtcblx0XHRwcml2YXRlIF9zdGF0czogTm9kZUpTLlRpbWVvdXQ7XG5cdFx0cmVhZG9ubHkgc3RhdGVyOiBTdGF0cyA9IG5ldyBTdGF0cztcblx0XHRfaW5wdXQ6IE5vZGVKUy5SZWFkU3RyZWFtID0gcHJvY2Vzcy5zdGRpbjtcblx0XHRfb3V0cHV0OiBOb2RlSlMuV3JpdGVTdHJlYW0gPSBwcm9jZXNzLnN0ZG91dDtcblx0XHRfZXJyb3I6IE5vZGVKUy5Xcml0ZVN0cmVhbSA9IHByb2Nlc3Muc3RkZXJyO1xuXHRcdFxuXG5cdFx0cHVibGljIHN0YXRpYyBkZWZhdWx0T3B0czogT3B0aW9ucy5QYW5lbE9wdHMgPSB7XG5cdFx0XHRzdWJvcHRzOiB7XG5cdFx0XHRcdHBvcnQ6IDk5OTksXG5cdFx0XHRcdHJvb3Q6IFwiL3BhbmVsXCIsXG5cdFx0XHRcdHNlcnZlRGlyOiBwYXRoLnJlc29sdmUoXCJfX1NlcnZlclwiKVxuXHRcdFx0fSxcblx0XHRcdHNvY2tvcHRzOiB7XG5cdFx0XHRcdHBhdGg6IFwiL3dzXCIsXG5cdFx0XHRcdHBpbmdJbnRlcnZhbDogMTAwMDAsXG5cdFx0XHRcdHNlcnZlQ2xpZW50OiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0YXV0aDogXCJhZG1pbjphZG1cIixcblx0XHRcdF9zZXJ2ZURpcjogcGF0aC5yZXNvbHZlKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi5cIiwgXCIuLlwiKSwgXCJfX1NlcnZlclwiKVxuXHRcdH07XG5cdFx0XG5cdFx0cHVibGljIGNvbnN0cnVjdG9yKG9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzID0gUGFuZWwuZGVmYXVsdE9wdHMpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0XHRsZXQgbm9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzID0gPE9wdGlvbnMuUGFuZWxPcHRzPnt9O1xuXHRcdFx0XG5cdFx0XHRPYmplY3QuYXNzaWduKG5vcHRzLCBQYW5lbC5kZWZhdWx0T3B0cyk7XG5cdFx0XHRPYmplY3QuYXNzaWduKG5vcHRzLCBvcHRzKTtcblxuXHRcdFx0dGhpcy5vcHRzID0gbm9wdHM7XG5cdFx0fSAvL2N0b3Jcblx0XHRcblx0XHQvKipcblx0XHQgKiBTdGFydCB0aGUgc2VydmVyIGFuZCBzb2NrZXQuXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0ge3ZzZXJ2LkNsYXNzZXMuT3B0aW9ucy5TZXJ2ZXJPcHRpb25zfSBbb3B0cz10aGlzLm9wdHMuc3Vib3B0c11cblx0XHQgKiBAcmV0dXJucyB0aGlzXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0cHVibGljIGFzeW5jIHN0YXJ0KG9wdHM6IHZzZXJ2LkNsYXNzZXMuT3B0aW9ucy5TZXJ2ZXJPcHRpb25zID0gdGhpcy5vcHRzLnN1Ym9wdHMpOiBQcm9taXNlPHRoaXM+IHtcblx0XHRcdGlmICh0aGlzLnNlcnYgJiYgdGhpcy5zZXJ2Lmh0dHBzcnYubGlzdGVuaW5nKSB0aHJvdyBFcnJvcnMuRUFMUkxJUztcblxuXHRcdFx0dGhpcy5zZXJ2ID0gYXdhaXQgdnNlcnYuU2VydmVyLnNldHVwKG9wdHMpO1xuXHRcdFx0dGhpcy5zb2NrID0gc29ja2V0KHRoaXMuc2Vydi5odHRwc3J2LCB0aGlzLm9wdHMuc29ja29wdHMpO1xuXG5cdFx0XHRTb2NrZXQuc2V0dXAodGhpcy5zb2NrLCB0aGlzKTsgLy9NaW5kIHRoZSBvcmRlciEhXG5cdFx0XHRhd2FpdCB0aGlzLnNlcnYuYmluZCgpO1xuXG5cdFx0XHR0aGlzLnNlcnYuZGF0YVtcImF1dGhcIl0gPSB0aGlzLm9wdHMuYXV0aDtcblx0XHRcdHRoaXMuc2Vydi5kYXRhW1wicGFyZW50XCJdID0gdGhpcztcblx0XHRcdHRoaXMuX2RlYnVnKFwiUGFuZWwgU3RhcnRlZC5cIik7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9IC8vc3RhcnRcblxuXHRcdC8qKlxuXHRcdCAqIFN0YXJ0IGEgcmVhZGxpbmUuSW50ZXJmYWNlXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0geyp9IHsgaW5wdXQsIG91dHB1dCB9XG5cdFx0ICogQHJldHVybnMgcmVhZGxpbmUuSW50ZXJmYWNlXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0cHVibGljIGFzeW5jIGNsaSh7IGlucHV0LCBvdXRwdXQgfTogeyBpbnB1dDogTm9kZUpTLlJlYWRTdHJlYW0sIG91dHB1dDogTm9kZUpTLldyaXRlU3RyZWFtLCBlcnJvcjogTm9kZUpTLldyaXRlU3RyZWFtfSkge1xuXHRcdFx0aWYgKCF0aGlzLmNtZHMubGVuZ3RoKSB7IGF3YWl0IHRoaXMuX2xvYWRDTEkoKTsgfVxuXHRcdFx0aWYgKHRoaXMucmwpIHRocm93IEVycm9ycy5FQUxSUkw7XG5cblx0XHRcdHRoaXMuX291dHB1dCA9IG91dHB1dDtcblx0XHRcdHRoaXMuX2lucHV0ID0gaW5wdXQ7XG5cdFx0XHRcblx0XHRcdGxldCBjb21wbGV0ZXI6IHJlYWRsaW5lLkFzeW5jQ29tcGxldGVyID0gKGFzeW5jIGZ1bmN0aW9uIGNvbXBsZXRlcihsaW5lOiBzdHJpbmcsIGNiOiAoZXJyPzogRXJyb3IsIHJlc3VsdD86IFtzdHJpbmdbXSwgc3RyaW5nXSkgPT4gdm9pZCk6IFByb21pc2U8YW55PiB7XG5cdFx0XHRcdGNvbnN0IGNvbXBsZXRpb25zOiBzdHJpbmdbXSA9IHRoaXMuY21kcy5tYXAoKGNtZDogQ29tbWFuZCkgPT4gY21kLl9jb21wbCksXG5cdFx0XHRcdFx0aGl0czogc3RyaW5nW10gPSBjb21wbGV0aW9ucy5maWx0ZXIoKGM6IHN0cmluZyk6IGJvb2xlYW4gPT4gYy5zdGFydHNXaXRoKGxpbmUpKTtcblx0XHRcdFx0XG5cdFx0XHRcdHJldHVybiBjYihudWxsLCBbaGl0cy5sZW5ndGggPyBoaXRzIDogY29tcGxldGlvbnMsIGxpbmVdKTtcblx0XHRcdH0pLmJpbmQodGhpcyk7IC8vY29tcGxldGVyXG5cblx0XHRcdGxldCBybDogcmVhZGxpbmUuSW50ZXJmYWNlID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKHtcblx0XHRcdFx0aW5wdXQsIG91dHB1dCwgY29tcGxldGVyXG5cdFx0XHR9KTtcblxuXHRcdFx0cmwub24oXCJsaW5lXCIsIGFzeW5jIChsaW5lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+ID0+IHtcblx0XHRcdFx0bGluZSA9IGxpbmUudHJpbSgpO1xuXG5cdFx0XHRcdGxldCB0bXA6IHN0cmluZyxcblx0XHRcdFx0XHRkYXQ6IGFueTtcblx0XHRcdFx0XG5cdFx0XHRcdGlmICh0aGlzLnNvY2spIHRoaXMuc29jay5vZihcIi9hZG1pblwiKS5pbihcImFkbWluXCIpLmVtaXQoXCJjbGlcIiwgdG1wID0gKFwiPiBcIiArIHV0aWwuaW5zcGVjdChsaW5lLCB7IGNvbG9yczogZmFsc2UgfSkpKTtcblx0XHRcdFx0dGhpcy5fcmxsb2cgKz0gdG1wICsgXCIgIC0tLSAgXCIgKyBEYXRlKCkgKyBvcy5FT0w7XG5cdFx0XHRcdFxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGRhdCA9IGF3YWl0IHRoaXMuY21kcy5maW5kKChjbWQ6IENvbW1hbmQpOiBib29sZWFuID0+IGNtZC5leHAudGVzdChsaW5lKSkucGFyc2UobGluZSwgdGhpcyk7XG5cdFx0XHRcdFx0aWYgKGRhdCAhPT0gTnVsbCkgY29uc29sZS5sb2coZGF0ID0gdXRpbC5pbnNwZWN0KGRhdCwgdHJ1ZSkpO1xuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGRhdCA9IGNoYWxrW1wicmVkXCJdKHV0aWwuaW5zcGVjdChlcnIpKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdGlmICh0aGlzLnNvY2sgJiYgZGF0ICE9PSBOdWxsKSB0aGlzLnNvY2sub2YoXCIvYWRtaW5cIikuaW4oXCJhZG1pblwiKS5lbWl0KFwiY2xpXCIsIHRtcCA9IHV0aWwuaW5zcGVjdChkYXQsIHsgY29sb3JzOiBmYWxzZSB9KSk7XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLl9ybGxvZyArPSB0bXAgKyBcIiAgLS0tICBcIiArIERhdGUoKSArIG9zLkVPTDtcblx0XHRcdH0pO1xuXHRcdFx0cmwub24oXCJwYXVzZVwiLCAoKTogdm9pZCA9PiB7XG5cdFx0XHRcdHRoaXMuX3JsX3BhdXNlZCA9IHRydWU7XG5cdFx0XHRcdHRoaXMuX2RlYnVnKFwiUkwgcGF1c2VkXCIpO1xuXHRcdFx0fSk7XG5cdFx0XHRybC5vbihcInJlc3VtZVwiLCAoKTogdm9pZCA9PiB7XG5cdFx0XHRcdHRoaXMuX3JsX3BhdXNlZCA9IGZhbHNlO1xuXHRcdFx0XHR0aGlzLl9kZWJ1ZyhcIlJMIHJlc3VtZWRcIik7XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHRoaXMucmwgPSBybDtcblx0XHR9IC8vY2xpXG5cblx0XHQvKipcblx0XHQgKiBUb2dnbGUgcmVhZGxpbmUuSW50ZXJmYWNlXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdGF0ZV1cblx0XHQgKiBAcmV0dXJucyBcblx0XHQgKiBAbWVtYmVyb2YgUGFuZWxcblx0XHQgKi9cblx0XHRwdWJsaWMgdG9nZ2xlQ0xJKHN0YXRlPzogYm9vbGVhbik6IHRoaXMge1xuXHRcdFx0aWYgKHRoaXMucmwgJiYgc3RhdGUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRpZiAodGhpcy5fcmxfcGF1c2VkKSB7XG5cdFx0XHRcdFx0dGhpcy5ybC5yZXN1bWUoKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnJsLnBhdXNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAodGhpcy5ybCkge1xuXHRcdFx0XHRpZiAoc3RhdGUpIHtcblx0XHRcdFx0XHR0aGlzLnJsLnJlc3VtZSgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMucmwucGF1c2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1JMO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9IC8vdG9nZ2xlQ0xJXG5cblx0XHQvKipcblx0XHQgKiBUb2dnbGUgU3RhdGVyLlxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IFttc11cblx0XHQgKiBAcmV0dXJucyB0aGlzXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0cHVibGljIHRvZ2dsZVN0YXRzKGZvcmNlPzogYm9vbGVhbiwgbXM/OiBudW1iZXIpOiB0aGlzIHtcblx0XHRcdGlmIChmb3JjZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGlmICh0aGlzLnN0YXQgPSBmb3JjZSkge1xuXHRcdFx0XHRcdHRoaXMuX3N0YXRzID0gdGhpcy5zdGF0ZXIuX2JpbmQobXMpO1xuXHRcdFx0XHRcdHRoaXMuX2RlYnVnKFwiU3RhdGluZyBzdGFydGVkLlwiKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjbGVhckludGVydmFsKHRoaXMuX3N0YXRzKTtcblx0XHRcdFx0XHR0aGlzLl9kZWJ1ZyhcIlN0YXRpbmcgc3RvcHBlZC5cIik7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0aGlzLnN0YXQgPSAhdGhpcy5zdGF0KSB7XG5cdFx0XHRcdFx0dGhpcy5fc3RhdHMgPSB0aGlzLnN0YXRlci5fYmluZChtcyk7XG5cdFx0XHRcdFx0dGhpcy5fZGVidWcoXCJTdGF0aW5nIHN0YXJ0ZWQuXCIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNsZWFySW50ZXJ2YWwodGhpcy5fc3RhdHMpO1xuXHRcdFx0XHRcdHRoaXMuX2RlYnVnKFwiU3RhdGluZyBzdG9wcGVkLlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9IC8vdG9nZ2xlU3RhdHNcblxuXHRcdC8qKlxuXHRcdCAqIExvYWQgQ0xJIGNvbW1hbmRzLlxuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IFtmcm9tPXBhdGguam9pbihcIl9fU2VydmVyXCIsIFwiY29tbWFuZHNcIildXG5cdFx0ICogQHJldHVybnMgdGhpcy5jbWRzXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0YXN5bmMgX2xvYWRDTEkoZnJvbTogc3RyaW5nID0gcGF0aC5qb2luKFwiX19TZXJ2ZXJcIiwgXCJjb21tYW5kc1wiKSk6IFByb21pc2U8Q29tbWFuZFtdPiB7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlczogKHZhbHVlPzogQ29tbWFuZFtdIHwgUHJvbWlzZUxpa2U8Q29tbWFuZFtdPikgPT4gdm9pZCwgcmVqOiAocmVhc29uPzogYW55KSA9PiB2b2lkKTogdm9pZCA9PiB7XG5cdFx0XHRcdGZzLnJlYWRkaXIoZnJvbSwgKGVycjogRXJyb3IsIGZpbGVzOiBzdHJpbmdbXSk6IHZvaWQgPT4ge1xuXHRcdFx0XHRcdGlmICghZXJyKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGxldCBmaWxlIG9mIGZpbGVzKSB7XG5cdFx0XHRcdFx0XHRcdGxldCBmcm06IHN0cmluZztcblxuXHRcdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSByZXF1aXJlLmNhY2hlW3JlcXVpcmUucmVzb2x2ZShmcm0gPSBwYXRoLnJlc29sdmUoJy4nICsgcGF0aC5zZXAgKyBwYXRoLmpvaW4oZnJvbSwgZmlsZSkpKV07XG5cdFx0XHRcdFx0XHRcdH0gY2F0Y2ggKGlnbikgeyB9XG5cblx0XHRcdFx0XHRcdFx0dGhpcy5jbWRzLnB1c2gocmVxdWlyZShmcm0pLmNvbW1hbmQpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR0aGlzLmNtZHMuc29ydCgoYTogQ29tbWFuZCwgYjogQ29tbWFuZCk6IG51bWJlciA9PiBhLl9wcmlvcml0eSAtIGIuX3ByaW9yaXR5KTtcblx0XHRcdFx0XHRcdHRoaXMuX2RlYnVnKGBMb2FkaW5nIENMSSBjb21tYW5kcyBmcm9tICcke2Zyb219JyBzdWNjZWVkZWQuYCk7XG5cdFx0XHRcdFx0XHRyZXModGhpcy5jbWRzKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmVqKGVycik7XG5cdFx0XHRcdFx0XHR0aGlzLl9kZWJ1ZyhgTG9hZGluZyBDTEkgY29tbWFuZHMgZnJvbSAnJHtmcm9tfScgZmFpbGVkLmApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9IC8vX2xvYWRDTElcblxuXHRcdC8qKlxuXHRcdCAqIFdyaXRlIHRvIF9kZWJ1Z2xvZ1xuXHRcdCAqIFxuXHRcdCAqIEBhdXRob3IgVi4gSC5cblx0XHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdFx0ICogQHBhcmFtIHsuLi5hbnlbXX0gbXNnXG5cdFx0ICogQHJldHVybnMgXG5cdFx0ICogQG1lbWJlcm9mIFBhbmVsXG5cdFx0ICovXG5cdFx0X2RlYnVnKC4uLm1zZzogYW55W10pOiB0aGlzIHtcblx0XHRcdHRoaXMuX2RlYnVnbG9nICs9IG1zZy5qb2luKCcgJykgKyBcIiAgLS0tICBcIiArIERhdGUoKSArIG9zLkVPTDtcblx0XHRcdHRoaXMuZW1pdChcIl9kZWJ1Z1wiLCAuLi5tc2cpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSAvL19kZWJ1Z1xuXG5cdFx0Ly9AT3ZlcnJpZGVcblx0XHRwdWJsaWMgb24oZXZlbnQ6IFwiX2RlYnVnXCIsIGxpc3RlbmVyOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQpOiB0aGlzO1xuXHRcdC8vQE92ZXJyaWRlXG5cdFx0cHVibGljIG9uKGV2ZW50OiBzdHJpbmcgfCBzeW1ib2wsIGxpc3RlbmVyOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQpOiB0aGlzIHtcblx0XHRcdHJldHVybiBzdXBlci5vbihldmVudCwgbGlzdGVuZXIpO1xuXHRcdH0gLy9vblxuXHRcdC8vQE92ZXJyaWRlXG5cdFx0cHVibGljIG9uY2UoZXZlbnQ6IFwiX2RlYnVnXCIsIGxpc3RlbmVyOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQpOiB0aGlzO1xuXHRcdC8vQE92ZXJyaWRlXG5cdFx0cHVibGljIG9uY2UoZXZlbnQ6IHN0cmluZyB8IHN5bWJvbCwgbGlzdGVuZXI6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCk6IHRoaXMge1xuXHRcdFx0cmV0dXJuIHN1cGVyLm9uY2UoZXZlbnQsIGxpc3RlbmVyKTtcblx0XHR9IC8vb25cblx0XHRcblx0fSAvL1BhbmVsXG5cblx0LyoqXG5cdCAqIFN0YXRlciBDbGFzcyBmb3IgbWV0cmljcy5cblx0ICogXG5cdCAqIEBhdXRob3IgVi4gSC5cblx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHQgKiBAZXhwb3J0XG5cdCAqIEBjbGFzcyBTdGF0c1xuXHQgKiBAZXh0ZW5kcyB7RXZlbnRFbWl0dGVyfVxuXHQgKi9cblx0ZXhwb3J0IGNsYXNzIFN0YXRzIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuXHRcdGtlZXBTYW1wbGVzOiBudW1iZXIgPSAxMDA7XG5cdFx0cHJpdmF0ZSBfcHJldmM6IE5vZGVKUy5DcHVVc2FnZSA9IHByb2Nlc3MuY3B1VXNhZ2UoKTtcblx0XHRzYW1wbGVzOiBTbmFwUmVnW10gPSBbIF07XG5cdFx0cHJpdmF0ZSBib3VuZDogYm9vbGVhbjtcblxuXHRcdHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0fSAvL2N0b3JcblxuXHRcdC8qKlxuXHRcdCAqIFRha2UgYSBtZXRyaWMgc25hcHNob3QuXG5cdFx0ICogXG5cdFx0ICogQGF1dGhvciBWLiBILlxuXHRcdCAqIEBkYXRlIDIwMTktMDUtMTJcblx0XHQgKiBAcmV0dXJucyB7U25hcFJlZ31cblx0XHQgKiBAbWVtYmVyb2YgU3RhdHNcblx0XHQgKi9cblx0XHRwdWJsaWMgc25hcCgpOiBTbmFwUmVnIHtcblx0XHRcdHRoaXMuX3ByZXZjID0gcHJvY2Vzcy5jcHVVc2FnZSh0aGlzLl9wcmV2Yyk7XG5cdFx0XHRsZXQgbWVtOiBOb2RlSlMuTWVtb3J5VXNhZ2UgPSBwcm9jZXNzLm1lbW9yeVVzYWdlKCksXG5cdFx0XHRcdHJlZzogU25hcFJlZyA9IHtcblx0XHRcdFx0XHRyc3M6IG1lbS5yc3MsXG5cdFx0XHRcdFx0dGg6IG1lbS5oZWFwVG90YWwsXG5cdFx0XHRcdFx0dWg6IG1lbS5oZWFwVXNlZCxcblx0XHRcdFx0XHRleHQ6IG1lbS5leHRlcm5hbCxcblx0XHRcdFx0XHR1czogdGhpcy5fcHJldmMsXG5cdFx0XHRcdFx0bWVtOiBvcy5mcmVlbWVtKClcblx0XHRcdFx0fTtcblx0XHRcdFxuXHRcdFx0dGhpcy5zYW1wbGVzLnB1c2gocmVnKTtcblxuXHRcdFx0aWYgKHRoaXMuc2FtcGxlcy5sZW5ndGggPiB0aGlzLmtlZXBTYW1wbGVzKSB7XG5cdFx0XHRcdHRoaXMuc2FtcGxlcy5zaGlmdCgpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmVtaXQoXCJzbmFwXCIsIHJlZyk7XG5cdFx0XHRyZXR1cm4gcmVnO1xuXHRcdH0gLy9zbmFwXG5cblx0XHQvKipcblx0XHQgKiBzZXRJbnRlcnZhbCBmb3IgbWV0cmljcy5cblx0XHQgKiBcblx0XHQgKiBAYXV0aG9yIFYuIEguXG5cdFx0ICogQGRhdGUgMjAxOS0wNS0xMlxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBbbXM9MTAwMF1cblx0XHQgKiBAcmV0dXJucyBOb2RlSlMuVGltZW91dFxuXHRcdCAqIEBtZW1iZXJvZiBTdGF0c1xuXHRcdCAqL1xuXHRcdF9iaW5kKG1zOiBudW1iZXIgPSAxMDAwKTogTm9kZUpTLlRpbWVvdXQge1xuXHRcdFx0aWYgKCF0aGlzLmJvdW5kKSB7XG5cdFx0XHRcdHRoaXMuYm91bmQgPSB0cnVlO1xuXHRcdFx0XHRyZXR1cm4gc2V0SW50ZXJ2YWwodGhpcy5zbmFwLmJpbmQodGhpcyksIG1zKTtcblx0XHRcdH1cblx0XHR9IC8vX2JpbmRcblxuXHRcdC8vQE92ZXJyaWRlXG5cdFx0cHVibGljIG9uKGV2ZW50OiBcInNuYXBcIiwgbGlzdGVuZXI6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCk6IHRoaXM7XG5cdFx0Ly9AT3ZlcnJpZGVcblx0XHRwdWJsaWMgb24oZXZlbnQ6IHN0cmluZyB8IHN5bWJvbCwgbGlzdGVuZXI6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCk6IHRoaXMge1xuXHRcdFx0cmV0dXJuIHN1cGVyLm9uKGV2ZW50LCBsaXN0ZW5lcik7XG5cdFx0fSAvL29uXG5cdFx0Ly9AT3ZlcnJpZGVcblx0XHRwdWJsaWMgb25jZShldmVudDogXCJzbmFwXCIsIGxpc3RlbmVyOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQpOiB0aGlzO1xuXHRcdC8vQE92ZXJyaWRlXG5cdFx0cHVibGljIG9uY2UoZXZlbnQ6IHN0cmluZyB8IHN5bWJvbCwgbGlzdGVuZXI6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCk6IHRoaXMge1xuXHRcdFx0cmV0dXJuIHN1cGVyLm9uY2UoZXZlbnQsIGxpc3RlbmVyKTtcblx0XHR9IC8vb25cblxuXHR9IC8vU3RhdHNcblx0XG59IC8vQ2xhc3Nlc1xuXG5leHBvcnQgZGVmYXVsdCBDbGFzc2VzO1xuIl19