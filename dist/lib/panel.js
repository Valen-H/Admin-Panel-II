"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Classes_1 = tslib_1.__importDefault(require("./Classes"));
exports.Classes = Classes_1.default;
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
const util_1 = require("util");
var Panel;
(function (Panel) {
    const paccess = util_1.promisify(fs.access), copy = util_1.promisify(fs.copy), ensureDir = util_1.promisify(fs.ensureDir);
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
            await copy(path.resolve(".." + path.sep + ".." + path.sep + __dirname), panel.opts.subopts.serveDir);
        }
        return panel;
    } //setup
    Panel.setup = setup;
})(Panel = exports.Panel || (exports.Panel = {})); //Panel
exports.default = Panel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYixnRUFBZ0M7QUFvQ3ZCLGtCQXBDRixpQkFBTyxDQW9DRTtBQW5DaEIscURBQStCO0FBQy9CLG1EQUE2QjtBQUM3QiwrQkFBaUM7QUFHakMsSUFBYyxLQUFLLENBMkJsQjtBQTNCRCxXQUFjLEtBQUs7SUFFbEIsTUFBTSxPQUFPLEdBQWEsZ0JBQVMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQzdDLElBQUksR0FBYSxnQkFBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFDbkMsU0FBUyxHQUFhLGdCQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRS9DOzs7Ozs7OztPQVFHO0lBQ0ksS0FBSyxVQUFVLEtBQUssQ0FBQyxJQUFnQztRQUMzRCxJQUFJLEtBQUssR0FBa0IsSUFBSSxpQkFBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuRCxJQUFJO1lBQ0gsTUFBTSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDM0M7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNiLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDckc7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUMsQ0FBQyxPQUFPO0lBVmEsV0FBSyxRQVUxQixDQUFBO0FBRUYsQ0FBQyxFQTNCYSxLQUFLLEdBQUwsYUFBSyxLQUFMLGFBQUssUUEyQmxCLENBQUMsT0FBTztBQUVULGtCQUFlLEtBQUssQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgQ2xhc3NlcyBmcm9tIFwiLi9DbGFzc2VzXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnMtZXh0cmFcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHByb21pc2lmeSB9IGZyb20gXCJ1dGlsXCI7XG5cblxuZXhwb3J0IG1vZHVsZSBQYW5lbCB7XG5cblx0Y29uc3QgcGFjY2VzczogRnVuY3Rpb24gPSBwcm9taXNpZnkoZnMuYWNjZXNzKSxcblx0XHRjb3B5OiBGdW5jdGlvbiA9IHByb21pc2lmeShmcy5jb3B5KSxcblx0XHRlbnN1cmVEaXI6IEZ1bmN0aW9uID0gcHJvbWlzaWZ5KGZzLmVuc3VyZURpcik7XG5cblx0LyoqXG5cdCAqIFdyYXBwZXIgZm9yIHNldHRpbmcgdXAgdGhlIFBhbmVsLlxuXHQgKiBcblx0ICogQGF1dGhvciBWLiBILlxuXHQgKiBAZGF0ZSAyMDE5LTA1LTEyXG5cdCAqIEBleHBvcnRcblx0ICogQHBhcmFtIHtDbGFzc2VzLk9wdGlvbnMuUGFuZWxPcHRzfSBbb3B0c11cblx0ICogQHJldHVybnMge0NsYXNzZXMuUGFuZWx9XG5cdCAqL1xuXHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAob3B0cz86IENsYXNzZXMuT3B0aW9ucy5QYW5lbE9wdHMpIHtcblx0XHRsZXQgcGFuZWw6IENsYXNzZXMuUGFuZWwgPSBuZXcgQ2xhc3Nlcy5QYW5lbChvcHRzKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBwYWNjZXNzKHBhbmVsLm9wdHMuc3Vib3B0cy5zZXJ2ZURpcik7XG5cdFx0fSBjYXRjaCAoaWduKSB7XG5cdFx0XHRhd2FpdCBjb3B5KHBhdGgucmVzb2x2ZShcIi4uXCIgKyBwYXRoLnNlcCArIFwiLi5cIiArIHBhdGguc2VwICsgX19kaXJuYW1lKSwgcGFuZWwub3B0cy5zdWJvcHRzLnNlcnZlRGlyKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcGFuZWw7XG5cdH0gLy9zZXR1cFxuXG59IC8vUGFuZWxcblxuZXhwb3J0IGRlZmF1bHQgUGFuZWw7XG5leHBvcnQgeyBDbGFzc2VzIH07XG4iXX0=