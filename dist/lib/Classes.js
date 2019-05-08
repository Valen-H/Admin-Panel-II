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
            this._debug = false;
            this.cmds = [];
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
            this.serv.on("_debug", (...data) => {
                if (this._debug)
                    console.debug(...data);
            });
            this.serv.data["auth"] = this.opts.auth;
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
            rl.on("pause", () => this._rl_paused = true);
            rl.on("resume", () => this._rl_paused = false);
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
                        res(this.cmds);
                    }
                    else {
                        rej(err);
                    }
                });
            });
        } //_loadCLI
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3Nlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9DbGFzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBR2I7O0dBRUc7QUFHSCw4REFBd0M7QUFDeEMsa0VBQStCO0FBQy9CLDJEQUFxQztBQUNyQyxtREFBNkI7QUFDN0IsK0NBQXlCO0FBQ3pCLG1EQUE2QjtBQUM3QixtQ0FBd0M7QUFDeEMsOERBQThCO0FBSTlCLElBQUk7SUFDSCxhQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0NBQ3pCO0FBQUMsT0FBTyxHQUFHLEVBQUU7SUFDYixhQUFLLEdBQUcsU0FBUyxLQUFLLENBQUMsTUFBTTtRQUM1QixPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMsQ0FBQztDQUNGO0FBR0QsSUFBYyxPQUFPLENBd0twQjtBQXhLRCxXQUFjLE9BQU87SUFZcEIsSUFBaUIsTUFBTSxDQUd0QjtJQUhELFdBQWlCLE1BQU07UUFDVCxZQUFLLEdBQUcsSUFBSSxjQUFjLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUM5RCxhQUFNLEdBQUcsSUFBSSx1QkFBYyxDQUFDLEVBQUUsT0FBTyxFQUFFLG9DQUFvQyxFQUFDLENBQUMsQ0FBQztJQUM1RixDQUFDLEVBSGdCLE1BQU0sR0FBTixjQUFNLEtBQU4sY0FBTSxRQUd0QixDQUFDLFFBQVE7SUFHVixNQUFhLE9BQU87UUFXbkIsWUFBWSxJQUFhO1lBTHpCLGNBQVMsR0FBVyxDQUFDLENBQUM7WUFNckIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLE1BQU07UUFFUixXQUFXO1FBQ1gsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU07UUFFcEIsQ0FBQyxDQUFDLE1BQU07UUFFUixXQUFXO1FBQ1gsS0FBSyxDQUFDLElBQVksRUFBRSxLQUFZO1lBRS9CLE9BQU8sSUFBSSxDQUFDLElB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QUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUNwRCxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUNmO3lCQUFNO3dCQUNOLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztxQkFDVDtnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLFVBQVU7TUFFWCxPQUFPO0lBdEdELGlCQUFXLEdBQXNCO1FBQ3ZDLE9BQU8sRUFBRTtZQUNSLElBQUksRUFBRSxJQUFJO1lBQ1YsSUFBSSxFQUFFLFFBQVE7U0FDZDtRQUNELFFBQVEsRUFBRTtZQUNULElBQUksRUFBRSxLQUFLO1lBQ1gsWUFBWSxFQUFFLEtBQUs7WUFDbkIsV0FBVyxFQUFFLElBQUk7U0FDakI7UUFDRCxJQUFJLEVBQUUsV0FBVztLQUNqQixDQUFDO0lBckJVLGFBQUssUUFnSGpCLENBQUE7SUFFRCxNQUFhLEtBQUs7UUFFakI7UUFFQSxDQUFDLENBQUMsTUFBTTtLQUVSLENBQUMsT0FBTztJQU5JLGFBQUssUUFNakIsQ0FBQTtBQUVGLENBQUMsRUF4S2EsT0FBTyxHQUFQLGVBQU8sS0FBUCxlQUFPLFFBd0twQixDQUFDLFNBQVM7QUFFWCxrQkFBZSxPQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogSU1QTDogc3RhcnQvc3RvcCB3ZWJzZXJ2XHJcbiAqL1xyXG5cclxuXHJcbmltcG9ydCAqIGFzIHZzZXJ2IGZyb20gXCJ2YWxlLXNlcnZlci1paVwiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCJzb2NrZXQuaW9cIjtcclxuaW1wb3J0ICogYXMgcmVhZGxpbmUgZnJvbSBcInJlYWRsaW5lXCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XHJcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSBcInV0aWxcIjtcclxuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgU29ja2V0IGZyb20gJy4vc29ja2V0JztcclxuXHJcbmV4cG9ydCB2YXIgY2hhbGs6IEZ1bmN0aW9uO1xyXG5cclxudHJ5IHtcclxuXHRjaGFsayA9IHJlcXVpcmUoXCJjaGFsa1wiKTtcclxufSBjYXRjaCAob3B0KSB7XHJcblx0Y2hhbGsgPSBmdW5jdGlvbiBjaGFsayhzdHJpbmcpIHtcclxuXHRcdHJldHVybiBzdHJpbmc7XHJcblx0fTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBtb2R1bGUgQ2xhc3NlcyB7XHJcblx0XHJcblx0ZXhwb3J0IGRlY2xhcmUgbmFtZXNwYWNlIE9wdGlvbnMge1xyXG5cdFx0XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIFBhbmVsT3B0cyB7XHJcblx0XHRcdGF1dGg/OiBzdHJpbmc7XHJcblx0XHRcdHN1Ym9wdHM/OiB2c2Vydi5DbGFzc2VzLk9wdGlvbnMuU2VydmVyT3B0aW9ucztcclxuXHRcdFx0c29ja29wdHM/OiBzb2NrZXQuU2VydmVyT3B0aW9ucztcclxuXHRcdH0gLy9QYW5lbE9wdHNcclxuXHRcdFxyXG5cdH0gLy9PcHRpb25zXHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRXJyb3JzIHtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9STCA9IG5ldyBSZWZlcmVuY2VFcnJvcihcIk5vIHN1aXRhYmxlIHJlYWRsaW5lIGludGVyZmFjZS5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRUFMUlJMID0gbmV3IEFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogXCJyZWFkbGluZSBpbnRlcmZhY2UgYWxyZWFkeSBleGlzdHMuXCJ9KTtcclxuXHR9IC8vRXJyb3JzXHJcblx0XHJcblxyXG5cdGV4cG9ydCBjbGFzcyBDb21tYW5kIHtcclxuXHRcdC8vSU1QTDogZG9tYWluczogY2xpLCB3cywgdXJsXHJcblx0XHRuYW1lOiBzdHJpbmc7XHJcblx0XHRleHA6IFJlZ0V4cDtcclxuXHRcdGRlc2M6IHN0cmluZztcclxuXHRcdHVzYWdlOiBzdHJpbmc7XHJcblx0XHRfcHJpb3JpdHk6IG51bWJlciA9IDA7XHJcblx0XHRfY29tcGw6IHN0cmluZztcclxuXHJcblx0XHRzdGF0aWMgcHJlZml4OiBzdHJpbmcgPSBcIlxcXFwuXCI7IC8vdG8gYmUgaW5jJ2QgaW4gcmVnZXhcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihjdG9yOiBDb21tYW5kKSB7XHJcblx0XHRcdE9iamVjdC5hc3NpZ24odGhpcywgY3Rvcik7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdC8vQE92ZXJyaWRlXHJcblx0XHRhc3luYyBib2R5KC4uLnBhcmFtcykge1xyXG5cclxuXHRcdH0gLy9ib2R5XHJcblxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdHBhcnNlKGxpbmU6IHN0cmluZywgcGFuZWw6IFBhbmVsKSB7XHJcblxyXG5cdFx0XHRyZXR1cm4gdGhpcy5ib2R5KCk7XHJcblx0XHR9IC8vcGFyc2VcclxuXHJcblx0fSAvL0NvbW1hbmRcclxuXHJcblx0ZXhwb3J0IGNsYXNzIFBhbmVsIGV4dGVuZHMgcmVxdWlyZShcImV2ZW50c1wiKS5FdmVudEVtaXR0ZXIge1xyXG5cdFx0XHJcblx0XHRybDogcmVhZGxpbmUuSW50ZXJmYWNlO1xyXG5cdFx0X3JsX3BhdXNlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0c2VydjogdnNlcnYuQ2xhc3Nlcy5TZXJ2ZXI7XHJcblx0XHRzb2NrOiBzb2NrZXQuU2VydmVyO1xyXG5cdFx0b3B0czogT3B0aW9ucy5QYW5lbE9wdHM7XHJcblx0XHRfZGVidWc6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdGNtZHM6IENvbW1hbmRbXSA9IFsgXTtcclxuXHJcblx0XHRzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzID0ge1xyXG5cdFx0XHRzdWJvcHRzOiB7XHJcblx0XHRcdFx0cG9ydDogOTk5OSxcclxuXHRcdFx0XHRyb290OiBcIi9wYW5lbFwiXHJcblx0XHRcdH0sXHJcblx0XHRcdHNvY2tvcHRzOiB7XHJcblx0XHRcdFx0cGF0aDogXCIvd3NcIixcclxuXHRcdFx0XHRwaW5nSW50ZXJ2YWw6IDEwMDAwLFxyXG5cdFx0XHRcdHNlcnZlQ2xpZW50OiB0cnVlXHJcblx0XHRcdH0sXHJcblx0XHRcdGF1dGg6IFwiYWRtaW46YWRtXCJcclxuXHRcdH07XHJcblx0XHRcclxuXHRcdGNvbnN0cnVjdG9yKG9wdHM6IE9wdGlvbnMuUGFuZWxPcHRzID0gUGFuZWwuZGVmYXVsdE9wdHMpIHtcclxuXHRcdFx0c3VwZXIoKTtcclxuXHRcdFx0bGV0IG5vcHRzID0geyB9O1xyXG5cdFx0XHRPYmplY3QuYXNzaWduKG5vcHRzLCBQYW5lbC5kZWZhdWx0T3B0cyk7XHJcblx0XHRcdE9iamVjdC5hc3NpZ24obm9wdHMsIG9wdHMpO1xyXG5cdFx0XHR0aGlzLm9wdHMgPSBub3B0cztcclxuXHRcdH0gLy9jdG9yXHJcblx0XHRcclxuXHRcdGFzeW5jIHN0YXJ0KG9wdHM6IHZzZXJ2LkNsYXNzZXMuT3B0aW9ucy5TZXJ2ZXJPcHRpb25zID0gdGhpcy5vcHRzLnN1Ym9wdHMpIHtcclxuXHRcdFx0dGhpcy5zZXJ2ID0gYXdhaXQgdnNlcnYuU2VydmVyLnNldHVwKG9wdHMpO1xyXG5cdFx0XHR0aGlzLnNvY2sgPSBzb2NrZXQodGhpcy5zZXJ2Lmh0dHBzcnYsIHRoaXMub3B0cy5zb2Nrb3B0cyk7XHJcblx0XHRcdFNvY2tldC5zZXR1cCh0aGlzLnNvY2ssIHRoaXMpOyAvL01pbmQgdGhlIG9yZGVyISFcclxuXHRcdFx0YXdhaXQgdGhpcy5zZXJ2LmJpbmQoKTtcclxuXHRcdFx0dGhpcy5zZXJ2Lm9uKFwiX2RlYnVnXCIsICguLi5kYXRhOiBzdHJpbmdbXSkgPT4geyBcclxuXHRcdFx0XHRpZiAodGhpcy5fZGVidWcpIGNvbnNvbGUuZGVidWcoLi4uZGF0YSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHR0aGlzLnNlcnYuZGF0YVtcImF1dGhcIl0gPSB0aGlzLm9wdHMuYXV0aDtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vc3RhcnRcclxuXHJcblx0XHRhc3luYyBjbGkoeyBpbnB1dCwgb3V0cHV0IH0pIHtcclxuXHRcdFx0aWYgKCF0aGlzLmNtZHMubGVuZ3RoKSB7IGF3YWl0IHRoaXMuX2xvYWRDTEkoKTsgfVxyXG5cdFx0XHRpZiAodGhpcy5ybCkgdGhyb3cgRXJyb3JzLkVBTFJSTDtcclxuXHJcblx0XHRcdGxldCBjb21wbGV0ZXIgPSAoYXN5bmMgZnVuY3Rpb24gY29tcGxldGVyKGxpbmU6IHN0cmluZywgY2IpIHtcclxuXHRcdFx0XHRjb25zdCBjb21wbGV0aW9ucyA9IHRoaXMuY21kcy5tYXAoKGNtZDogQ29tbWFuZCkgPT4gY21kLl9jb21wbCksXHJcblx0XHRcdFx0XHRoaXRzID0gY29tcGxldGlvbnMuZmlsdGVyKChjOiBzdHJpbmcpID0+IGMuc3RhcnRzV2l0aChsaW5lKSk7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0cmV0dXJuIGNiKG51bGwsIFtoaXRzLmxlbmd0aCA/IGhpdHMgOiBjb21wbGV0aW9ucywgbGluZV0pO1xyXG5cdFx0XHR9KS5iaW5kKHRoaXMpOyAvL2NvbXBsZXRlclxyXG5cclxuXHRcdFx0bGV0IHJsOiByZWFkbGluZS5JbnRlcmZhY2UgPSByZWFkbGluZS5jcmVhdGVJbnRlcmZhY2Uoe1xyXG5cdFx0XHRcdGlucHV0LCBvdXRwdXQsIGNvbXBsZXRlclxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJsLm9uKFwibGluZVwiLCBhc3luYyBsaW5lID0+IHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYXdhaXQgdGhpcy5jbWRzLmZpbmQoY21kID0+IGNtZC5leHAudGVzdChsaW5lKSkucGFyc2UobGluZSwgdGhpcykpO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihjaGFsa1tcInJlZFwiXSh1dGlsLmluc3BlY3QoZXJyKSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdHJsLm9uKFwicGF1c2VcIiwgKCkgPT4gdGhpcy5fcmxfcGF1c2VkID0gdHJ1ZSk7XHJcblx0XHRcdHJsLm9uKFwicmVzdW1lXCIsICgpID0+IHRoaXMuX3JsX3BhdXNlZCA9IGZhbHNlKTtcclxuXHJcblx0XHRcdHJldHVybiB0aGlzLnJsID0gcmw7XHJcblx0XHR9IC8vY2xpXHJcblxyXG5cdFx0dG9nZ2xlQ0xJKHN0YXRlPzogYm9vbGVhbikge1xyXG5cdFx0XHRpZiAodGhpcy5ybCAmJiBzdGF0ZSA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuX3JsX3BhdXNlZCkge1xyXG5cdFx0XHRcdFx0dGhpcy5ybC5yZXN1bWUoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5ybC5wYXVzZSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnJsKSB7XHJcblx0XHRcdFx0aWYgKHN0YXRlKSB7XHJcblx0XHRcdFx0XHR0aGlzLnJsLnJlc3VtZSgpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLnJsLnBhdXNlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9STDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vdG9nZ2xlQ0xJXHJcblxyXG5cdFx0YXN5bmMgX2xvYWRDTEkoZnJvbTogc3RyaW5nID0gcGF0aC5qb2luKFwiX19TZXJ2ZXJcIiwgXCJjb21tYW5kc1wiKSkge1xyXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XHJcblx0XHRcdFx0ZnMucmVhZGRpcihmcm9tLCAoZXJyLCBmaWxlcykgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKCFlcnIpIHtcclxuXHRcdFx0XHRcdFx0Zm9yIChsZXQgZmlsZSBvZiBmaWxlcykge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBmcm06IHN0cmluZztcclxuXHRcdFx0XHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIHJlcXVpcmUuY2FjaGVbcmVxdWlyZS5yZXNvbHZlKGZybSA9IHBhdGgucmVzb2x2ZSgnLicgKyBwYXRoLnNlcCArIHBhdGguam9pbihmcm9tLCBmaWxlKSkpXTtcclxuXHRcdFx0XHRcdFx0XHR9IGNhdGNoIChpZ24pIHsgfVxyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY21kcy5wdXNoKHJlcXVpcmUoZnJtKS5jb21tYW5kKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0dGhpcy5jbWRzLnNvcnQoKGEsIGIpID0+IGEuX3ByaW9yaXR5IC0gYi5fcHJpb3JpdHkpO1xyXG5cdFx0XHRcdFx0XHRyZXModGhpcy5jbWRzKTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdHJlaihlcnIpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0gLy9fbG9hZENMSVxyXG5cdFx0XHJcblx0fSAvL1BhbmVsXHJcblxyXG5cdGV4cG9ydCBjbGFzcyBTdGF0cyB7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IoKSB7XHJcblxyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0fSAvL1N0YXRzXHJcblx0XHJcbn0gLy9DbGFzc2VzXHJcblxyXG5leHBvcnQgZGVmYXVsdCBDbGFzc2VzO1xyXG4iXX0=