const Classes = module.parent.exports.Classes;

import { Classes as CT } from "../Classes";

export var command: CT.Command = new Classes.Command({
	name: "eval",
	desc: "Evaluate JS expressions",
	exp: new RegExp('', "sim"),
	usage: "code<String>",
	_compl: '',
	_priority: Infinity,
	body: async function body(code: string): Promise<string> {
		return eval(code);
	}, //body
	parse: function parse(line: string, panel?: CT.Panel): Promise<string> {
		return this.body(line);
	}, //parse
});

export default command;
