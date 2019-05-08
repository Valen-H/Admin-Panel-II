"use strict";

const Classes = module.parent.exports.Classes,
	chalk = module.parent.exports.chalk;

export var command = new Classes.Command({
	name: "catch",
	desc: "Catch undefined commands",
	exp: new RegExp('^' + Classes.Command.prefix, "sim"),
	usage: eval("'" + Classes.Command.prefix + "'"),
	_compl: eval("'" + Classes.Command.prefix + "'"),
	_priority: Infinity,
	body: function body(command?: string) {
		if (command) console.error(chalk.redBright(chalk`"{red ${command}}" command does not exist!`));
	}, //body
	parse: function parse(line: string, panel) {
		return this.body(line);
	} //parse
});

export default command;
