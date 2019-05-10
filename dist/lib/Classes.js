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
const fs = tslib_1.__importStar(require("fs"));
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
                try {
                    console.log(await this.cmds.find(cmd => cmd.exp.test(line)).parse(line, this));
                }
                catch (err) {
                    console.error(exports.chalk["red"](util.inspect(err)));
                }
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
            root: "/panel"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3Nlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9DbGFzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBR2I7O0dBRUc7QUFHSCw4REFBd0M7QUFDeEMsa0VBQStCO0FBQy9CLDJEQUFxQztBQUNyQyxtREFBNkI7QUFDN0IsK0NBQXlCO0FBQ3pCLG1EQUE2QjtBQUM3QixtQ0FBd0M7QUFDeEMsOERBQThCO0FBSzlCLElBQUk7SUFDSCxhQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0NBQ3pCO0FBQUMsT0FBTyxHQUFHLEVBQUU7SUFDYixhQUFLLEdBQUcsU0FBUyxLQUFLLENBQUMsTUFBTTtRQUM1QixPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMsQ0FBQztDQUNGO0FBR0QsSUFBYyxPQUFPLENBME1wQjtBQTFNRCxXQUFjLE9BQU87SUE4QnBCLElBQWlCLE1BQU0sQ0FHdEI7SUFIRCxXQUFpQixNQUFNO1FBQ1QsWUFBSyxHQUFHLElBQUksY0FBYyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDOUQsYUFBTSxHQUFHLElBQUksdUJBQWMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxvQ0FBb0MsRUFBQyxDQUFDLENBQUM7SUFDNUYsQ0FBQyxFQUhnQixNQUFNLEdBQU4sY0FBTSxLQUFOLGNBQU0sUUFHdEIsQ0FBQyxRQUFRO0lBR1YsTUFBYSxPQUFPO1FBV25CLFlBQVksSUFBeUI7WUFOckMsY0FBUyxHQUFXLENBQUMsQ0FBQztZQU9yQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsTUFBTTtRQUVSLFdBQVc7UUFDWCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBYTtRQUUzQixDQUFDLENBQUMsTUFBTTtRQUVSLFdBQVc7UUFDWCxLQUFLLENBQUMsSUFBWSxFQUFFLEtBQVk7WUFFL0IsT0FBTyxJQUFJLENBQUMs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dXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBJTVBMOiBzdGFydC9zdG9wIHdlYnNlcnZcclxuICovXHJcblxyXG5cclxuaW1wb3J0ICogYXMgdnNlcnYgZnJvbSBcInZhbGUtc2VydmVyLWlpXCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcInNvY2tldC5pb1wiO1xyXG5pbXBvcnQgKiBhcyByZWFkbGluZSBmcm9tIFwicmVhZGxpbmVcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0ICogYXMgdXRpbCBmcm9tIFwidXRpbFwiO1xyXG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCBTb2NrZXQgZnJvbSAnLi9zb2NrZXQnO1xyXG5pbXBvcnQgeyBEb21haW4gfSBmcm9tICdkb21haW4nO1xyXG5cclxuZXhwb3J0IHZhciBjaGFsazogRnVuY3Rpb247XHJcblxyXG50cnkge1xyXG5cdGNoYWxrID0gcmVxdWlyZShcImNoYWxrXCIpO1xyXG59IGNhdGNoIChvcHQpIHtcclxuXHRjaGFsayA9IGZ1bmN0aW9uIGNoYWxrKHN0cmluZykge1xyXG5cdFx0cmV0dXJuIHN0cmluZztcclxuXHR9O1xyXG59XHJcblxyXG5cclxuZXhwb3J0IG1vZHVsZSBDbGFzc2VzIHtcclxuXHRcclxuXHRleHBvcnQgZGVjbGFyZSBuYW1lc3BhY2UgT3B0aW9ucyB7XHJcblx0XHRcclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgUGFuZWxPcHRzIHtcclxuXHRcdFx0YXV0aDogc3RyaW5nO1xyXG5cdFx0XHRzdWJvcHRzPzogdnNlcnYuQ2xhc3Nlcy5PcHRpb25zLlNlcnZlck9wdGlvbnM7XHJcblx0XHRcdHNvY2tvcHRzPzogc29ja2V0LlNlcnZlck9wdGlvbnM7XHJcblx0XHR9IC8vUGFuZWxPcHRzXHJcblxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBDb21tYW5kT3B0cyB7XHJcblx0XHRcdG5hbWU6IHN0cmluZztcclxuXHRcdFx0ZXhwOiBSZWdFeHA7XHJcblx0XHRcdGRlc2M6IHN0cmluZztcclxuXHRcdFx0dXNhZ2U6IHN0cmluZztcclxuXHRcdFx0X3ByaW9yaXR5OiBudW1iZXI7XHJcblx0XHRcdF9jb21wbDogc3RyaW5nO1xyXG5cdFx0XHRfZG9tYWluOiBUeXBlcy5ET01BSU5TO1xyXG5cdFx0fSAvL0NvbW1hbmRPcHRzXHJcblx0XHRcclxuXHR9IC8vT3B0aW9uc1xyXG5cclxuXHRleHBvcnQgZGVjbGFyZSBuYW1lc3BhY2UgVHlwZXMge1xyXG5cclxuXHRcdGV4cG9ydCBlbnVtIERPTUFJTlMge1xyXG5cdFx0XHRDTEksIFdTLCBXRUJEQVYsIFVJICAvL2NvbnNvbGUsIHdlYnNvY2tldHMsIHVybCwgaW5hcHAgdWkgdGV4dC1hcmVhXHJcblx0XHR9IC8vRE9NQUlOU1xyXG5cclxuXHR9IC8vVHlwZXNcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFcnJvcnMge1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1JMID0gbmV3IFJlZmVyZW5jZUVycm9yKFwiTm8gc3VpdGFibGUgcmVhZGxpbmUgaW50ZXJmYWNlLlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFQUxSUkwgPSBuZXcgQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBcInJlYWRsaW5lIGludGVyZmFjZSBhbHJlYWR5IGV4aXN0cy5cIn0pO1xyXG5cdH0gLy9FcnJvcnNcclxuXHRcclxuXHJcblx0ZXhwb3J0IGNsYXNzIENvbW1hbmQgaW1wbGVtZW50cyBPcHRpb25zLkNvbW1hbmRPcHRzIHtcclxuXHRcdG5hbWU6IHN0cmluZztcclxuXHRcdGV4cDogUmVnRXhwO1xyXG5cdFx0ZGVzYzogc3RyaW5nO1xyXG5cdFx0dXNhZ2U6IHN0cmluZztcclxuXHRcdF9wcmlvcml0eTogbnVtYmVyID0gMDtcclxuXHRcdF9jb21wbDogc3RyaW5nO1xyXG5cdFx0X2RvbWFpbjogVHlwZXMuRE9NQUlOUztcclxuXHJcblx0XHRzdGF0aWMgcHJlZml4OiBzdHJpbmcgPSBcIlxcXFwuXCI7ICAvL3RvIGJlIGluYydkIGluIHJlZ2V4XHJcblxyXG5cdFx0Y29uc3RydWN0b3IoY3RvcjogT3B0aW9ucy5Db21tYW5kT3B0cykge1xyXG5cdFx0XHRPYmplY3QuYXNzaWduKHRoaXMsIGN0b3IpO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0YXN5bmMgYm9keSguLi5wYXJhbXM6IGFueVtdKSB7XHJcblxyXG5cdFx0fSAvL2JvZHlcclxuXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0cGFyc2UobGluZTogc3RyaW5nLCBwYW5lbDogUGFuZWwpIHtcclxuXHJcblx0XHRcdHJldHVybiB0aGlzLmJvZHkoKTtcclxuXHRcdH0gLy9wYXJzZVxyXG5cclxuXHR9IC8vQ29tbWFuZFxyXG5cclxuXHRleHBvcnQgY2xhc3MgUGFuZWwgZXh0ZW5kcyByZXF1aXJlKFwiZXZlbnRzXCIpLkV2ZW50RW1pdHRlciB7XHJcblx0XHRcclxuXHRcdHJsOiByZWFkbGluZS5JbnRlcmZhY2U7XHJcblx0XHRfcmxfcGF1c2VkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRzZXJ2OiB2c2Vydi5DbGFzc2VzLlNlcnZlcjtcclxuXHRcdHNvY2s6IHNvY2tldC5TZXJ2ZXI7XHJcblx0XHRvcHRzOiBPcHRpb25zLlBhbmVsT3B0cztcclxuXHRcdGNtZHM6IENvbW1hbmRbXSA9IFsgXTtcclxuXHRcdF9kZWJ1Z2xvZzogc3RyaW5nID0gXCJcIjtcclxuXHJcblx0XHRzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzID0ge1xyXG5cdFx0XHRzdWJvcHRzOiB7XHJcblx0XHRcdFx0cG9ydDogOTk5OSxcclxuXHRcdFx0XHRyb290OiBcIi9wYW5lbFwiXHJcblx0XHRcdH0sXHJcblx0XHRcdHNvY2tvcHRzOiB7XHJcblx0XHRcdFx0cGF0aDogXCIvd3NcIixcclxuXHRcdFx0XHRwaW5nSW50ZXJ2YWw6IDEwMDAwLFxyXG5cdFx0XHRcdHNlcnZlQ2xpZW50OiB0cnVlXHJcblx0XHRcdH0sXHJcblx0XHRcdGF1dGg6IFwiYWRtaW46YWRtXCJcclxuXHRcdH07XHJcblx0XHRcclxuXHRcdGNvbnN0cnVjdG9yKG9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzID0gUGFuZWwuZGVmYXVsdE9wdHMpIHtcclxuXHRcdFx0c3VwZXIoKTtcclxuXHRcdFx0bGV0IG5vcHRzOiBPcHRpb25zLlBhbmVsT3B0cyA9IDxPcHRpb25zLlBhbmVsT3B0cz57fTtcclxuXHRcdFx0XHJcblx0XHRcdE9iamVjdC5hc3NpZ24obm9wdHMsIFBhbmVsLmRlZmF1bHRPcHRzKTtcclxuXHRcdFx0T2JqZWN0LmFzc2lnbihub3B0cywgb3B0cyk7XHJcblxyXG5cdFx0XHR0aGlzLm9wdHMgPSBub3B0cztcclxuXHRcdH0gLy9jdG9yXHJcblx0XHRcclxuXHRcdGFzeW5jIHN0YXJ0KG9wdHM6IHZzZXJ2LkNsYXNzZXMuT3B0aW9ucy5TZXJ2ZXJPcHRpb25zID0gdGhpcy5vcHRzLnN1Ym9wdHMpIHtcclxuXHRcdFx0dGhpcy5zZXJ2ID0gYXdhaXQgdnNlcnYuU2VydmVyLnNldHVwKG9wdHMpO1xyXG5cdFx0XHR0aGlzLnNvY2sgPSBzb2NrZXQodGhpcy5zZXJ2Lmh0dHBzcnYsIHRoaXMub3B0cy5zb2Nrb3B0cyk7XHJcblxyXG5cdFx0XHRTb2NrZXQuc2V0dXAodGhpcy5zb2NrLCB0aGlzKTsgLy9NaW5kIHRoZSBvcmRlciEhXHJcblx0XHRcdGF3YWl0IHRoaXMuc2Vydi5iaW5kKCk7XHJcblxyXG5cdFx0XHR0aGlzLnNlcnYuZGF0YVtcImF1dGhcIl0gPSB0aGlzLm9wdHMuYXV0aDtcclxuXHRcdFx0dGhpcy5fZGVidWcoXCJQYW5lbCBTdGFydGVkLlwiKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vc3RhcnRcclxuXHJcblx0XHRhc3luYyBjbGkoeyBpbnB1dCwgb3V0cHV0IH0pIHtcclxuXHRcdFx0aWYgKCF0aGlzLmNtZHMubGVuZ3RoKSB7IGF3YWl0IHRoaXMuX2xvYWRDTEkoKTsgfVxyXG5cdFx0XHRpZiAodGhpcy5ybCkgdGhyb3cgRXJyb3JzLkVBTFJSTDtcclxuXHJcblx0XHRcdGxldCBjb21wbGV0ZXIgPSAoYXN5bmMgZnVuY3Rpb24gY29tcGxldGVyKGxpbmU6IHN0cmluZywgY2IpIHtcclxuXHRcdFx0XHRjb25zdCBjb21wbGV0aW9ucyA9IHRoaXMuY21kcy5tYXAoKGNtZDogQ29tbWFuZCkgPT4gY21kLl9jb21wbCksXHJcblx0XHRcdFx0XHRoaXRzID0gY29tcGxldGlvbnMuZmlsdGVyKChjOiBzdHJpbmcpID0+IGMuc3RhcnRzV2l0aChsaW5lKSk7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0cmV0dXJuIGNiKG51bGwsIFtoaXRzLmxlbmd0aCA/IGhpdHMgOiBjb21wbGV0aW9ucywgbGluZV0pO1xyXG5cdFx0XHR9KS5iaW5kKHRoaXMpOyAvL2NvbXBsZXRlclxyXG5cclxuXHRcdFx0bGV0IHJsOiByZWFkbGluZS5JbnRlcmZhY2UgPSByZWFkbGluZS5jcmVhdGVJbnRlcmZhY2Uoe1xyXG5cdFx0XHRcdGlucHV0LCBvdXRwdXQsIGNvbXBsZXRlclxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJsLm9uKFwibGluZVwiLCBhc3luYyBsaW5lID0+IHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYXdhaXQgdGhpcy5jbWRzLmZpbmQoY21kID0+IGNtZC5leHAudGVzdChsaW5lKSkucGFyc2UobGluZSwgdGhpcykpO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihjaGFsa1tcInJlZFwiXSh1dGlsLmluc3BlY3QoZXJyKSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdHJsLm9uKFwicGF1c2VcIiwgKCkgPT4ge1xyXG5cdFx0XHRcdHRoaXMuX3JsX3BhdXNlZCA9IHRydWU7XHJcblx0XHRcdFx0dGhpcy5fZGVidWcoXCJSTCBwYXVzZWRcIik7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRybC5vbihcInJlc3VtZVwiLCAoKSA9PiB7XHJcblx0XHRcdFx0dGhpcy5fcmxfcGF1c2VkID0gZmFsc2U7XHJcblx0XHRcdFx0dGhpcy5fZGVidWcoXCJSTCByZXN1bWVkXCIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJldHVybiB0aGlzLnJsID0gcmw7XHJcblx0XHR9IC8vY2xpXHJcblxyXG5cdFx0dG9nZ2xlQ0xJKHN0YXRlPzogYm9vbGVhbikge1xyXG5cdFx0XHRpZiAodGhpcy5ybCAmJiBzdGF0ZSA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuX3JsX3BhdXNlZCkge1xyXG5cdFx0XHRcdFx0dGhpcy5ybC5yZXN1bWUoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5ybC5wYXVzZSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnJsKSB7XHJcblx0XHRcdFx0aWYgKHN0YXRlKSB7XHJcblx0XHRcdFx0XHR0aGlzLnJsLnJlc3VtZSgpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLnJsLnBhdXNlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9STDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vdG9nZ2xlQ0xJXHJcblxyXG5cdFx0YXN5bmMgX2xvYWRDTEkoZnJvbTogc3RyaW5nID0gcGF0aC5qb2luKFwiX19TZXJ2ZXJcIiwgXCJjb21tYW5kc1wiKSkge1xyXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcblx0XHRcdFx0ZnMucmVhZGRpcihmcm9tLCAoZXJyLCBmaWxlcykgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKCFlcnIpIHtcclxuXHRcdFx0XHRcdFx0Zm9yIChsZXQgZmlsZSBvZiBmaWxlcykge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBmcm06IHN0cmluZztcclxuXHRcdFx0XHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIHJlcXVpcmUuY2FjaGVbcmVxdWlyZS5yZXNvbHZlKGZybSA9IHBhdGgucmVzb2x2ZSgnLicgKyBwYXRoLnNlcCArIHBhdGguam9pbihmcm9tLCBmaWxlKSkpXTtcclxuXHRcdFx0XHRcdFx0XHR9IGNhdGNoIChpZ24pIHsgfVxyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY21kcy5wdXNoKHJlcXVpcmUoZnJtKS5jb21tYW5kKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0dGhpcy5jbWRzLnNvcnQoKGEsIGIpID0+IGEuX3ByaW9yaXR5IC0gYi5fcHJpb3JpdHkpO1xyXG5cdFx0XHRcdFx0XHR0aGlzLl9kZWJ1ZyhgTG9hZGluZyBDTEkgY29tbWFuZHMgZnJvbSAnJHtmcm9tfScgc3VjY2VlZGVkLmApO1xyXG5cdFx0XHRcdFx0XHRyZXModGhpcy5jbWRzKTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdHJlaihlcnIpO1xyXG5cdFx0XHRcdFx0XHR0aGlzLl9kZWJ1ZyhgTG9hZGluZyBDTEkgY29tbWFuZHMgZnJvbSAnJHtmcm9tfScgZmFpbGVkLmApO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0gLy9fbG9hZENMSVxyXG5cclxuXHRcdF9kZWJ1ZyguLi5tc2c6IGFueVtdKSB7XHJcblx0XHRcdHRoaXMuX2RlYnVnbG9nICs9IG1zZy5qb2luKCcgJykgKyBcIiAgLS0tICBcIiArIERhdGUoKSArICdcXG4nO1xyXG5cdFx0XHR0aGlzLmVtaXQoXCJfZGVidWdcIiwgLi4ubXNnKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vX2RlYnVnXHJcblx0XHRcclxuXHR9IC8vUGFuZWxcclxuXHJcblx0ZXhwb3J0IGNsYXNzIFN0YXRzIHtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcigpIHtcclxuXHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHR9IC8vU3RhdHNcclxuXHRcclxufSAvL0NsYXNzZXNcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENsYXNzZXM7XHJcbiJdfQ==