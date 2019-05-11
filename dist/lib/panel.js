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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYixnRUFBZ0M7QUEwQnZCLGtCQTFCRixpQkFBTyxDQTBCRTtBQXpCaEIscURBQStCO0FBQy9CLG1EQUE2QjtBQUM3QiwrQkFBaUM7QUFFakMsSUFBYyxLQUFLLENBa0JsQjtBQWxCRCxXQUFjLEtBQUs7SUFFbEIsTUFBTSxPQUFPLEdBQWEsZ0JBQVMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQzdDLElBQUksR0FBYSxnQkFBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFDbkMsU0FBUyxHQUFhLGdCQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRXhDLEtBQUssVUFBVSxLQUFLLENBQUMsSUFBZ0M7UUFDM0QsSUFBSSxLQUFLLEdBQWtCLElBQUksaUJBQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbkQsSUFBSTtZQUNILE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzNDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDYixNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3JHO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDLENBQUMsT0FBTztJQVZhLFdBQUssUUFVMUIsQ0FBQTtBQUVGLENBQUMsRUFsQmEsS0FBSyxHQUFMLGFBQUssS0FBTCxhQUFLLFFBa0JsQixDQUFDLE9BQU87QUFFVCxrQkFBZSxLQUFLLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IENsYXNzZXMgZnJvbSBcIi4vQ2xhc3Nlc1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzLWV4dHJhXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tIFwidXRpbFwiO1xuXG5leHBvcnQgbW9kdWxlIFBhbmVsIHtcblxuXHRjb25zdCBwYWNjZXNzOiBGdW5jdGlvbiA9IHByb21pc2lmeShmcy5hY2Nlc3MpLFxuXHRcdGNvcHk6IEZ1bmN0aW9uID0gcHJvbWlzaWZ5KGZzLmNvcHkpLFxuXHRcdGVuc3VyZURpcjogRnVuY3Rpb24gPSBwcm9taXNpZnkoZnMuZW5zdXJlRGlyKTtcblxuXHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAob3B0cz86IENsYXNzZXMuT3B0aW9ucy5QYW5lbE9wdHMpIHtcblx0XHRsZXQgcGFuZWw6IENsYXNzZXMuUGFuZWwgPSBuZXcgQ2xhc3Nlcy5QYW5lbChvcHRzKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBwYWNjZXNzKHBhbmVsLm9wdHMuc3Vib3B0cy5zZXJ2ZURpcik7XG5cdFx0fSBjYXRjaCAoaWduKSB7XG5cdFx0XHRhd2FpdCBjb3B5KHBhdGgucmVzb2x2ZShcIi4uXCIgKyBwYXRoLnNlcCArIFwiLi5cIiArIHBhdGguc2VwICsgX19kaXJuYW1lKSwgcGFuZWwub3B0cy5zdWJvcHRzLnNlcnZlRGlyKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcGFuZWw7XG5cdH0gLy9zZXR1cFxuXG59IC8vUGFuZWxcblxuZXhwb3J0IGRlZmF1bHQgUGFuZWw7XG5leHBvcnQgeyBDbGFzc2VzIH07XG4iXX0=