"use strict";

import Server from "vale-server-ii";
import * as cluster from "cluster";
import { cpus } from "os";


if (cluster.isMaster) {
	cluster.setupMaster({
		//@ts-ignore
		windowsHide: true,
		//silent: true
	});
	
	let cpu = cpus();
	
	for (let cp of cpu) {
		let wrk = cluster.fork();
	}
} else {
	let start = async function start() {
		let srv = await Server.setup();
		await srv.bind();
		srv.on("request", () => console.debug(process.pid))
		return srv;
	} //start
	
	start();
}
