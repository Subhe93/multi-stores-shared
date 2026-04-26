"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FulfillerType = exports.FulfillmentStatus = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["PROCESSING"] = "PROCESSING";
    OrderStatus["MANUFACTURING"] = "MANUFACTURING";
    OrderStatus["QUALITY_CHECK"] = "QUALITY_CHECK";
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUNDED"] = "REFUNDED";
    OrderStatus["RETURNED"] = "RETURNED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var FulfillmentStatus;
(function (FulfillmentStatus) {
    FulfillmentStatus["PENDING"] = "PENDING";
    FulfillmentStatus["PROCESSING"] = "PROCESSING";
    FulfillmentStatus["MANUFACTURING"] = "MANUFACTURING";
    FulfillmentStatus["SHIPPED"] = "SHIPPED";
    FulfillmentStatus["DELIVERED"] = "DELIVERED";
})(FulfillmentStatus || (exports.FulfillmentStatus = FulfillmentStatus = {}));
var FulfillerType;
(function (FulfillerType) {
    FulfillerType["PROVIDER"] = "PROVIDER";
    FulfillerType["CREATOR"] = "CREATOR";
})(FulfillerType || (exports.FulfillerType = FulfillerType = {}));
//# sourceMappingURL=order-status.js.map