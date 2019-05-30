"use strict";

const Classes = module.parent.exports.Classes;

import { Classes as CT } from "../Classes";

export var command: CT.Command = new Classes.Command({
	name: "kill",
	desc: "Kill JS process (after interval)",
	exp: new RegExp('^' + Classes.Command.prefix + "k(ill)? ?(\\d+( \\d+)?)?$", "sim"),
	usage: eval("'" + Classes.Command.prefix + "'") + "kill interval?<Number> code?<Number>",
	_compl: eval("'" + Classes.Command.prefix + "'") + "kill ",
	_priority: 0,
	body: function body(time: string, code?: number): NodeJS.Timeout {
		if (time) {
			return setTimeout((): never => process.exit(code), Number(time));
		} else {
			process.exit();
		}
	}, //body
	parse: function parse(line: string, panel?: CT.Panel): NodeJS.Timeout {
		let nline: string[] = line.split(' ');

		return this.body(nline[1], nline[2] ? nline[2] : undefined);
	}, //parse
});

export default command;
