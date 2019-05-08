"use strict";

import Classes from "./Classes";

export module Panel {

	export function setup(opts?: Classes.Options.PanelOpts): Classes.Panel {
		let panel: Classes.Panel = new Classes.Panel(opts);

		return panel;
	} //setup

} //Panel

export default Panel;
export { Classes };
