import * as moment from 'moment';

type User = {
    id: number;
    username: string;
    email: string;
    profilePictureUrl: string;
    createdAt: Date;
}

export class ResponseLoginDto {
    id: number;
    username: string;
    email: string;
    profilePictureUrl: string;
    createdAt: string;

    constructor(user: User) {
        Object.assign(this, user);

        this.createdAt = this.formatCreatedAt(user.createdAt);
    }

    private formatCreatedAt(date: Date) {
        return moment(date).format('YYYY-MM-DD HH:mm:ss');
    }
}
