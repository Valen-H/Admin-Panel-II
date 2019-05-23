const Classes = module.parent.exports.Classes;

import { Classes as CT } from "../Classes";

export var command = new Classes.Command({
	name: "eval",
	desc: "Evaluate JS expressions",
	exp: new RegExp('', "sim"),
	usage: "code<String>",
	_compl: '',
	_priority: Infinity,
	body: async function body(code: string) {
		return eval(code);
	}, //body
	parse: function parse(line: string, panel?: CT.Panel) {
		return this.body(line);
	} //parse
});

export default command;
