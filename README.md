  
# admin-panel-ii  
  
  A management panel for Node processes. :zap:  
  
  ***  
  
## TODO  
  
* [x] Add proccess memory stats (client + back)  
* [x] CLI CMD  
* [ ] WebDAV CMD [halfway]  
* [x] WS CMD  
  
## Commands  
  
* [x] `kill[ interval\<Number> [exitCode\<Number>]]`  
* [x] `exit` - Closes CLI.  
* [x] `clear` - Clears console.  
* [x] `sock event<String> message<String>` - Sends message to sockets.  
* [x] `help[ command<String>]` - Receive help for a command.  
* [x] `catch` - Catch unknown command errors.  
* [x] `eval` - Evaluate a JS snippet.  
* [x] `syscall code<String>` - *new*, perform a system call.  
  
> Type `.h` in CLI for more (accurate) details.  
  
## Usage  
  
```js
const Panel = require("adm-panel2");

Panel.setup().then(panel => {
    panel.toggleStats(); //every 1s, take memory snap
    panel.cli({ input: process.stdin, output: process.stdout }); //type '.' (default prefix) and hit 'tab' for completion.
    panel.start().then(() => console.log("Started.")); //hosted by default on http://admin:adm@localhost:9999/panel
});
```  
  
### Latest features  
  
* Keeps logs history.  
  
### External Dependencies  
  
* chalk (optional)  
* fs-extra  
* socket.io  
* *client-side*: Plotly.js  
  
> Based on [`vale-server-ii`](https://github.com/Valen-H/Server-II)  
  
### Modules that depend on `adm-panel2`  
  
* [Vale3](#https://github.com/Valen-H/Vale3)  
  
> A trick for process restarting:
> Add a `restarting` field in `scripts` of `package.json` with body of `"restarting": "node index.js || npm run restarting"`, this way you can have the system relaunch your task upon non-zero exit codes. Reload the process by having an `fs.Watcher` watch for file changes and emitting a `.kill 0 2` to the panel.  
  