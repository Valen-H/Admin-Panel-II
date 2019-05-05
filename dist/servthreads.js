"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vale_server_ii_1 = require("vale-server-ii");
const cluster = require("cluster");
const os_1 = require("os");
if (cluster.isMaster) {
    cluster.setupMaster({
        //@ts-ignore
        windowsHide: true,
    });
    let cpu = os_1.cpus();
    for (let cp of cpu) {
        let wrk = cluster.fork();
    }
}
else {
    let start = async function start() {
        let srv = await vale_server_ii_1.default.setup();
        await srv.bind();
        srv.on("request", () => console.debug(process.pid));
        return srv;
    }; //start
    start();
}
