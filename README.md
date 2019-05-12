  
# admin-panel-ii  
  
  A management panel for Node proccesses.  
  
  ***  
  
## TODO  
  
* [x] Add proccess memory stats (client + back)  
* [x] CLI CMD  
* [ ] WebDAV CMD [halfway]  
* [x] WS CMD  
  
## Commands  
  
* [x] kill  
* [x] exit  
* [x] clear  
* [x] sock  
* [x] help  
* [x] catch  
* [x] eval  
  
## Usage  
  
```js
Panel.setup().then(panel => {
    panel.toggleStats(); //every 1s, take memory snap
    panel.cli({ input: process.stdin, output: process.stdout }); //type '.' (default prefix) and hit 'tab' for completion.
    panel.start().then(() => console.log("Started.")); //hosted by default on http://admin:adm@localhost:9999/panel
});
```  
  
### External Dependencies  
  
* chalk (optional)  
* fs-extra  
* socket.io  
  
> Based on [`vale-server-ii`](https://github.com/Valen-H/Server-II)  
  