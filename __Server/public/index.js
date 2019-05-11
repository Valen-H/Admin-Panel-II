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
				ext: { }
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
					}
					event.target.value = '';
				}
			}, //text
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
} //skip

function htmlesc(text) {
	return "<p>" + text/*.replace(/"/gmis, "&quot;")*/.replace(/&/gmis, "&amp;").replace(/</gmis, "&lt;").replace(/>/gmis, "&gt;").replace(/\\n/gmis, "</p><p>") + "</p>";
} //htmlesc

function parseURL(url = location.href) {
	let nurl = new URL(url);
	return nurl;
} //parseURL

window.addEventListener("DOMContentLoaded", start);
