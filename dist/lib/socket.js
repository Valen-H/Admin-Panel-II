"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Socket;
(function (Socket) {
    function setup(io, panel) {
        let admin = io.of("/admin");
        admin.on("connection", socket => {
            if (panel._debug) {
                panel.serv._debug(socket.id + " connected.");
            }
            socket.join("admin", err => {
                if (!err)
                    socket.emit("joined", "admin");
            });
            socket.on("error", err => {
                if (panel._debug)
                    panel.serv._debug(err);
            });
            socket.once("disconnecting", reason => {
                if (panel._debug)
                    panel.serv._debug(socket.id + " disconnecting  " + reason);
            });
            socket.once("disconnected", reason => {
                if (panel._debug)
                    panel.serv._debug(socket.id + " disconnected  " + reason);
            });
        });
    } //setup
    Socket.setup = setup;
})(Socket = exports.Socket || (exports.Socket = {})); //Socket
exports.default = Socket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3NvY2tldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7O0FBSWIsSUFBYyxNQUFNLENBeUJuQjtBQXpCRCxXQUFjLE1BQU07SUFFbkIsU0FBZ0IsS0FBSyxDQUFDLEVBQW1CLEVBQUUsS0FBb0I7UUFDOUQsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU1QixLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsRUFBRTtZQUMvQixJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQ2pCLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsYUFBYSxDQUFDLENBQUM7YUFDN0M7WUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDMUIsSUFBSSxDQUFDLEdBQUc7b0JBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDeEIsSUFBSSxLQUFLLENBQUMsTUFBTTtvQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNyQyxJQUFJLEtBQUssQ0FBQyxNQUFNO29CQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDOUUsQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDcEMsSUFBSSxLQUFLLENBQUMsTUFBTTtvQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxDQUFDO1lBQzdFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsT0FBTztJQXJCTyxZQUFLLFFBcUJwQixDQUFBO0FBRUYsQ0FBQyxFQXpCYSxNQUFNLEdBQU4sY0FBTSxLQUFOLGNBQU0sUUF5Qm5CLENBQUMsUUFBUTtBQUVWLGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0IENsYXNzZXMgZnJvbSAnLi9DbGFzc2VzJztcclxuXHJcbmV4cG9ydCBtb2R1bGUgU29ja2V0IHtcclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIHNldHVwKGlvOiBTb2NrZXRJTy5TZXJ2ZXIsIHBhbmVsOiBDbGFzc2VzLlBhbmVsKSB7XHJcblx0XHRsZXQgYWRtaW4gPSBpby5vZihcIi9hZG1pblwiKTtcclxuXHJcblx0XHRhZG1pbi5vbihcImNvbm5lY3Rpb25cIiwgc29ja2V0ID0+IHtcclxuXHRcdFx0aWYgKHBhbmVsLl9kZWJ1Zykge1xyXG5cdFx0XHRcdHBhbmVsLnNlcnYuX2RlYnVnKHNvY2tldC5pZCArIFwiIGNvbm5lY3RlZC5cIik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNvY2tldC5qb2luKFwiYWRtaW5cIiwgZXJyID0+IHtcclxuXHRcdFx0XHRpZiAoIWVycikgc29ja2V0LmVtaXQoXCJqb2luZWRcIiwgXCJhZG1pblwiKTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHNvY2tldC5vbihcImVycm9yXCIsIGVyciA9PiB7XHJcblx0XHRcdFx0aWYgKHBhbmVsLl9kZWJ1ZykgcGFuZWwuc2Vydi5fZGVidWcoZXJyKTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHNvY2tldC5vbmNlKFwiZGlzY29ubmVjdGluZ1wiLCByZWFzb24gPT4ge1xyXG5cdFx0XHRcdGlmIChwYW5lbC5fZGVidWcpIHBhbmVsLnNlcnYuX2RlYnVnKHNvY2tldC5pZCArIFwiIGRpc2Nvbm5lY3RpbmcgIFwiICsgcmVhc29uKTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHNvY2tldC5vbmNlKFwiZGlzY29ubmVjdGVkXCIsIHJlYXNvbiA9PiB7XHJcblx0XHRcdFx0aWYgKHBhbmVsLl9kZWJ1ZykgcGFuZWwuc2Vydi5fZGVidWcoc29ja2V0LmlkICsgXCIgZGlzY29ubmVjdGVkICBcIiArIHJlYXNvbik7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fSAvL3NldHVwXHJcblxyXG59IC8vU29ja2V0XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTb2NrZXQ7XHJcblxyXG4iXX0=