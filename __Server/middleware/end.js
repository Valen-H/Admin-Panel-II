"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    name: "end",
    afters: ["fix", "directory", "static"],
    befores: [],
    _fromFile: true,
    body: async function body(req, res, event) {
        if (!res.headersSent) {
            res.setHeader("Server", "Vale_Server-II");
            res.setHeader("Tk", 'N');
        }
        else {
            res.addTrailers({ "Server": "Vale_Server-II" });
            res.addTrailers({ "Tk": 'N' });
        }
        if (!res.finished) {
            res.writeHead(404, event.server.opts.http.STATUS_CODES[404]);
            event.server._debug(event.reqcntr, "(END.TS) 404");
        }
        event.server._debug(event.reqcntr, "(END.TS) END");
        res.end();
        return await event.stop();
    } //body
};
