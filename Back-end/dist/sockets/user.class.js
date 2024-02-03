"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserStatus = void 0;
var UserStatus;
(function (UserStatus) {
    UserStatus[UserStatus["ONLINE"] = 0] = "ONLINE";
    UserStatus[UserStatus["PLAYING"] = 1] = "PLAYING";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
class User {
    constructor(id, ft_id, login, side) {
        this.currentChannel = "";
        this.currentDMChannel = "";
        this.status = UserStatus.ONLINE;
        this.id = id;
        this.ft_id = ft_id;
        this.login = login;
        this.side = side;
    }
}
exports.User = User;
//# sourceMappingURL=user.class.js.map