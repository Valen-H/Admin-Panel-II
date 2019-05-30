"use strict";

const Classes = module.parent.exports.Classes,
	chalk = module.parent.exports.chalk;

import { Classes as CT } from "../Classes";

export var command: CT.Command = new Classes.Command({
	name: "help",
	desc: "Command help",
	exp: new RegExp('^' + Classes.Command.prefix + "h(elp)?( .+)?$", "sim"),
	usage: eval("'" + Classes.Command.prefix + "'") + "help[ command<String>]",
	_compl: eval("'" + Classes.Command.prefix + "'") + "help ",
	_priority: 4,
	body: function body(panel: CT.Panel, command: string): symbol {
		panel.cmds.filter((cmd: CT.Command) => cmd.name.includes(command)).forEach((cmd: CT.Command) => {
			console.log(chalk`{bold ${cmd.name}}:\n\t{dim.underline ${cmd.desc}}\n\n\t${cmd.usage}\n\n`);
		});
		return Classes.Null;
	}, //body
	parse: function parse(line: string, panel: CT.Panel): symbol {
		return this.body(panel, line.split(' ').slice(1).join(' '));
	} //parse
});

export default command;
