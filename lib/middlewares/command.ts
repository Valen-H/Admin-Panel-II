import * as http from "http";
import * as vserv from "vale-server-ii";

module.exports = {
	name: "command",
	afters: ["auth"],
	befores: [ "fix", "directory", "static", "end" ],
	_fromFile: true,
	body: async function body(req: http.IncomingMessage, res: http.ServerResponse, event: vserv.Classes.evt): Promise<boolean> {
		

		return event.pass();
	}
};
