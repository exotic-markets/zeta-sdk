"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNetwork = exports.Network = void 0;
var Network;
(function (Network) {
    Network["LOCALNET"] = "localnet";
    Network["DEVNET"] = "devnet";
    Network["MAINNET"] = "mainnet";
})(Network = exports.Network || (exports.Network = {}));
function toNetwork(network) {
    if (network == "localnet")
        return Network.LOCALNET;
    if (network == "devnet")
        return Network.DEVNET;
    if (network == "mainnet")
        return Network.MAINNET;
    throw Error("Invalid network");
}
exports.toNetwork = toNetwork;
