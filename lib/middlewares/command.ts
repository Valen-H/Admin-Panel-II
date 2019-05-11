import * as http from "http";
import * as vserv from "vale-server-ii";
import * as url from "url";

module.exports = {
	name: "command",
	afters: ["auth"],
	befores: [ "fix", "directory", "static", "end" ],
	_fromFile: true,
	body: async function body(req: http.IncomingMessage, res: http.ServerResponse, event: vserv.Classes.evt): Promise<boolean> {
		let uri = new url.URL(`http://127.0.0.1:${event.server.opts.port}${req.url}`);
		
		if (uri.pathname === "/kill") {
			res.end("DONE");
			event.stop();
			await event.server.data["parent"].cmds.find(cmd => cmd.name === "kill").body();
		}

		return event.pass();
	}
};
