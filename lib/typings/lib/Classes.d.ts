/// <reference types="node" />
import socket from "socket.io";
import * as vserv from "vale-server-ii";
import { AssertionError } from "assert";
import { EventEmitter } from "events";
import * as readline from "readline";
import * as stream from "stream";
export declare var chalk: Function;
export declare module Classes {
    namespace Options {
        /**
         * Options for Classes.Panel
         *
         * @author V. H.
         * @date 2019-05-12
         * @export
         * @interface PanelOpts
         */
        interface PanelOpts {
            auth: string;
            _serveDir: string;
            subopts?: vserv.Classes.Options.ServerOptions;
            sockopts?: socket.ServerOptions;
        }
        /**
         * Options for Classes.Command
         *
         * @author V. H.
         * @date 2019-05-12
         * @export
         * @interface CommandOpts
         */
        interface CommandOpts {
            name: string;
            exp: RegExp;
            desc: string;
            usage: string;
            _priority: number;
            _compl: string;
            _domain: Types.DOMAINS;
        }
    }
    namespace Types {
        /**
         * Obsolete.
         *
         * @export
         * @enum {number}
         */
        enum DOMAINS {
            CLI,
            WS,
            WEBDAV,
            UI
        }
    }
    namespace Errors {
        const ENORL: ReferenceError;
        const EALRRL: AssertionError;
        const EALRLIS: AssertionError;
    }
    type SnapReg = {
        rss: number;
        th: number;
        uh: number;
        ext: number;
        mem: number;
        us: NodeJS.CpuUsage;
    };
    const Null: Symbol;
    /**
     * For CLI commands.
     *
     * @author V. H.
     * @date 2019-05-12
     * @export
     * @class Command
     * @implements {Options.CommandOpts}
     */
    class Command implements Options.CommandOpts {
        name: string;
        exp: RegExp;
        desc: string;
        usage: string;
        _priority: number;
        _compl: string;
        _domain: Types.DOMAINS;
        static prefix: string;
        constructor(ctor: Options.CommandOpts);
        body(...params: any[]): Promise<any>;
        parse(line: string, panel: Panel): any;
    }
    /**
     * Starting Interface.
     *
     * @author V. H.
     * @date 2019-05-12
     * @export
     * @class Panel
     * @extends {EventEmitter}
     */
    class Panel extends EventEmitter {
        rl: readline.Interface;
        _rl_paused: boolean;
        serv: vserv.Classes.Server;
        sock: socket.Server;
        opts: Options.PanelOpts;
        cmds: Command[];
        _debuglog: string;
        _rllog: string;
        refresh: boolean;
        custping: number;
        stat: boolean;
        _stats: NodeJS.Timeout;
        stater: Stats;
        _input: stream.Duplex;
        _output: stream.Duplex;
        _error: stream.Writable;
        static defaultOpts: Options.PanelOpts;
        constructor(opts?: Options.PanelOpts);
        /**
         * Start the server and socket.
         *
         * @author V. H.
         * @date 2019-05-12
         * @param {vserv.Classes.Options.ServerOptions} [opts=this.opts.subopts]
         * @returns this
         * @memberof Panel
         */
        start(opts?: vserv.Classes.Options.ServerOptions): Promise<this>;
        /**
         * Start a readline.Interface
         *
         * @author V. H.
         * @date 2019-05-12
         * @param {*} { input, output }
         * @returns readline.Interface
         * @memberof Panel
         */
        cli({ input, output }: any): Promise<readline.Interface>;
        /**
         * Toggle readline.Interface
         *
         * @author V. H.
         * @date 2019-05-12
         * @param {boolean} [state]
         * @returns
         * @memberof Panel
         */
        toggleCLI(state?: boolean): this;
        /**
         * Toggle Stater.
         *
         * @author V. H.
         * @date 2019-05-12
         * @param {boolean} [force]
         * @param {number} [ms]
         * @returns this
         * @memberof Panel
         */
        toggleStats(force?: boolean, ms?: number): this;
        /**
         * Load CLI commands.
         *
         * @author V. H.
         * @date 2019-05-12
         * @param {string} [from=path.join("__Server", "commands")]
         * @returns this.cmds
         * @memberof Panel
         */
        _loadCLI(from?: string): Promise<{}>;
        /**
         * Write to _debuglog
         *
         * @author V. H.
         * @date 2019-05-12
         * @param {...any[]} msg
         * @returns
         * @memberof Panel
         */
        _debug(...msg: any[]): this;
    }
    /**
     * Stater Class for metrics.
     *
     * @author V. H.
     * @date 2019-05-12
     * @export
     * @class Stats
     * @extends {EventEmitter}
     */
    class Stats extends EventEmitter {
        keepSamples: number;
        _prevc: NodeJS.CpuUsage;
        samples: SnapReg[];
        bound: boolean;
        constructor();
        /**
         * Take a metric snapshot.
         *
         * @author V. H.
         * @date 2019-05-12
         * @returns {SnapReg}
         * @memberof Stats
         */
        snap(): SnapReg;
        /**
         * setInterval for metrics.
         *
         * @author V. H.
         * @date 2019-05-12
         * @param {number} [ms=1000]
         * @returns NodeJS.Timeout
         * @memberof Stats
         */
        _bind(ms?: number): NodeJS.Timeout;
    }
}
export default Classes;
//# sourceMappingURL=Classes.d.ts.map