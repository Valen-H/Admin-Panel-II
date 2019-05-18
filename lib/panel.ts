"use strict";

import Classes from "./Classes";
import * as fs from "fs-extra";
import * as path from "path";
import { promisify } from "util";


export module Panel {

	const paccess: Function = promisify(fs.access),
		copy: Function = promisify(fs.copy);

	/**
	 * Wrapper for setting up the Panel.
	 * 
	 * @author V. H.
	 * @date 2019-05-12
	 * @export
	 * @param {Classes.Options.PanelOpts} [opts]
	 * @returns {Classes.Panel}
	 */
	export async function setup(opts?: Classes.Options.PanelOpts) {
		let panel: Classes.Panel = new Classes.Panel(opts);

		try {
			await paccess(panel.opts.subopts.serveDir);
		} catch (ign) {
			await copy(panel.opts._serveDir, panel.opts.subopts.serveDir);
		}

		return panel;
	} //setup

} //Panel

export default Panel;
export { Classes };
