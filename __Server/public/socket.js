"use strict";

var sock;  //xpose

async function start() {
	if (settings.noconnect) return;

	sock = io("/admin", {
		path: "/ws",
		reconnectionAttempts: 10
	});

	sock.on("connect", async () => {
		if (settings.log) console.info("Socket %cconnected.", "color: green");
		if (settings.elements.report) settings.elements.report.ws.innerHTML = `<font style="color: LawnGreen">Online</font>`;
	});
	sock.on("disconnect", async () => {
		if (settings.log) console.info("Socket %cdisconnected.", "color: red");
		if (settings.elements.report) settings.elements.report.ws.innerHTML = `<font style="color: red">Offline</font>`;
	});
	sock.on("reconnecting", async num => {
		if (settings.log) console.debug(`Reconnection attempt %c#${num} ...`, "color: cyan");
		if (settings.elements.report) settings.elements.report.ws.innerHTML = `<font style="color: red">Offline </font><font style="color: cyan">Reconnection #${num}</font>...`;
	});
	sock.on("reconnect", async num => {
		if (settings.log) console.info(`%cReconnection Successful. %c#${num}`, "color: green", "color: cyan");
		if (settings.elements.report) settings.elements.report.ws.innerHTML = `<font style="color: LawnGreen">Online </font><font style="color: cyan">Reconnection Successful.</font>`;
	});
	sock.on("reconnect_error", async err => console.warn("Reconnection %cfailure", "color: red"));
	sock.on("reconnect_failed", async err => {
		if (settings.log) console.error("%cReconnection Failed.", "color: red");
		if (settings.elements.report) settings.elements.report.ws.innerHTML = `<font style="color: red">Offline Reconnection Failed</font>...`;

		if (settings.refresh) {
			setTimeout(() => location.reload(), settings.refresh);
		}
	});
	sock.on("ping", async () => console.debug("%cPinging...", "color: green"));
	sock.on("pong", async lat => console.debug(`%cPing %c${lat} ms.`, "color: green", "color: cyan"));
	sock.on("joined", async room => console.info(`Joined %c${room}.`, "color: gray"));
	sock.on("eval", async (code, ack) => {
		let out = eval(code);
		if (settings.log) console.debug(`%cEVAL: '${code}'  --->\n  '${out}'`, "color: GoldenRod");
		if (typeof ack === "function") ack(code);
	});
	sock.on("refresh", async time => {
		if (settings.log) console.info("Refreshing...", time);
		if (time = time || settings.refresh) {
			setTimeout(() => location.reload(), time);
		} else {
			location.reload();
		}
	});
	sock.on("message", async (...msg) => {
		if (settings.elements.second1.logs) {
			settings.elements.second1.logs.innerHTML += htmlesc(msg.join(' '));
			if (settings.autoscroll) settings.elements.second1.logs.scrollTop = settings.elements.second1.logs.scrollHeight;
		}
	});
	sock.on("_debug", async (...msg) => {
		if (settings.elements.second1.debug) {
			settings.elements.second1.debug.innerHTML += htmlesc(msg.join(' '));
			if (settings.autoscroll) settings.elements.second1.debug.scrollTop = settings.elements.second1.debug.scrollHeight;
		}
	});
	sock.on("_s_debug", async (...msg) => {
		if (settings.elements.second1.debug) {
			settings.elements.second1.debug.innerHTML += htmlesc(msg.join(' '));
			if (settings.autoscroll) settings.elements.second1.debug.scrollTop = settings.elements.second1.debug.scrollHeight;
		}
	});
	sock.on("cli", async (...msg) => {
		if (settings.elements.second1.cli) {
			settings.elements.second1.cli.innerHTML += htmlesc(msg.join(' '));
			if (settings.autoscroll) settings.elements.second1.cli.scrollTop = settings.elements.second1.cli.scrollHeight;
		}
	});
	sock.on("stat", async (which, val) => {
		if (settings.update) settings.elements.report.stat[which].innerHTML = val;

		if (which.endsWith("mem")) {
			let val = Math.round(100 - ((settings.elements.report.stat.freemem.innerHTML * 1) / (settings.elements.report.stat.totalmem.innerHTML * 1)) * 100);

			if (!isNaN(val)) {
				settings.elements.report.stat.memb2.innerText = settings.elements.report.stat.memb1.value = val;
			}
		} else if (which === "total1") {
			let val = Math.round(((settings.elements.report.stat.total1.innerHTML * 1) / (settings.elements.report.stat.rss.innerHTML * 1)) * 100),
				val2 = Math.round((settings.elements.report.stat.rss.innerHTML * 1 - settings.elements.report.stat.total1.innerHTML * 1) * 100) / 100;

			if (!isNaN(val)) {
				settings.elements.report.stat.total2.innerText = val;
			}
			if (!isNaN(val2)) {
				let val3 = Math.round(((settings.elements.report.stat.stack1.innerHTML * 1) / (settings.elements.report.stat.rss.innerHTML * 1)) * 100);
				settings.elements.report.stat.stack1.innerText = val2;

				if (!isNaN(val3)) {
					settings.elements.report.stat.stack2.innerText = val3;
				}
			}
		} else if (which === "used1") {
			let val = Math.round(((settings.elements.report.stat.used1.innerHTML * 1) / (settings.elements.report.stat.total1.innerHTML * 1)) * 100),
				val2 = Math.round(((settings.elements.report.stat.total1.innerHTML * 1) - (settings.elements.report.stat.used1.innerHTML * 1)) * 100) / 100;

			if (!isNaN(val)) {
				settings.elements.report.stat.used2.innerText = val;
				settings.elements.report.stat.used2.style.color = val > 70 ? "red" : "inherit";
			}
			if (!isNaN(val2)) {
				let val3 = Math.round(val2 / (settings.elements.report.stat.total1.innerHTML * 1) * 100);
				settings.elements.report.stat.free1.innerText = val2;

				if (!isNaN(val3)) {
					settings.elements.report.stat.free2.innerText = val3;
					settings.elements.report.stat.free2.style.color = (val3 > 10 && val3 < 30) ? "LawnGreen" : "inherit";
				}
			}
		}
	});

	if (settings.log) console.info("Sockets loaded.");
} //start

window.addEventListener("DOMContentLoaded", start);
