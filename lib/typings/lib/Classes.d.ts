/// <reference types="node" />
/**
 * IMPL: start/stop webserv
 */
import * as vserv from "vale-server-ii";
import socket from "socket.io";
import * as readline from "readline";
import { AssertionError } from 'assert';
export declare var chalk: Function;
export declare module Classes {
    namespace Options {
        interface PanelOpts {
            auth?: string;
            subopts?: vserv.Classes.Options.ServerOptions;
            sockopts?: socket.ServerOptions;
        }
    }
    namespace Errors {
        const ENORL: ReferenceError;
        const EALRRL: AssertionError;
    }
    class Command {
        name: string;
        exp: RegExp;
        desc: string;
        usage: string;
        _priority: number;
        _compl: string;
        static prefix: string;
        constructor(ctor: Command);
        body(...params: any[]): Promise<void>;
        parse(line: string, panel: Panel): Promise<void>;
    }
    const Panel_base: any;
    class Panel extends Panel_base {
        rl: readline.Interface;
        _rl_paused: boolean;
        serv: vserv.Classes.Server;
        sock: socket.Server;
        opts: Options.PanelOpts;
        _debug: boolean;
        cmds: Command[];
        static defaultOpts: Options.PanelOpts;
        constructor(opts?: Options.PanelOpts);
        start(opts?: vserv.Classes.Options.ServerOptions): Promise<this>;
        cli({ input, output }: {
            input: any;
            output: any;
        }): Promise<readline.Interface>;
        toggleCLI(state?: boolean): this;
        _loadCLI(from?: string): Promise<{}>;
    }
    class Stats {
        constructor();
    }
}
export default Classes;
//# sourceMappingURL=Classes.d.ts.map