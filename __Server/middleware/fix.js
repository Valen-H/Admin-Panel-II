"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const url_1 = require("url");
const util_1 = require("util");
const Classes = module.parent.exports.Classes;
const paccess = util_1.promisify(fs.access), cachedir = new Map(), preaddir = async function readdir(name) {
    if (cachedir.has(name)) {
        //@ts-ignore
        fs.readdir(name, { withFileTypes: true, encoding: "utf8" }).then((files) => {
            cachedir.set(name, files);
        });
        return cachedir.get(name);
    }
    else {
        //@ts-ignore
        cachedir.set(name, await fs.readdir(name, { withFileTypes: true, encoding: "utf8" }));
        return cachedir.get(name);
    }
};
module.exports = {
    name: "fix",
    afters: [],
    befores: ["directory", "static", "end"],
    priorities: [".htmx", ".htmlx", ".html", ".htm", ".xjs", ".js", ".cssx", ".css"].reverse(),
    _fromFile: true,
    body: async function body(req, res, event) {
        let uri = new url_1.URL(`http://127.0.0.1:${event.server.opts.port}${req.url}`), pth = uri.pathname.replace(new RegExp('^' + event.server.opts.root, "i"), ''), //localize url
        targ = path.join(event.server.opts.serveDir, event.server.opts.public, pth); //absolute
        event.server._debug(event.reqcntr, "(FIX.TS) REQ:", uri.href, pth, targ);
        try { //path valid?
            if (!uri.pathname.startsWith(event.server.opts.root))
                throw Classes.Errors.EBADROOT;
            if (event.carriage._global.patherr)
                throw Classes.Errors.EBADPATH;
            await paccess(targ); //checks both dir and file
            event.server._debug(event.reqcntr, "(FIX.TS) VALID");
        }
        catch (err) {
            try { //parent dir exists?
                if (!uri.pathname.startsWith(event.server.opts.root))
                    throw Classes.Errors.EBADROOT;
                if (event.carriage._global.patherr)
                    throw Classes.Errors.EBADPATH;
                //@ts-ignore
                let files = await preaddir(path.dirname(targ)), reg = new RegExp('^' + path.basename(pth), "i"), //queried filename, recommended: requests without ext
                //@ts-ignore
                pfiles = files.filter((file) => reg.test(file.name)).sort((a, b) => {
                    let s = ["", ""];
                    if ((s[0] = path.basename(a.name, path.extname(a.name))) !== (s[1] = path.basename(b.name, path.extname(b.name))))
                        return s[0].length - s[1].length;
                    if (a.isDirectory())
                        return -1;
                    if (b.isDirectory())
                        return 1;
                    return module.exports.priorities.indexOf(path.extname(b.name)) - module.exports.priorities.indexOf(path.extname(a.name));
                }); // ok > ok.txt > okay.txt
                if (pfiles[0]) { //fix found
                    uri.pathname = path.join(path.dirname(req.url), pfiles[0].name);
                    req.url = uri.pathname + uri.search + uri.hash;
                    event.server._debug(event.reqcntr, "(FIX.TS) SERVE:", req.url);
                }
                else {
                    event.server._debug(event.reqcntr, "(FIX.TS) NOFIX");
                }
            }
            catch (err) { //superpath invalid - 404
                event.carriage._global.patherr = true;
                event.server._debug(event.reqcntr, "(FIX.TS) ERR: PATHERR");
            }
        }
        event.server._debug(event.reqcntr, "(FIX.TS) PASS");
        return event.pass();
    } //body
};
