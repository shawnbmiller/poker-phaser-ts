import { PokerHandEvaluator, PokerHand } from './poker-hand-evaluator';
import { PlayingCard, Suit, Rank } from './playing-card';

describe('PokerHandEvaluator', () => {
    it('should evaluate a Royal Flush', () => {
        const hand = [
            new PlayingCard(Suit.Hearts, Rank.Ten),
            new PlayingCard(Suit.Hearts, Rank.Jack),
            new PlayingCard(Suit.Hearts, Rank.Queen),
            new PlayingCard(Suit.Hearts, Rank.King),
            new PlayingCard(Suit.Hearts, Rank.Ace),
        ];
        const evaluator = new PokerHandEvaluator(hand);
        expect(evaluator.evaluate()).toBe(PokerHand.RoyalFlush);
    });

    it('should evaluate a Straight Flush', () => {
        const hand = [
            new PlayingCard(Suit.Hearts, Rank.Nine),
            new PlayingCard(Suit.Hearts, Rank.Ten),
            new PlayingCard(Suit.Hearts, Rank.Jack),
            new PlayingCard(Suit.Hearts, Rank.Queen),
            new PlayingCard(Suit.Hearts, Rank.King),
        ];
        const evaluator = new PokerHandEvaluator(hand);
        expect(evaluator.evaluate()).toBe(PokerHand.StraightFlush);
    });

    it('should evaluate Four of a Kind', () => {
        const hand = [
            new PlayingCard(Suit.Hearts, Rank.Nine),
            new PlayingCard(Suit.Clubs, Rank.Nine),
            new PlayingCard(Suit.Diamonds, Rank.Nine),
            new PlayingCard(Suit.Spades, Rank.Nine),
            new PlayingCard(Suit.Hearts, Rank.King),
        ];
        const evaluator = new PokerHandEvaluator(hand);
        expect(evaluator.evaluate()).toBe(PokerHand.FourOfAKind);
    });

    it('should evaluate a Full House', () => {
        const hand = [
            new PlayingCard(Suit.Hearts, Rank.Nine),
            new PlayingCard(Suit.Clubs, Rank.Nine),
            new PlayingCard(Suit.Diamonds, Rank.Nine),
            new PlayingCard(Suit.Spades, Rank.King),
            new PlayingCard(Suit.Hearts, Rank.King),
        ];
        const evaluator = new PokerHandEvaluator(hand);
        expect(evaluator.evaluate()).toBe(PokerHand.FullHouse);
    });

    it('should evaluate a Flush', () => {
        const hand = [
            new PlayingCard(Suit.Hearts, Rank.Two),
            new PlayingCard(Suit.Hearts, Rank.Four),
            new PlayingCard(Suit.Hearts, Rank.Six),
            new PlayingCard(Suit.Hearts, Rank.Eight),
            new PlayingCard(Suit.Hearts, Rank.Ten),
        ];
        const evaluator = new PokerHandEvaluator(hand);
        expect(evaluator.evaluate()).toBe(PokerHand.Flush);
    });

    it('should evaluate a Straight', () => {
        const hand = [
            new PlayingCard(Suit.Hearts, Rank.Two),
            new PlayingCard(Suit.Clubs, Rank.Three),
            new PlayingCard(Suit.Diamonds, Rank.Four),
            new PlayingCard(Suit.Spades, Rank.Five),
            new PlayingCard(Suit.Hearts, Rank.Six),
        ];
        const evaluator = new PokerHandEvaluator(hand);
        expect(evaluator.evaluate()).toBe(PokerHand.Straight);
    });

    it('should evaluate Three of a Kind', () => {
        const hand = [
            new PlayingCard(Suit.Hearts, Rank.Nine),
            new PlayingCard(Suit.Clubs, Rank.Nine),
            new PlayingCard(Suit.Diamonds, Rank.Nine),
            new PlayingCard(Suit.Spades, Rank.Queen),
            new PlayingCard(Suit.Hearts, Rank.King),
        ];
        const evaluator = new PokerHandEvaluator(hand);
        expect(evaluator.evaluate()).toBe(PokerHand.ThreeOfAKind);
    });

    it('should evaluate Two Pair', () => {
        const hand = [
            new PlayingCard(Suit.Hearts, Rank.Nine),
            new PlayingCard(Suit.Clubs, Rank.Nine),
            new PlayingCard(Suit.Diamonds, Rank.King),
            new PlayingCard(Suit.Spades, Rank.King),
            new PlayingCard(Suit.Hearts, Rank.Queen),
        ];
        const evaluator = new PokerHandEvaluator(hand);
        expect(evaluator.evaluate()).toBe(PokerHand.TwoPair);
    });

    it('should evaluate Jacks or Better', () => {
        const hand = [
            new PlayingCard(Suit.Hearts, Rank.Jack),
            new PlayingCard(Suit.Clubs, Rank.Jack),
            new PlayingCard(Suit.Diamonds, Rank.Two),
            new PlayingCard(Suit.Spades, Rank.Three),
            new PlayingCard(Suit.Hearts, Rank.Four),
        ];
        const evaluator = new PokerHandEvaluator(hand);
        expect(evaluator.evaluate()).toBe(PokerHand.JacksOrBetter);
    });

    it('should evaluate Nothing', () => {
        const hand = [
            new PlayingCard(Suit.Hearts, Rank.Two),
            new PlayingCard(Suit.Clubs, Rank.Four),
            new PlayingCard(Suit.Diamonds, Rank.Six),
            new PlayingCard(Suit.Spades, Rank.Eight),
            new PlayingCard(Suit.Hearts, Rank.Ten),
        ];
        const evaluator = new PokerHandEvaluator(hand);
        expect(evaluator.evaluate()).toBe(PokerHand.Nothing);
    });
});