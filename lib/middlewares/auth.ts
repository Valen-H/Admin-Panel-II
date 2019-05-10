import * as http from "http";
import * as vserv from "vale-server-ii";

module.exports = {
	name: "auth",
	afters: [ ],
	befores: [ "fix", "directory", "static", "end" ],
	_fromFile: true,
	body: async function body(req: http.IncomingMessage, res: http.ServerResponse, event: vserv.Classes.evt): Promise<boolean> {
		if (!event.carriage._global.patherr) {

			res.setHeader("X-Content-Type-Options", "nosniff");
			res.setHeader("X-XSS-Protection", "1; mode=block");
			res.setHeader("Cache-Control", "private, no-store, max-age=3600, must-revalidate");
			res.setHeader("X-Frame-Options", "sameorigin");

			if (!req.headers["authorization"]) {
				res.writeHead(401, http.STATUS_CODES[401], {
					"WWW-Authenticate": 'Basic realm="Access to the staging site", charset="UTF-8"'
				});

				event.server._debug(event.reqcntr, "(AUTH.TS) 401");
			} else {
				let challenge = Buffer.from(req.headers["authorization"].split(' ')[1], "base64").toString();

				if (challenge === event.server.data["auth"]) {
					event.server._debug(event.reqcntr, "(AUTH.TS) PASS");
					return event.pass();
				} else {
					res.writeHead(403, http.STATUS_CODES[403]);
					event.server._debug(event.reqcntr, "(AUTH.TS) 403");
				}
			}
		} else {
			res.writeHead(400, http.STATUS_CODES[400], { "warning": "bad root" });
		}

		res.end("ERR");
		return event.stop();
	}
};
