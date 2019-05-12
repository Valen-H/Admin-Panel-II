"use strict";

const fs = require("fs-extra"),
	Panel = require("../").Panel;

fs.removeSync("__Server/middleware");
fs.copySync("dist/lib/commands", "__Server/commands");
var mwrs = fs.readdirSync("dist/lib/middlewares");
	
Panel.setup().then(panel => {
	global["PANEL"] = panel;
	panel.toggleStats();
	panel.cli({ input: process.stdin, output: process.stdout });
	panel.start().then(() => {
		for (let mwr of mwrs) {
			fs.copyFileSync("dist/lib/middlewares/" + mwr, "__Server/middleware/" + mwr);
		}

		panel.on("_debug", console.info);
		panel.serv.on("_debug", console.info);
		panel.serv._loadMW("dist/lib/middlewares/");
		console.log("Started.");
	});
});


fs.watch("dist/", {
	recursive: true
}, (evt, name) => {
	console.log("Restarting...");
	process.exit(2);
});
