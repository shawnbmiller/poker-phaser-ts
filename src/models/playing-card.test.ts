import { describe, it, expect } from 'vitest';
import { PlayingCard, Suit, Rank } from './playing-card';

describe('PlayingCard', () => {
    it('stores suit and rank from constructor', () => {
        const card = new PlayingCard(Suit.Spades, Rank.Ace);

        expect(card.suit).toBe(Suit.Spades);
        expect(card.rank).toBe(Rank.Ace);
    });

    it('formats card as rank and suit values', () => {
        const card = new PlayingCard(Suit.Hearts, Rank.Ten);

        expect(card.toString()).toBe(`${Rank.Ten} of ${Suit.Hearts}`);
    });
});
