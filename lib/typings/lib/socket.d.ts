/// <reference types="socket.io" />
import Classes from './Classes';
export declare module Socket {
    /**
     * Wrapper for setting up the Socket.
     *
     * @author V. H.
     * @date 2019-05-12
     * @export
     * @param {SocketIO.Server} io
     * @param {Classes.Panel} panel
     * @returns {SocketIO.Namespace}
     */
    function setup(io: SocketIO.Server, panel: Classes.Panel): import("socket.io").Namespace;
}
export default Socket;
//# sourceMappingURL=socket.d.ts.map