"use strict";

const Classes = module.parent.exports.Classes;

export var command = new Classes.Command({
	name: "clear",
	desc: "Clear CLI console",
	exp: new RegExp('^' + Classes.Command.prefix + "clear$", "sim"),
	usage: eval("'" + Classes.Command.prefix + "'") + "clear",
	_compl: eval("'" + Classes.Command.prefix + "'") + "clear",
	_priority: 2,
	body: function body() {
		return console.clear();
	}, //body
	parse: function parse(line: string, panel) {
		return this.body();
	} //parse
});

export default command;
