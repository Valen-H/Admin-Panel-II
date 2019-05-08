"use strict";

const Classes = module.parent.exports.Classes;

export var command = new Classes.Command({
	name: "kill",
	desc: "Kill JS process (after interval)",
	exp: new RegExp('^' + Classes.Command.prefix + "kill ?(\\d+( \\d+)?)?$", "sim"),
	usage: eval("'" + Classes.Command.prefix + "'") + "kill interval?<Number> code?<Number>",
	_compl: eval("'" + Classes.Command.prefix + "'") + "kill ",
	_priority: 0,
	body: async function body(time: string, code?: number) {
		if (time) {
			setTimeout(() => process.exit(code), Number(time));
		} else {
			process.exit();
		}
	}, //body
	parse: function parse(line: string, panel) {
		let nline: string[] = line.split(' ');

		return this.body(nline[1], nline[2] ? nline[2] : undefined);
	} //parse
});

export default command;
