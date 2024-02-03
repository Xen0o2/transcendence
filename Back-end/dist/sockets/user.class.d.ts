export declare enum UserStatus {
    ONLINE = 0,
    PLAYING = 1
}
export declare class User {
    id: string;
    ft_id: string;
    login: string;
    side: string;
    currentChannel: string;
    currentDMChannel: string;
    status: UserStatus;
    constructor(id: string, ft_id: string, login: string, side: string);
}
