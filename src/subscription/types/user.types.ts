export interface Game {
    id: number;
    name: string;
    description: string;
    category: string;
    gameimageUrl: string;
}

export interface GameUser {
    game: Game;
}

export interface User {
    id: number;
    username: string;
    bio: string | null;
    email: string;
    profilePictureUrl: string;
    followers: number;
    following: number;
    Subscription: any | null;
    GameUser: GameUser[];
    receivedFriendships: any[];
    sentFriendships: any[];
}