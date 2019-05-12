"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const http = tslib_1.__importStar(require("http"));
module.exports = {
    name: "auth",
    afters: [],
    befores: ["fix", "directory", "static", "end"],
    _fromFile: true,
    body: async function body(req, res, event) {
        if (!event.carriage._global.patherr) {
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-XSS-Protection", "1; mode=block");
            res.setHeader("Cache-Control", "private, no-store, max-age=3600, must-revalidate");
            res.setHeader("X-Frame-Options", "sameorigin");
            if (!req.headers["authorization"]) {
                res.writeHead(401, http.STATUS_CODES[401], {
                    "WWW-Authenticate": 'Basic realm="Access to the staging site", charset="UTF-8"'
                });
                event.server._debug(event.reqcntr, "(AUTH.TS) 401");
            }
            else {
                let challenge = Buffer.from(req.headers["authorization"].split(' ')[1], "base64").toString();
                if (challenge === event.server.data["auth"]) {
                    event.server._debug(event.reqcntr, "(AUTH.TS) PASS");
                    return event.pass();
                }
                else {
                    res.writeHead(403, http.STATUS_CODES[403]);
                    event.server._debug(event.reqcntr, "(AUTH.TS) 403");
                }
            }
        }
        else {
            res.writeHead(400, http.STATUS_CODES[400], { "warning": "bad root" });
        }
        res.end("ERR");
        return event.stop();
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9taWRkbGV3YXJlcy9hdXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1EQUE2QjtBQUc3QixNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2hCLElBQUksRUFBRSxNQUFNO0lBQ1osTUFBTSxFQUFFLEVBQUc7SUFDWCxPQUFPLEVBQUUsQ0FBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUU7SUFDaEQsU0FBUyxFQUFFLElBQUk7SUFDZixJQUFJLEVBQUUsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUF5QixFQUFFLEdBQXdCLEVBQUUsS0FBd0I7UUFDdEcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUVwQyxHQUFHLENBQUMsU0FBUyxDQUFDLHdCQUF3QixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ25ELEdBQUcsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDbkQsR0FBRyxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsa0RBQWtELENBQUMsQ0FBQztZQUNuRixHQUFHLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRS9DLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFO2dCQUNsQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUMxQyxrQkFBa0IsRUFBRSwyREFBMkQ7aUJBQy9FLENBQUMsQ0FBQztnQkFFSCxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO2FBQ3BEO2lCQUFNO2dCQUNOLElBQUksU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBRTdGLElBQUksU0FBUyxLQUFLLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUM1QyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBQ3JELE9BQU8sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2lCQUNwQjtxQkFBTTtvQkFDTixHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzNDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUM7aUJBQ3BEO2FBQ0Q7U0FDRDthQUFNO1lBQ04sR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1NBQ3RFO1FBRUQsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNmLE9BQU8sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3JCLENBQUM7Q0FDRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgaHR0cCBmcm9tIFwiaHR0cFwiO1xuaW1wb3J0ICogYXMgdnNlcnYgZnJvbSBcInZhbGUtc2VydmVyLWlpXCI7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRuYW1lOiBcImF1dGhcIixcblx0YWZ0ZXJzOiBbIF0sXG5cdGJlZm9yZXM6IFsgXCJmaXhcIiwgXCJkaXJlY3RvcnlcIiwgXCJzdGF0aWNcIiwgXCJlbmRcIiBdLFxuXHRfZnJvbUZpbGU6IHRydWUsXG5cdGJvZHk6IGFzeW5jIGZ1bmN0aW9uIGJvZHkocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBldmVudDogdnNlcnYuQ2xhc3Nlcy5ldnQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRpZiAoIWV2ZW50LmNhcnJpYWdlLl9nbG9iYWwucGF0aGVycikge1xuXG5cdFx0XHRyZXMuc2V0SGVhZGVyKFwiWC1Db250ZW50LVR5cGUtT3B0aW9uc1wiLCBcIm5vc25pZmZcIik7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKFwiWC1YU1MtUHJvdGVjdGlvblwiLCBcIjE7IG1vZGU9YmxvY2tcIik7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInByaXZhdGUsIG5vLXN0b3JlLCBtYXgtYWdlPTM2MDAsIG11c3QtcmV2YWxpZGF0ZVwiKTtcblx0XHRcdHJlcy5zZXRIZWFkZXIoXCJYLUZyYW1lLU9wdGlvbnNcIiwgXCJzYW1lb3JpZ2luXCIpO1xuXG5cdFx0XHRpZiAoIXJlcS5oZWFkZXJzW1wiYXV0aG9yaXphdGlvblwiXSkge1xuXHRcdFx0XHRyZXMud3JpdGVIZWFkKDQwMSwgaHR0cC5TVEFUVVNfQ09ERVNbNDAxXSwge1xuXHRcdFx0XHRcdFwiV1dXLUF1dGhlbnRpY2F0ZVwiOiAnQmFzaWMgcmVhbG09XCJBY2Nlc3MgdG8gdGhlIHN0YWdpbmcgc2l0ZVwiLCBjaGFyc2V0PVwiVVRGLThcIidcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0ZXZlbnQuc2VydmVyLl9kZWJ1ZyhldmVudC5yZXFjbnRyLCBcIihBVVRILlRTKSA0MDFcIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsZXQgY2hhbGxlbmdlID0gQnVmZmVyLmZyb20ocmVxLmhlYWRlcnNbXCJhdXRob3JpemF0aW9uXCJdLnNwbGl0KCcgJylbMV0sIFwiYmFzZTY0XCIpLnRvU3RyaW5nKCk7XG5cblx0XHRcdFx0aWYgKGNoYWxsZW5nZSA9PT0gZXZlbnQuc2VydmVyLmRhdGFbXCJhdXRoXCJdKSB7XG5cdFx0XHRcdFx0ZXZlbnQuc2VydmVyLl9kZWJ1ZyhldmVudC5yZXFjbnRyLCBcIihBVVRILlRTKSBQQVNTXCIpO1xuXHRcdFx0XHRcdHJldHVybiBldmVudC5wYXNzKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzLndyaXRlSGVhZCg0MDMsIGh0dHAuU1RBVFVTX0NPREVTWzQwM10pO1xuXHRcdFx0XHRcdGV2ZW50LnNlcnZlci5fZGVidWcoZXZlbnQucmVxY250ciwgXCIoQVVUSC5UUykgNDAzXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDAwLCBodHRwLlNUQVRVU19DT0RFU1s0MDBdLCB7IFwid2FybmluZ1wiOiBcImJhZCByb290XCIgfSk7XG5cdFx0fVxuXG5cdFx0cmVzLmVuZChcIkVSUlwiKTtcblx0XHRyZXR1cm4gZXZlbnQuc3RvcCgpO1xuXHR9XG59O1xuIl19