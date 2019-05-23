"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const os_1 = require("os");
const path = require("path");
const url_1 = require("url");
const util_1 = require("util");
const Classes = module.parent.exports.Classes;
const pstat = util_1.promisify(fs.stat), cachedir = new Map(), preaddir = async function readdir(name) {
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
}, preadFile = util_1.promisify(fs.readFile);
var dir; //precache builtin file
module.exports = {
    name: "directory",
    afters: ["fix"],
    befores: ["static", "end"],
    _fromFile: true,
    body: async function body(req, res, event) {
        let uri = new url_1.URL(`http://127.0.0.1:${event.server.opts.port}${req.url}`), pth = uri.pathname.replace(new RegExp('^' + event.server.opts.root, "i"), '/'), //localize url
        targ = path.join(event.server.opts.serveDir, event.server.opts.public, pth); //absolute
        event.server._debug(event.reqcntr, "(DIRECTORY.TS) REQ:", uri.href);
        try { //path valid?
            if (!uri.pathname.startsWith(event.server.opts.root))
                throw Classes.Errors.EBADROOT;
            if (event.carriage._global.patherr)
                throw Classes.Errors.EBADPATH;
            let stats = await pstat(targ);
            if (!stats.isFile()) { //request isDir
                if (!pth.endsWith('/')) {
                    uri.pathname += '/';
                    event.server._debug(event.reqcntr, "(DIRECTORY.TS) REDIR:", uri.href);
                    res.writeHead(302, event.server.opts.http.STATUS_CODES[302], {
                        "Location": uri.href
                    });
                    res.end();
                    return await event.stop();
                }
                //@ts-ignore
                let files = await preaddir(targ), //throws
                //@ts-ignore
                idx = files.find((file) => event.server.opts.index.test(file.name)); //finds index -> blocks indexing
                if (idx) { //has index file
                    //@ts-ignore
                    idx = idx.name; //dirent
                    uri.pathname = path.join(uri.pathname, idx);
                    req.url = uri.pathname + uri.search + uri.hash;
                    event.server._debug(event.reqcntr, "(DIRECTORY.TS) HASINDEX");
                }
                else { //has no index
                    //@ts-ignore
                    files = files.filter((file) => !event.server.opts.nodir.test(file.name)); //filter-out __files
                    res.setHeader("Content-Type", "text/html; charset=UTF-8"); //hardcoded ok
                    event.server._debug(event.reqcntr, "(DIRECTORY.TS) HASNOINDEX");
                    try { //has .noindex?
                        let noidx = (await preadFile(path.join(targ, event.server.opts.noindex))).toString().trim();
                        if (noidx) { //.noindex filled
                            let regs = noidx.split(os_1.EOL).filter((file) => file).map((file) => new RegExp('^' + file + '$', "i"));
                            regs.push(/^\.noindex$/i);
                            event.server._debug(event.reqcntr, "(DIRECTORY.TS) NOINDEXFILLED");
                            //@ts-ignore
                            res.end(await index(event, files.filter((file) => regs.some((reg) => !reg.test(file.name))), uri));
                        }
                        else { //.noindex empty
                            event.server._debug(event.reqcntr, "(DIRECTORY.TS) NOINDEXEMPT");
                            res.end(await index(event, [], uri));
                        }
                    }
                    catch (err) { //has no .noindex
                        event.server._debug(event.reqcntr, "(DIRECTORY.TS) HASNO_NOINDEX");
                        res.end(await index(event, files, uri));
                    }
                }
            }
            else { //isFile
                event.server._debug(event.reqcntr, "(DIRECTORY.TS) ISFILE");
            }
            /**
             * if contains .noindex - empty for all, filled for each.
             * if contains index.html -> serve, if contains index.js -> execute before.
             * if contains __files
             */
        }
        catch (err) { //path invalid - 404
            event.carriage._global.patherr = true;
            event.server._debug(event.reqcntr, "(DIRECTORY.TS) ERR: PATHERR");
            console.error(err);
        }
        event.server._debug(event.reqcntr, "(DIRECTORY.TS) PASS");
        return event.pass();
    } //body
};
//@ts-ignore
async function index(event, files, uri) {
    dir = dir || ((await preadFile(path.join(event.server.opts.serveDir, event.server.opts.private, event.server.opts.dir))).toString()); //builtins, can be cached
    var pth = uri.pathname.replace(new RegExp("^." + event.server.opts.root, "i"), ''); //inside tmpls
    try {
        return dir.replace(event.server.opts.builtmpl, (m, p) => eval(p));
    }
    catch (fatal) {
        event.server.log(fatal);
        return dir;
    }
} //index
