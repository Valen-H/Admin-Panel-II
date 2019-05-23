"use strict";

const Classes = module.parent.exports.Classes;

import { Classes as CT } from "../Classes";

export var command = new Classes.Command({
	name: "clear",
	desc: "Clear CLI console",
	exp: new RegExp('^' + Classes.Command.prefix + "c(lear)?$", "sim"),
	usage: eval("'" + Classes.Command.prefix + "'") + "clear",
	_compl: eval("'" + Classes.Command.prefix + "'") + "clear",
	_priority: 2,
	body: function body() {
		console.clear();
		return Classes.Null;
	}, //body
	parse: function parse(line?: string, panel?: CT.Panel) {
		return this.body();
	} //parse
});

export default command;
