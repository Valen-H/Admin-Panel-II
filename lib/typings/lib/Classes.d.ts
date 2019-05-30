/// <reference types="node" />
import socket from "socket.io";
import * as vserv from "vale-server-ii";
import { AssertionError } from "assert";
import { EventEmitter } from "events";
import * as readline from "readline";
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
            readonly auth: string;
            readonly _serveDir?: string;
            readonly subopts?: vserv.Classes.Options.ServerOptions;
            readonly sockopts?: socket.ServerOptions;
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
            readonly name: string;
            readonly exp: RegExp;
            readonly desc?: string;
            readonly usage?: string;
            readonly _priority: number;
            readonly _compl: string;
            readonly _domain?: Types.DOMAINS;
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
        readonly rss: number;
        readonly th: number;
        readonly uh: number;
        readonly ext: number;
        readonly mem: number;
        readonly us: NodeJS.CpuUsage;
    };
    const Null: symbol;
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
        desc?: string;
        usage?: string;
        _priority: number;
        _compl: string;
        _domain?: Types.DOMAINS;
        static prefix: string;
        constructor(ctor: Options.CommandOpts);
        /**
         * @description Execute command code.
         * @author V. H.
         * @date 2019-05-30
         * @param {...any[]} params
         * @returns {Promise<any>}
         * @memberof Command
         * @override
         */
        body(...params: any[]): Promise<any>;
        /**
         * @description Sanitize before calling `body`
         * @author V. H.
         * @date 2019-05-30
         * @param {string} line
         * @param {Panel} panel
         * @returns {*}
         * @memberof Command
         * @override
         */
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
        private _rl_paused;
        serv: vserv.Classes.Server;
        sock: socket.Server;
        opts: Options.PanelOpts;
        cmds: Command[];
        _debuglog: string;
        _rllog: string;
        refresh: boolean;
        custping: number;
        stat: boolean;
        private _stats;
        readonly stater: Stats;
        _input: NodeJS.ReadStream;
        _output: NodeJS.WriteStream;
        _error: NodeJS.WriteStream;
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
        cli({ input, output }: {
            input: NodeJS.ReadStream;
            output: NodeJS.WriteStream;
            error: NodeJS.WriteStream;
        }): Promise<readline.Interface>;
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
        _loadCLI(from?: string): Promise<Command[]>;
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
        on(event: "_debug", listener: (...args: any[]) => void): this;
        once(event: "_debug", listener: (...args: any[]) => void): this;
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
        private _prevc;
        samples: SnapReg[];
        private bound;
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
        on(event: "snap", listener: (...args: any[]) => void): this;
        once(event: "snap", listener: (...args: any[]) => void): this;
    }
}
export default Classes;
//# sourceMappingURL=Classes.d.ts.map