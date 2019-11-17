"use strict";

/** 
 * Make client-side Command
 */

var settings = {
	refresh: 1000,  //reload on socket failed
	autoscroll: true,
	noconnect: false,
	log: true,
	alert: false,
	update: true,
	history: [ ],
	historydx: 0,
	historymax: 50,
	snaps: [ ],
	latency: [ ],
	maxSnaps: 100,
	maxLat: 100,
	elements: { 
		report: {
			ws: { },
			wsb1: async function wsb1(evt) {
				if (sock && sock.connected) {
					sock.disconnect();
				} else if (sock) {
					sock.connect();
				}
			}, //wsb1
			wsb2: async function wsb2() {
				if (sock) sock.emit("command", "kill");
			}, //wsb2
			stat: {
				arch: { },
				cpus: { },
				endian: { },
				freemem: { },
				totalmem: { },
				memb1: { },
				memb2: { },
				priority: { },
				home: { },
				host: { },
				platform: { },
				release: { },
				tmp: { },
				type: { },
				up: { },
				pup: { },
				cpuus: { },
				cpusy: { },
				cpuusp: { },
				cpusyp: { },
				cwd: { },
				stack1: { },
				stack2: { },
				rss: { },
				total1: { },
				total2: { },
				used1: { },
				used2: { },
				free1: { },
				free2: { },
				ext: { },
				title: { },
				version: { },
				usage: { },
				port: { }
			},
			update: async function update(evt) {
				//@ts-ignore
				event.target.style.color = (settings.update = !settings.update) ? "green" : "red";
			}, //update
		},
		second1: {
			autoscroll: { },
			autoscrollb1: async function autoscrollb1() {
				return settings.elements.second1.autoscroll.style.color = (settings.autoscroll = !settings.autoscroll) ? "green" : "red";
			}, //autoscrollb1
			clear: async function clear() {
				settings.elements.second1.logs.innerHTML = settings.elements.second1.debug.innerHTML = settings.elements.second1.cli.innerHTML = "";
			}, //clear
			logs: { },
			debug: { },
			cli: { },
			text: async function text(event) {
				if (event.key === "Enter") {
					if (sock) {
						sock.emit("cli", event.target.value);
						settings.history.unshift(event.target.value);
						let opt = document.createElement("option");
						opt.value = event.target.value;
						settings.elements.second1.recent.appendChild(opt);
						if (settings.history.length > settings.historymax) {
							let val = settings.history.pop();
							settings.elements.second1.recent.childNodes.item(settings.historydx).remove();
						}
					}
					event.target.value = '';
				} else if (event.key === "ArrowUp") {
					event.target.value = settings.history[settings.historydx = (settings.historydx + 1) >= settings.history.length ? 0 : (settings.historydx + 1)];
				} else if (event.key === "ArrowDown") {
					event.target.value = settings.history[settings.historydx = (settings.historydx - 1) < 0 ? settings.history.length - 1 : (settings.historydx - 1)];
				}
			}, //text
			recent: { }
		}
	}
};

async function start() {
	settings.elements.report.ws = document.querySelector("#main1 #report #ws-c");
	settings.elements.second1.autoscroll = document.querySelector("#second1 #autoscroll");
	settings.elements.second1.logs = document.querySelector("#second1 #logs");
	settings.elements.second1.debug = document.querySelector("#second1 #debug");
	settings.elements.second1.cli = document.querySelector("#second1 #cli");
	settings.elements.report.stat.arch = document.querySelector("#os #arch-c");
	settings.elements.report.stat.cpus = document.querySelector("#os #cpus-c");
	settings.elements.report.stat.endian = document.querySelector("#os #endian-c");
	settings.elements.report.stat.freemem = document.querySelector("#os #freemem-c");
	settings.elements.report.stat.totalmem = document.querySelector("#os #totalmem-c");
	settings.elements.report.stat.memb1 = document.querySelector("#os #mem-b1");
	settings.elements.report.stat.memb2 = document.querySelector("#os #mem-b2");
	settings.elements.report.stat.priority = document.querySelector("#os #priority-c");
	settings.elements.report.stat.home = document.querySelector("#os #home-c");
	settings.elements.report.stat.host = document.querySelector("#os #host-c");
	settings.elements.report.stat.platform = document.querySelector("#os #platform-c");
	settings.elements.report.stat.release = document.querySelector("#os #release-c");
	settings.elements.report.stat.tmp = document.querySelector("#os #tmp-c");
	settings.elements.report.stat.type = document.querySelector("#os #type-c");
	settings.elements.report.stat.up = document.querySelector("#os #up-c");
	settings.elements.report.stat.pup = document.querySelector("#os #pup-c");
	settings.elements.report.stat.cpuus = document.querySelector("#os #cpu-c1");
	settings.elements.report.stat.cpusy = document.querySelector("#os #cpu-c2");
	settings.elements.report.stat.cpuusp = document.querySelector("#os #cpu-c3");
	settings.elements.report.stat.cpusyp = document.querySelector("#os #cpu-c4");
	settings.elements.report.stat.cwd = document.querySelector("#os #cwd-c");
	settings.elements.report.stat.rss = document.querySelector("#os #rss-c");
	settings.elements.report.stat.stack1 = document.querySelector("#os #stack-c1");
	settings.elements.report.stat.stack2 = document.querySelector("#os #stack-c2");
	settings.elements.report.stat.total1 = document.querySelector("#os #total-c1");
	settings.elements.report.stat.total2 = document.querySelector("#os #total-c2");
	settings.elements.report.stat.used1 = document.querySelector("#os #used-c1");
	settings.elements.report.stat.used2 = document.querySelector("#os #used-c2");
	settings.elements.report.stat.free1 = document.querySelector("#os #free-c1");
	settings.elements.report.stat.free2 = document.querySelector("#os #free-c2");
	settings.elements.report.stat.ext = document.querySelector("#os #ext-c");
	settings.elements.report.stat.title = document.querySelector("#os #title-c");
	settings.elements.report.stat.version = document.querySelector("#os #version-c");
	settings.elements.report.stat.usage = document.querySelector("#os #usage-c");
	settings.elements.report.stat.port = document.querySelector("#os #port-c");
	settings.elements.second1.recent = document.querySelector("#second1 #recent");
	
	await skip();
	if (settings.log) console.info("Index loaded.");
} //start

async function skip() {
	let url = parseURL();

	/**
	 * noconnect=bool
	 * alert=bool
	 * log=bool
	 * refresh=num
	 */

	if (url.searchParams.has("refresh")) settings.refresh = Number(url.searchParams.get("refresh"));
	if (url.searchParams.has("autoscroll")) settings.autoscroll = !!url.searchParams.get("autoscroll");
	if (url.searchParams.has("noconnect")) settings.noconnect = !!url.searchParams.get("noconnect");
	if (url.searchParams.has("log")) settings.log = !!url.searchParams.get("log");
	if (url.searchParams.has("alert")) settings.alert = !!url.searchParams.get("alert");
	if (url.searchParams.has("update")) settings.update = !!url.searchParams.get("update");
	if (url.searchParams.has("maxsnaps")) settings.maxSnaps = Number(url.searchParams.get("maxsnaps"));
	if (url.searchParams.has("maxlat")) settings.maxLat = Number(url.searchParams.get("maxlat"));
} //skip

function htmlesc(text) {
	return "<p>" + text/*.replace(/"/gmi, "&quot;")*/.replace(/&/gmi, "&amp;").replace(/</gmi, "&lt;").replace(/>/gmi, "&gt;").replace(/\\n/gmi, "</p><p>") + "</p>";
} //htmlesc

function parseURL(url = location.href) {
	let nurl = new URL(url);
	return nurl;
} //parseURL

function stat(regs) {
	if (window["Plotly"] === undefined) return;
	let rss = {
			x: [],
			y: [],
			mode: "lines",
			name: "RSS"
		},
		th = {
			x: [],
			y: [],
			mode: "lines",
			name: "TotalHeap"
		},
		uh = {
			x: [],
			y: [],
			mode: "lines",
			name: "UsedHeap"
		},
		ext = {
			x: [],
			y: [],
			mode: "lines",
			name: "External"
		},
		mem = {
			x: [],
			y: [],
			mode: "lines",
			name: "Free Memory",
			legendgroup: "Memory",
			xaxis: "x2",
			yaxis: "y2"
		},
		u = {
			x: [],
			y: [],
			mode: "lines",
			name: "UserCPU",
			legendgroup: "CPU",
			xaxis: "x3",
			yaxis: "y3"
		},
		s = {
			x: [],
			y: [],
			mode: "lines",
			name: "SystemCPU",
			legendgroup: "CPU",
			xaxis: "x3",
			yaxis: "y3"
		},
		lat = {
			x: [],
			y: [],
			mode: "lines",
			name: "Latency",
			legendgroup: "Latency",
			xaxis: "x4",
			yaxis: "y4"
		},
		
		data = [rss, th, uh, ext, mem, u, s, lat],
		
		layout = {
			title: "Statistics",
			xaxis: {
				title: "Uptime (s)"
			},
			yaxis: {
				title: "MB"
			},
			xaxis2: {
				title: "Uptime (s)"
			},
			yaxis2: {
				title: "GB"
			},
			xaxis3: {
				title: "Uptime (s)"
			},
			yaxis3: {
				title: "ms"
			},
			xaxis4: {
				title: "Ping"
			},
			yaxis4: {
				title: "ms"
			},
			grid: { rows: 2, columns: 2, pattern: "independent" }
	};
	
	for (let cntr = 0; cntr < settings.snaps.length; cntr++) {
		rss.x.push(cntr);
		rss.y.push(Math.round(100 * regs[cntr].rss / 1024 / 1024) / 100);
		th.x.push(cntr);
		th.y.push(Math.round(100 * regs[cntr].th / 1024 / 1024) / 100);
		uh.x.push(cntr);
		uh.y.push(Math.round(100 * regs[cntr].uh / 1024 / 1024) / 100);
		ext.x.push(cntr);
		ext.y.push(Math.round(100 * regs[cntr].ext / 1024 / 1024) / 100);
		mem.x.push(cntr);
		mem.y.push(Math.round(100 * regs[cntr].mem / 1024 / 1024 / 1024) / 100);
		u.x.push(cntr);
		u.y.push(regs[cntr].us.user / 1000);
		s.x.push(cntr);
		s.y.push(regs[cntr].us.system / 1000);
	}
	for (let cntr = 0; cntr < settings.latency.length; cntr++) {
		lat.x.push(cntr);
		lat.y.push(settings.latency[cntr]);
	}

	return Plotly.react("stats", data, layout);
} //stat

window.addEventListener("DOMContentLoaded", start);
