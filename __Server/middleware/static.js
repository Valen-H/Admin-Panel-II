"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const url_1 = require("url");
const util_1 = require("util");
const Classes = module.parent.exports.Classes;
const pstat = util_1.promisify(fs.stat), preadFile = util_1.promisify(fs.readFile), cache = new Map();
module.exports = {
    name: "static",
    afters: ["fix", "directory"],
    befores: ["end"],
    _fromFile: true,
    body: async function body(req, res, event) {
        /**
         * if is index
         * if is file
         * if 404
         */
        let uri = new url_1.URL(`http://127.0.0.1:${event.server.opts.port}${req.url}`), pth = uri.pathname.replace(new RegExp('^' + event.server.opts.root, "i"), ''), //localize url
        targ = path.join(event.server.opts.serveDir, event.server.opts.public, pth); //absolute
        event.server._debug(event.reqcntr, "(STATIC.TS) REQ:", uri.href);
        if (!res.finished) {
            try {
                if (!uri.pathname.startsWith(event.server.opts.root))
                    throw Classes.Errors.EBADROOT;
                if (event.carriage._global.patherr)
                    throw Classes.Errors.EBADPATH;
                let stats = await pstat(targ);
                if (stats.isFile()) {
                    event.server._debug(event.reqcntr, "(STATIC.TS) VALID");
                    res.setHeader("Content-Type", event.server.opts.contentMappings[path.extname(targ)]);
                    res.end(await serve(targ, event));
                }
                else {
                    event.fncntr -= 2;
                    event.server._debug(event.reqcntr, "(STATIC.TS) ISDIR -> JMP: DIRECTORY.TS");
                    return event.pass();
                }
            }
            catch (err) { //path invalid - 404
                event.carriage._global.patherr = true;
                event.server._debug(event.reqcntr, "(STATIC.TS) ERR: PATHERR");
            }
        }
        else {
            event.server._debug(event.reqcntr, "(STATIC.TS) FINISHD");
        }
        event.server._debug(event.reqcntr, "(STATIC.TS) PASS");
        return event.pass();
    } //body
};
async function serve(file, event, preproc = true) {
    try {
        let data, prep = /\.((html?|css)x|xjs)$/i;
        if (cache.has(file)) {
            data = cache.get(file);
            preadFile(file).then((err, buff) => {
                if (!err)
                    cache.set(file, buff.toString());
            });
        }
        else {
            data = (await preadFile(file)).toString();
            cache.set(file, data);
        }
        if (prep.test(file)) {
            data = data.replace(event.server.opts.builtmpl, (m, p) => eval(p));
        }
        return data;
    }
    catch (fatal) {
        event.server.log(fatal);
    }
} //serve
