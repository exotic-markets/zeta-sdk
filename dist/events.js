"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventTypeToString = exports.EventType = void 0;
var EventType;
(function (EventType) {
    /**
     * Refers to events that reflect a change in the exchange state.
     */
    EventType[EventType["EXCHANGE"] = 0] = "EXCHANGE";
    /**
     * Expiration event for a zeta group.
     */
    EventType[EventType["EXPIRY"] = 1] = "EXPIRY";
    /**
     * Events that reflect a change in user state
     * i.e. Margin account or orders
     */
    EventType[EventType["USER"] = 2] = "USER";
    /**
     * A change in the clock account.
     */
    EventType[EventType["CLOCK"] = 3] = "CLOCK";
    /**
     * A change in the greeks account.
     */
    EventType[EventType["GREEKS"] = 4] = "GREEKS";
    /**
     * A trade event for the user margin account.
     */
    EventType[EventType["TRADE"] = 5] = "TRADE";
    /**
     * A trade v2 event for the user margin account.
     */
    EventType[EventType["TRADEV2"] = 6] = "TRADEV2";
    /**
     * An OrderComplete event for the user margin account.
     * Happens when an order is either fully filled or cancelled
     */
    EventType[EventType["ORDERCOMPLETE"] = 7] = "ORDERCOMPLETE";
    /**
     * An update in the orderbook.
     */
    EventType[EventType["ORDERBOOK"] = 8] = "ORDERBOOK";
    /*
     * On oracle account change.
     */
    EventType[EventType["ORACLE"] = 9] = "ORACLE";
})(EventType = exports.EventType || (exports.EventType = {}));
function eventTypeToString(event) {
    switch (event) {
        case EventType.EXCHANGE:
            return "EXCHANGE";
        case EventType.EXPIRY:
            return "EXPIRY";
        case EventType.USER:
            return "USER";
        case EventType.CLOCK:
            return "CLOCK";
        case EventType.GREEKS:
            return "GREEKS";
        case EventType.TRADE:
            return "TRADE";
        case EventType.TRADEV2:
            return "TRADEV2";
        case EventType.ORDERCOMPLETE:
            return "ORDERCOMPLETE";
        case EventType.ORDERBOOK:
            return "ORDERBOOK";
        case EventType.ORACLE:
            return "ORACLE";
        default:
            throw Error("Invalid event type");
    }
}
exports.eventTypeToString = eventTypeToString;
