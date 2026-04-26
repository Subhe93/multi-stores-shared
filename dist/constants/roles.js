"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["PROVIDER"] = "PROVIDER";
    UserRole["CREATOR"] = "CREATOR";
    UserRole["CUSTOMER"] = "CUSTOMER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "PENDING";
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["BANNED"] = "BANNED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
//# sourceMappingURL=roles.js.map