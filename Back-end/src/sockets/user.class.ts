export enum UserStatus {
    ONLINE,
    PLAYING
}

export class User {
    id: string
    ft_id: string
    login: string
    side: string
    currentChannel: string = "";
    currentDMChannel: string = "";
    status: UserStatus = UserStatus.ONLINE 

    constructor(id: string, ft_id: string, login: string, side: string) {
        this.id = id;
        this.ft_id = ft_id;
        this.login = login;
        this.side = side;
    }
}