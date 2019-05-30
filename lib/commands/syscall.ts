"use strict";

const Classes = module.parent.exports.Classes,
	chalk = module.parent.exports.chalk;

import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { Classes as CT } from "../Classes";

export var command: CT.Command = new Classes.Command({
	name: "syscall",
	desc: "Perform a system call",
	exp: new RegExp('^' + Classes.Command.prefix + "s(ys)? .+$", "sim"),
	usage: eval("'" + Classes.Command.prefix + "'") + "sys[ command<String>]",
	_compl: eval("'" + Classes.Command.prefix + "'") + "sys ",
	_priority: 5,
	body: async function body(panel: CT.Panel, command: string | string[]): Promise<symbol> {
		return new Promise((res: (value: symbol) => void, rej: (reason: Error) => void): void => {
			command = (<string>command).split(' ');

			let child: ChildProcessWithoutNullStreams = spawn(command.shift(), command, {
				shell: true,
				windowsHide: true
			});

			panel._output.write('\n');
			child.stdout.pipe(panel._output);
			child.stderr.pipe(panel._error);
			child.once("close", (code: number): void => {
				panel._output.write(chalk`\n{italic Process exited with code: {cyan ${code}}}\n\n`);
				res(Classes.Null);
			});
			child.on("error", rej);
		});
	}, //body
	parse: function parse(line: string, panel: CT.Panel): Promise<symbol> {
		return this.body(panel, line.split(' ').slice(1).join(' '));
	} //parse
});

export default command;
