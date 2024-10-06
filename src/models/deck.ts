import { PlayingCard, Suit, Rank } from "./playing-card";

export class Deck {
    private cards: PlayingCard[] = [];

    constructor() {
        for (const suit in Suit) {
            if (isNaN(Number(suit))) {
                for (const rank in Rank) {
                    if (isNaN(Number(rank))) {
                        this.cards.push(new PlayingCard(Suit[suit as keyof typeof Suit], Rank[rank as keyof typeof Rank]));
                    }
                }
            }
        }
    }

    shuffle(): void {
        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(): PlayingCard {
        const card = this.cards.pop();
        if (!card) {
            throw new Error("No cards left in the deck");
        }
        return card;
    }
}