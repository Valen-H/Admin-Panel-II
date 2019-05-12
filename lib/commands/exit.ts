"use strict";

const Classes = module.parent.exports.Classes;

export var command = new Classes.Command({
	name: "exit",
	desc: "Stop Panel CLI",
	exp: new RegExp('^' + Classes.Command.prefix + "((sto?p|e(xit)?)|pause( \\d+)?)$", "sim"),
	usage: eval("'" + Classes.Command.prefix + "'") + "((stop|exit)|pause[ time<Number>])",
	_compl: eval("'" + Classes.Command.prefix + "'") + "stop",
	_priority: 1,
	body: function body(panel, time?: number) {
		panel.toggleCLI(false);
		
		if (time) {
			return setTimeout(panel.toggleCLI, time, true);
		}
	}, //body
	parse: function parse(line: string, panel) {
		let nline: string[] = line.split(' ');

		return this.body(panel, Number(nline[1]));
	} //parse
});

export default command;
