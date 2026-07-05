import { describe, it, expect, vi, afterEach } from 'vitest';
import { Deck } from './deck';

const cardId = (card: { suit: number; rank: number }): string => `${card.suit}-${card.rank}`;

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Deck', () => {
    it('contains 52 unique cards', () => {
        const deck = new Deck();
        const cards: string[] = [];

        for (let i = 0; i < 52; i++) {
            cards.push(cardId(deck.deal()));
        }

        expect(new Set(cards).size).toBe(52);
    });

    it('throws after all cards are dealt', () => {
        const deck = new Deck();

        for (let i = 0; i < 52; i++) {
            deck.deal();
        }

        expect(() => deck.deal()).toThrow('No cards left in the deck');
    });

    it('shuffle preserves all cards', () => {
        const orderedDeck = new Deck();
        const shuffledDeck = new Deck();
        shuffledDeck.shuffle();

        const ordered = Array.from({ length: 52 }, () => cardId(orderedDeck.deal())).sort();
        const shuffled = Array.from({ length: 52 }, () => cardId(shuffledDeck.deal())).sort();

        expect(shuffled).toEqual(ordered);
    });

    it('shuffle can change card order', () => {
        const orderedDeck = new Deck();
        const shuffledDeck = new Deck();

        vi.spyOn(Math, 'random').mockReturnValue(0);
        shuffledDeck.shuffle();

        const ordered = Array.from({ length: 52 }, () => cardId(orderedDeck.deal()));
        const shuffled = Array.from({ length: 52 }, () => cardId(shuffledDeck.deal()));

        expect(shuffled).not.toEqual(ordered);
    });
});
