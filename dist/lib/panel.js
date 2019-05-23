"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Classes_1 = tslib_1.__importDefault(require("./Classes"));
exports.Classes = Classes_1.default;
const fs = tslib_1.__importStar(require("fs-extra"));
const util_1 = require("util");
var Panel;
(function (Panel) {
    const paccess = util_1.promisify(fs.access), copy = util_1.promisify(fs.copy);
    /**
     * Wrapper for setting up the Panel.
     *
     * @author V. H.
     * @date 2019-05-12
     * @export
     * @param {Classes.Options.PanelOpts} [opts]
     * @returns {Classes.Panel}
     */
    async function setup(opts) {
        let panel = new Classes_1.default.Panel(opts);
        try {
            await paccess(panel.opts.subopts.serveDir);
        }
        catch (ign) {
            await copy(panel.opts._serveDir, panel.opts.subopts.serveDir);
        }
        return panel;
    } //setup
    Panel.setup = setup;
})(Panel = exports.Panel || (exports.Panel = {})); //Panel
exports.default = Panel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYixnRUFBZ0M7QUFrQ3ZCLGtCQWxDRixpQkFBTyxDQWtDRTtBQWpDaEIscURBQStCO0FBQy9CLCtCQUFpQztBQUdqQyxJQUFjLEtBQUssQ0EwQmxCO0FBMUJELFdBQWMsS0FBSztJQUVsQixNQUFNLE9BQU8sR0FBYSxnQkFBUyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFDN0MsSUFBSSxHQUFhLGdCQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXJDOzs7Ozs7OztPQVFHO0lBQ0ksS0FBSyxVQUFVLEtBQUssQ0FBQyxJQUFnQztRQUMzRCxJQUFJLEtBQUssR0FBa0IsSUFBSSxpQkFBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuRCxJQUFJO1lBQ0gsTUFBTSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDM0M7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNiLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzlEO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDLENBQUMsT0FBTztJQVZhLFdBQUssUUFVMUIsQ0FBQTtBQUVGLENBQUMsRUExQmEsS0FBSyxHQUFMLGFBQUssS0FBTCxhQUFLLFFBMEJsQixDQUFDLE9BQU87QUFFVCxrQkFBZSxLQUFLLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IENsYXNzZXMgZnJvbSBcIi4vQ2xhc3Nlc1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzLWV4dHJhXCI7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tIFwidXRpbFwiO1xuXG5cbmV4cG9ydCBtb2R1bGUgUGFuZWwge1xuXG5cdGNvbnN0IHBhY2Nlc3M6IEZ1bmN0aW9uID0gcHJvbWlzaWZ5KGZzLmFjY2VzcyksXG5cdFx0Y29weTogRnVuY3Rpb24gPSBwcm9taXNpZnkoZnMuY29weSk7XG5cblx0LyoqXG5cdCAqIFdyYXBwZXIgZm9yIHNldHRpbmcgdXAgdGhlIFBhbmVsLlxuXHQgKiBcblx0ICogQGF1dGhvciBWLiBILlxuXHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdCAqIEBleHBvcnRcblx0ICogQHBhcmFtIHtDbGFzc2VzLk9wdGlvbnMuUGFuZWxPcHRzfSBbb3B0c11cblx0ICogQHJldHVybnMge0NsYXNzZXMuUGFuZWx9XG5cdCAqL1xuXHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAob3B0cz86IENsYXNzZXMuT3B0aW9ucy5QYW5lbE9wdHMpOiBQcm9taXNlPENsYXNzZXMuUGFuZWw+IHtcblx0XHRsZXQgcGFuZWw6IENsYXNzZXMuUGFuZWwgPSBuZXcgQ2xhc3Nlcy5QYW5lbChvcHRzKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBwYWNjZXNzKHBhbmVsLm9wdHMuc3Vib3B0cy5zZXJ2ZURpcik7XG5cdFx0fSBjYXRjaCAoaWduKSB7XG5cdFx0XHRhd2FpdCBjb3B5KHBhbmVsLm9wdHMuX3NlcnZlRGlyLCBwYW5lbC5vcHRzLnN1Ym9wdHMuc2VydmVEaXIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBwYW5lbDtcblx0fSAvL3NldHVwXG5cbn0gLy9QYW5lbFxuXG5leHBvcnQgZGVmYXVsdCBQYW5lbDtcbmV4cG9ydCB7IENsYXNzZXMgfTtcbiJdfQ==