export enum Suit {
    Hearts,
    Diamonds,
    Clubs,
    Spades
}

export enum Rank {
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    Jack,
    Queen,
    King,
    Ace
}

export class PlayingCard {
    held: boolean;
    constructor(public suit: Suit, public rank: Rank) {}

    toString(): string {
        return `${this.rank} of ${this.suit}`;
    }
}