"use strict";

const Classes = module.parent.exports.Classes;

export var command = new Classes.Command({
	name: "sock",
	desc: "Dispatch a socket event",
	exp: new RegExp('^' + Classes.Command.prefix + "sock .+$", "sim"),
	usage: eval("'" + Classes.Command.prefix + "'") + "sock parameters<String[]>",
	_compl: eval("'" + Classes.Command.prefix + "'") + "sock ",
	_priority: 3,
	body: function body(panel, ...params: string[]) {
		return panel.sock.of("/admin").in("admin").emit(...params);
	}, //body
	parse: function parse(line: string, panel) {
		let nline: string[] = line.split(' ');
		return this.body(panel, ...nline.slice(1, nline.length));
	} //parse
});

export default command;
