"use strict";

import Classes from "./Classes";
import * as fs from "fs-extra";
import * as path from "path";
import { promisify } from "util";

export module Panel {

	const paccess: Function = promisify(fs.access),
		copy: Function = promisify(fs.copy),
		ensureDir: Function = promisify(fs.ensureDir);

	export async function setup(opts?: Classes.Options.PanelOpts) {
		let panel: Classes.Panel = new Classes.Panel(opts);

		try {
			await paccess(panel.opts.subopts.serveDir);
		} catch (ign) {
			await copy(path.resolve(".." + path.sep + ".." + path.sep + __dirname), panel.opts.subopts.serveDir);
		}

		return panel;
	} //setup

} //Panel

export default Panel;
export { Classes };
