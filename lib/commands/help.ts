"use strict";

const Classes = module.parent.exports.Classes,
	chalk = module.parent.exports.chalk;

export var command = new Classes.Command({
	name: "help",
	desc: "Command help",
	exp: new RegExp('^' + Classes.Command.prefix + "help( .+)?$", "sim"),
	usage: eval("'" + Classes.Command.prefix + "'") + "help[ command<String>]",
	_compl: eval("'" + Classes.Command.prefix + "'") + "help ",
	/**
	 * Did you mean
	 * named
	 * all
	 */
	_priority: 4,
	body: function body(panel, command: string) {
		return panel.cmds.filter(cmd => cmd.name.includes(command)).forEach(cmd => {
			console.log(chalk`{bold ${cmd.name}}:\n\t{dim.underline ${cmd.desc}}\n\n\t${cmd.usage}\n\n`);
		});
	}, //body
	parse: function parse(line: string, panel) {
		return this.body(panel, line.split(' ').slice(1).join(' '));
	} //parse
});

export default command;
