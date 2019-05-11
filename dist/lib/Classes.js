"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * IMPL: start/stop webserv
 */
const vserv = tslib_1.__importStar(require("vale-server-ii"));
const socket_io_1 = tslib_1.__importDefault(require("socket.io"));
const readline = tslib_1.__importStar(require("readline"));
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs-extra"));
const util = tslib_1.__importStar(require("util"));
const assert_1 = require("assert");
const socket_1 = tslib_1.__importDefault(require("./socket"));
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
    class Panel extends require("events").EventEmitter {
        constructor(opts = Panel.defaultOpts) {
            super();
            this._rl_paused = false;
            this.cmds = [];
            this._debuglog = "";
            this.refresh = true;
            this.custping = 1000;
            let nopts = {};
            Object.assign(nopts, Panel.defaultOpts);
            Object.assign(nopts, opts);
            this.opts = nopts;
        } //ctor
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
                if (this.sock)
                    this.sock.of("/admin").in("admin").emit("cli", "> " + util.inspect(line));
                let dat;
                try {
                    console.log(dat = util.inspect(await this.cmds.find(cmd => cmd.exp.test(line)).parse(line, this), true));
                }
                catch (err) {
                    console.error(dat = exports.chalk["red"](util.inspect(err)));
                }
                if (this.sock)
                    this.sock.of("/admin").in("admin").emit("cli", util.inspect(dat, {
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
        _debug(...msg) {
            this._debuglog += msg.join(' ') + "  ---  " + Date() + '\n';
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
    class Stats {
        constructor() {
        } //ctor
    } //Stats
    Classes.Stats = Stats;
})(Classes = exports.Classes || (exports.Classes = {})); //Classes
exports.default = Classes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3Nlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9DbGFzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBR2I7O0dBRUc7QUFHSCw4REFBd0M7QUFDeEMsa0VBQStCO0FBQy9CLDJEQUFxQztBQUNyQyxtREFBNkI7QUFDN0IscURBQStCO0FBQy9CLG1EQUE2QjtBQUM3QixtQ0FBd0M7QUFDeEMsOERBQThCO0FBSTlCLElBQUk7SUFDSCxhQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0NBQ3pCO0FBQUMsT0FBTyxHQUFHLEVBQUU7SUFDYixhQUFLLEdBQUcsU0FBUyxLQUFLLENBQUMsTUFBTTtRQUM1QixPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMsQ0FBQztDQUNGO0FBR0QsSUFBYyxPQUFPLENBbU5wQjtBQW5ORCxXQUFjLE9BQU87SUE4QnBCLElBQWlCLE1BQU0sQ0FHdEI7SUFIRCxXQUFpQixNQUFNO1FBQ1QsWUFBSyxHQUFHLElBQUksY0FBYyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDOUQsYUFBTSxHQUFHLElBQUksdUJBQWMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxvQ0FBb0MsRUFBQyxDQUFDLENBQUM7SUFDNUYsQ0FBQyxFQUhnQixNQUFNLEdBQU4sY0FBTSxLQUFOLGNBQU0sUUFHdEIsQ0FBQyxRQUFRO0lBR1YsTUFBYSxPQUFPO1FBV25CLFlBQVksSUFBeUI7WUFOckMsY0FBUyxHQUFXLENBQUMsQ0FBQztZQU9yQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsTUFBTTtRQUVSLFdBQVc7UUFDWCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBYTtRQUUzQixDQUFDLENBQUMsTUFBTTtRQUVSLFdBQVc7UUFDWCxLQUFLLENBQUMsSUFBWSxFQUFFLEtBQVk7WUFFL0IsT0FBTyxJQUFJLENBQUMs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SSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsR0FBRyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFDNUQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUM1QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQyxRQUFRO01BRVQsT0FBTztJQTdIRCxpQkFBVyxHQUFzQjtRQUN2QyxPQUFPLEVBQUU7WUFDUixJQUFJLEVBQUUsSUFBSTtZQUNWLElBQUksRUFBRSxRQUFRO1lBQ2QsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO1NBQ2xDO1FBQ0QsUUFBUSxFQUFFO1lBQ1QsSUFBSSxFQUFFLEtBQUs7WUFDWCxZQUFZLEVBQUUsS0FBSztZQUNuQixXQUFXLEVBQUUsSUFBSTtTQUNqQjtRQUNELElBQUksRUFBRSxXQUFXO0tBQ2pCLENBQUM7SUF4QlUsYUFBSyxRQXlJakIsQ0FBQTtJQUVELE1BQWEsS0FBSztRQUVqQjtRQUVBLENBQUMsQ0FBQyxNQUFNO0tBRVIsQ0FBQyxPQUFPO0lBTkksYUFBSyxRQU1qQixDQUFBO0FBRUYsQ0FBQyxFQW5OYSxPQUFPLEdBQVAsZUFBTyxLQUFQLGVBQU8sUUFtTnBCLENBQUMsU0FBUztBQUVYLGtCQUFlLE9BQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBJTVBMOiBzdGFydC9zdG9wIHdlYnNlcnZcclxuICovXHJcblxyXG5cclxuaW1wb3J0ICogYXMgdnNlcnYgZnJvbSBcInZhbGUtc2VydmVyLWlpXCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcInNvY2tldC5pb1wiO1xyXG5pbXBvcnQgKiBhcyByZWFkbGluZSBmcm9tIFwicmVhZGxpbmVcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnMtZXh0cmFcIjtcclxuaW1wb3J0ICogYXMgdXRpbCBmcm9tIFwidXRpbFwiO1xyXG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCBTb2NrZXQgZnJvbSAnLi9zb2NrZXQnO1xyXG5cclxuZXhwb3J0IHZhciBjaGFsazogRnVuY3Rpb247XHJcblxyXG50cnkge1xyXG5cdGNoYWxrID0gcmVxdWlyZShcImNoYWxrXCIpO1xyXG59IGNhdGNoIChvcHQpIHtcclxuXHRjaGFsayA9IGZ1bmN0aW9uIGNoYWxrKHN0cmluZykge1xyXG5cdFx0cmV0dXJuIHN0cmluZztcclxuXHR9O1xyXG59XHJcblxyXG5cclxuZXhwb3J0IG1vZHVsZSBDbGFzc2VzIHtcclxuXHRcclxuXHRleHBvcnQgZGVjbGFyZSBuYW1lc3BhY2UgT3B0aW9ucyB7XHJcblx0XHRcclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgUGFuZWxPcHRzIHtcclxuXHRcdFx0YXV0aDogc3RyaW5nO1xyXG5cdFx0XHRzdWJvcHRzPzogdnNlcnYuQ2xhc3Nlcy5PcHRpb25zLlNlcnZlck9wdGlvbnM7XHJcblx0XHRcdHNvY2tvcHRzPzogc29ja2V0LlNlcnZlck9wdGlvbnM7XHJcblx0XHR9IC8vUGFuZWxPcHRzXHJcblxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBDb21tYW5kT3B0cyB7XHJcblx0XHRcdG5hbWU6IHN0cmluZztcclxuXHRcdFx0ZXhwOiBSZWdFeHA7XHJcblx0XHRcdGRlc2M6IHN0cmluZztcclxuXHRcdFx0dXNhZ2U6IHN0cmluZztcclxuXHRcdFx0X3ByaW9yaXR5OiBudW1iZXI7XHJcblx0XHRcdF9jb21wbDogc3RyaW5nO1xyXG5cdFx0XHRfZG9tYWluOiBUeXBlcy5ET01BSU5TO1xyXG5cdFx0fSAvL0NvbW1hbmRPcHRzXHJcblx0XHRcclxuXHR9IC8vT3B0aW9uc1xyXG5cclxuXHRleHBvcnQgZGVjbGFyZSBuYW1lc3BhY2UgVHlwZXMge1xyXG5cclxuXHRcdGV4cG9ydCBlbnVtIERPTUFJTlMge1xyXG5cdFx0XHRDTEksIFdTLCBXRUJEQVYsIFVJICAvL2NvbnNvbGUsIHdlYnNvY2tldHMsIHVybCwgaW5hcHAgdWkgdGV4dC1hcmVhXHJcblx0XHR9IC8vRE9NQUlOU1xyXG5cclxuXHR9IC8vVHlwZXNcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFcnJvcnMge1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1JMID0gbmV3IFJlZmVyZW5jZUVycm9yKFwiTm8gc3VpdGFibGUgcmVhZGxpbmUgaW50ZXJmYWNlLlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFQUxSUkwgPSBuZXcgQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBcInJlYWRsaW5lIGludGVyZmFjZSBhbHJlYWR5IGV4aXN0cy5cIn0pO1xyXG5cdH0gLy9FcnJvcnNcclxuXHRcclxuXHJcblx0ZXhwb3J0IGNsYXNzIENvbW1hbmQgaW1wbGVtZW50cyBPcHRpb25zLkNvbW1hbmRPcHRzIHtcclxuXHRcdG5hbWU6IHN0cmluZztcclxuXHRcdGV4cDogUmVnRXhwO1xyXG5cdFx0ZGVzYzogc3RyaW5nO1xyXG5cdFx0dXNhZ2U6IHN0cmluZztcclxuXHRcdF9wcmlvcml0eTogbnVtYmVyID0gMDtcclxuXHRcdF9jb21wbDogc3RyaW5nO1xyXG5cdFx0X2RvbWFpbjogVHlwZXMuRE9NQUlOUztcclxuXHJcblx0XHRzdGF0aWMgcHJlZml4OiBzdHJpbmcgPSBcIlxcXFwuXCI7ICAvL3RvIGJlIGluYydkIGluIHJlZ2V4XHJcblxyXG5cdFx0Y29uc3RydWN0b3IoY3RvcjogT3B0aW9ucy5Db21tYW5kT3B0cykge1xyXG5cdFx0XHRPYmplY3QuYXNzaWduKHRoaXMsIGN0b3IpO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0YXN5bmMgYm9keSguLi5wYXJhbXM6IGFueVtdKSB7XHJcblxyXG5cdFx0fSAvL2JvZHlcclxuXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0cGFyc2UobGluZTogc3RyaW5nLCBwYW5lbDogUGFuZWwpIHtcclxuXHJcblx0XHRcdHJldHVybiB0aGlzLmJvZHkoKTtcclxuXHRcdH0gLy9wYXJzZVxyXG5cclxuXHR9IC8vQ29tbWFuZFxyXG5cclxuXHRleHBvcnQgY2xhc3MgUGFuZWwgZXh0ZW5kcyByZXF1aXJlKFwiZXZlbnRzXCIpLkV2ZW50RW1pdHRlciB7XHJcblx0XHRcclxuXHRcdHJsOiByZWFkbGluZS5JbnRlcmZhY2U7XHJcblx0XHRfcmxfcGF1c2VkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRzZXJ2OiB2c2Vydi5DbGFzc2VzLlNlcnZlcjtcclxuXHRcdHNvY2s6IHNvY2tldC5TZXJ2ZXI7XHJcblx0XHRvcHRzOiBPcHRpb25zLlBhbmVsT3B0cztcclxuXHRcdGNtZHM6IENvbW1hbmRbXSA9IFsgXTtcclxuXHRcdF9kZWJ1Z2xvZzogc3RyaW5nID0gXCJcIjtcclxuXHRcdHJlZnJlc2g6IGJvb2xlYW4gPSB0cnVlO1xyXG5cdFx0Y3VzdHBpbmc6IG51bWJlciA9IDEwMDA7XHJcblxyXG5cdFx0c3RhdGljIGRlZmF1bHRPcHRzOiBPcHRpb25zLlBhbmVsT3B0cyA9IHtcclxuXHRcdFx0c3Vib3B0czoge1xyXG5cdFx0XHRcdHBvcnQ6IDk5OTksXHJcblx0XHRcdFx0cm9vdDogXCIvcGFuZWxcIixcclxuXHRcdFx0XHRzZXJ2ZURpcjogcGF0aC5yZXNvbHZlKFwiX19TZXJ2ZXJcIilcclxuXHRcdFx0fSxcclxuXHRcdFx0c29ja29wdHM6IHtcclxuXHRcdFx0XHRwYXRoOiBcIi93c1wiLFxyXG5cdFx0XHRcdHBpbmdJbnRlcnZhbDogMTAwMDAsXHJcblx0XHRcdFx0c2VydmVDbGllbnQ6IHRydWVcclxuXHRcdFx0fSxcclxuXHRcdFx0YXV0aDogXCJhZG1pbjphZG1cIlxyXG5cdFx0fTtcclxuXHRcdFxyXG5cdFx0Y29uc3RydWN0b3Iob3B0czogT3B0aW9ucy5QYW5lbE9wdHMgPSBQYW5lbC5kZWZhdWx0T3B0cykge1xyXG5cdFx0XHRzdXBlcigpO1xyXG5cdFx0XHRsZXQgbm9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzID0gPE9wdGlvbnMuUGFuZWxPcHRzPnt9O1xyXG5cdFx0XHRcclxuXHRcdFx0T2JqZWN0LmFzc2lnbihub3B0cywgUGFuZWwuZGVmYXVsdE9wdHMpO1xyXG5cdFx0XHRPYmplY3QuYXNzaWduKG5vcHRzLCBvcHRzKTtcclxuXHJcblx0XHRcdHRoaXMub3B0cyA9IG5vcHRzO1xyXG5cdFx0fSAvL2N0b3JcclxuXHRcdFxyXG5cdFx0YXN5bmMgc3RhcnQob3B0czogdnNlcnYuQ2xhc3Nlcy5PcHRpb25zLlNlcnZlck9wdGlvbnMgPSB0aGlzLm9wdHMuc3Vib3B0cykge1xyXG5cdFx0XHR0aGlzLnNlcnYgPSBhd2FpdCB2c2Vydi5TZXJ2ZXIuc2V0dXAob3B0cyk7XHJcblx0XHRcdHRoaXMuc29jayA9IHNvY2tldCh0aGlzLnNlcnYuaHR0cHNydiwgdGhpcy5vcHRzLnNvY2tvcHRzKTtcclxuXHJcblx0XHRcdFNvY2tldC5zZXR1cCh0aGlzLnNvY2ssIHRoaXMpOyAvL01pbmQgdGhlIG9yZGVyISFcclxuXHRcdFx0YXdhaXQgdGhpcy5zZXJ2LmJpbmQoKTtcclxuXHJcblx0XHRcdHRoaXMuc2Vydi5kYXRhW1wiYXV0aFwiXSA9IHRoaXMub3B0cy5hdXRoO1xyXG5cdFx0XHR0aGlzLnNlcnYuZGF0YVtcInBhcmVudFwiXSA9IHRoaXM7XHJcblx0XHRcdHRoaXMuX2RlYnVnKFwiUGFuZWwgU3RhcnRlZC5cIik7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fSAvL3N0YXJ0XHJcblxyXG5cdFx0YXN5bmMgY2xpKHsgaW5wdXQsIG91dHB1dCB9KSB7XHJcblx0XHRcdGlmICghdGhpcy5jbWRzLmxlbmd0aCkgeyBhd2FpdCB0aGlzLl9sb2FkQ0xJKCk7IH1cclxuXHRcdFx0aWYgKHRoaXMucmwpIHRocm93IEVycm9ycy5FQUxSUkw7XHJcblxyXG5cdFx0XHRsZXQgY29tcGxldGVyID0gKGFzeW5jIGZ1bmN0aW9uIGNvbXBsZXRlcihsaW5lOiBzdHJpbmcsIGNiKSB7XHJcblx0XHRcdFx0Y29uc3QgY29tcGxldGlvbnMgPSB0aGlzLmNtZHMubWFwKChjbWQ6IENvbW1hbmQpID0+IGNtZC5fY29tcGwpLFxyXG5cdFx0XHRcdFx0aGl0cyA9IGNvbXBsZXRpb25zLmZpbHRlcigoYzogc3RyaW5nKSA9PiBjLnN0YXJ0c1dpdGgobGluZSkpO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHJldHVybiBjYihudWxsLCBbaGl0cy5sZW5ndGggPyBoaXRzIDogY29tcGxldGlvbnMsIGxpbmVdKTtcclxuXHRcdFx0fSkuYmluZCh0aGlzKTsgLy9jb21wbGV0ZXJcclxuXHJcblx0XHRcdGxldCBybDogcmVhZGxpbmUuSW50ZXJmYWNlID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKHtcclxuXHRcdFx0XHRpbnB1dCwgb3V0cHV0LCBjb21wbGV0ZXJcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRybC5vbihcImxpbmVcIiwgYXN5bmMgbGluZSA9PiB7XHJcblx0XHRcdFx0aWYgKHRoaXMuc29jaykgdGhpcy5zb2NrLm9mKFwiL2FkbWluXCIpLmluKFwiYWRtaW5cIikuZW1pdChcImNsaVwiLCBcIj4gXCIgKyB1dGlsLmluc3BlY3QobGluZSkpO1xyXG5cdFx0XHRcdGxldCBkYXQ7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGRhdCA9IHV0aWwuaW5zcGVjdChhd2FpdCB0aGlzLmNtZHMuZmluZChjbWQgPT4gY21kLmV4cC50ZXN0KGxpbmUpKS5wYXJzZShsaW5lLCB0aGlzKSwgdHJ1ZSkpO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihkYXQgPSBjaGFsa1tcInJlZFwiXSh1dGlsLmluc3BlY3QoZXJyKSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5zb2NrKSB0aGlzLnNvY2sub2YoXCIvYWRtaW5cIikuaW4oXCJhZG1pblwiKS5lbWl0KFwiY2xpXCIsIHV0aWwuaW5zcGVjdChkYXQsIHtcclxuXHRcdFx0XHRcdGNvbG9yczogZmFsc2VcclxuXHRcdFx0XHR9KSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRybC5vbihcInBhdXNlXCIsICgpID0+IHtcclxuXHRcdFx0XHR0aGlzLl9ybF9wYXVzZWQgPSB0cnVlO1xyXG5cdFx0XHRcdHRoaXMuX2RlYnVnKFwiUkwgcGF1c2VkXCIpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmwub24oXCJyZXN1bWVcIiwgKCkgPT4ge1xyXG5cdFx0XHRcdHRoaXMuX3JsX3BhdXNlZCA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMuX2RlYnVnKFwiUkwgcmVzdW1lZFwiKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRyZXR1cm4gdGhpcy5ybCA9IHJsO1xyXG5cdFx0fSAvL2NsaVxyXG5cclxuXHRcdHRvZ2dsZUNMSShzdGF0ZT86IGJvb2xlYW4pIHtcclxuXHRcdFx0aWYgKHRoaXMucmwgJiYgc3RhdGUgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLl9ybF9wYXVzZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMucmwucmVzdW1lKCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRoaXMucmwucGF1c2UoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSBpZiAodGhpcy5ybCkge1xyXG5cdFx0XHRcdGlmIChzdGF0ZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5ybC5yZXN1bWUoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5ybC5wYXVzZSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PUkw7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fSAvL3RvZ2dsZUNMSVxyXG5cclxuXHRcdGFzeW5jIF9sb2FkQ0xJKGZyb206IHN0cmluZyA9IHBhdGguam9pbihcIl9fU2VydmVyXCIsIFwiY29tbWFuZHNcIikpIHtcclxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xyXG5cdFx0XHRcdGZzLnJlYWRkaXIoZnJvbSwgKGVyciwgZmlsZXMpID0+IHtcclxuXHRcdFx0XHRcdGlmICghZXJyKSB7XHJcblx0XHRcdFx0XHRcdGZvciAobGV0IGZpbGUgb2YgZmlsZXMpIHtcclxuXHRcdFx0XHRcdFx0XHRsZXQgZnJtOiBzdHJpbmc7XHJcblx0XHRcdFx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSByZXF1aXJlLmNhY2hlW3JlcXVpcmUucmVzb2x2ZShmcm0gPSBwYXRoLnJlc29sdmUoJy4nICsgcGF0aC5zZXAgKyBwYXRoLmpvaW4oZnJvbSwgZmlsZSkpKV07XHJcblx0XHRcdFx0XHRcdFx0fSBjYXRjaCAoaWduKSB7IH1cclxuXHRcdFx0XHRcdFx0XHR0aGlzLmNtZHMucHVzaChyZXF1aXJlKGZybSkuY29tbWFuZCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdHRoaXMuY21kcy5zb3J0KChhLCBiKSA9PiBhLl9wcmlvcml0eSAtIGIuX3ByaW9yaXR5KTtcclxuXHRcdFx0XHRcdFx0dGhpcy5fZGVidWcoYExvYWRpbmcgQ0xJIGNvbW1hbmRzIGZyb20gJyR7ZnJvbX0nIHN1Y2NlZWRlZC5gKTtcclxuXHRcdFx0XHRcdFx0cmVzKHRoaXMuY21kcyk7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRyZWooZXJyKTtcclxuXHRcdFx0XHRcdFx0dGhpcy5fZGVidWcoYExvYWRpbmcgQ0xJIGNvbW1hbmRzIGZyb20gJyR7ZnJvbX0nIGZhaWxlZC5gKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vX2xvYWRDTElcclxuXHJcblx0XHRfZGVidWcoLi4ubXNnOiBhbnlbXSkge1xyXG5cdFx0XHR0aGlzLl9kZWJ1Z2xvZyArPSBtc2cuam9pbignICcpICsgXCIgIC0tLSAgXCIgKyBEYXRlKCkgKyAnXFxuJztcclxuXHRcdFx0dGhpcy5lbWl0KFwiX2RlYnVnXCIsIC4uLm1zZyk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fSAvL19kZWJ1Z1xyXG5cdFx0XHJcblx0fSAvL1BhbmVsXHJcblxyXG5cdGV4cG9ydCBjbGFzcyBTdGF0cyB7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IoKSB7XHJcblxyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0fSAvL1N0YXRzXHJcblx0XHJcbn0gLy9DbGFzc2VzXHJcblxyXG5leHBvcnQgZGVmYXVsdCBDbGFzc2VzO1xyXG4iXX0=