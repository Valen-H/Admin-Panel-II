import * as http from "http";
import * as vserv from "vale-server-ii";
import * as url from "url";
import { Classes } from "../panel";

module.exports = {
	name: "command",
	afters: ["auth"],
	befores: [ "fix", "directory", "static", "end" ],
	_fromFile: true,
	body: async function body(req: http.IncomingMessage, res: http.ServerResponse, event: vserv.Classes.evt): Promise<boolean> {
		let uri: URL = new url.URL(`http://127.0.0.1:${event.server.opts.port}${req.url}`);
		
		if (uri.pathname === "/kill") {
			let time: string = uri.searchParams.get("time"),
				code: string = uri.searchParams.get("code");
			
			res.end("DONE");
			event.stop();

			await event.server.data["parent"].cmds.find((cmd: Classes.Command): boolean => cmd.name === "kill").body(time, code);
		} else if (uri.pathname === "/eval") {
			let code: string = uri.searchParams.get("code");
			
			res.end(await event.server.data["parent"].cmds.find(cmd => cmd.name === "eval").body(code));
			event.stop();
		}

		return event.pass();
	}
};
