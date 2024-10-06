import { PlayingCard, Rank } from "./playing-card";

// enum for the winning hands in Jacks or Better Poker
export enum PokerHand {
  RoyalFlush = 'Royal Flush',
  StraightFlush = 'Straight Flush',
  FourOfAKind = 'Four of a Kind',
  FullHouse = 'Full House',
  Flush = 'Flush',
  Straight = 'Straight',
  ThreeOfAKind = 'Three of a Kind',
  TwoPair = 'Two Pair',
  JacksOrBetter = 'Jacks or Better',
  Nothing = 'Nothing',
}

// class to evaluate
export class PokerHandEvaluator {
  private hand: PlayingCard[];

  constructor(hand: PlayingCard[]) {
    this.hand = hand.sort((a, b) => a.rank - b.rank);
  }

  evaluate(): PokerHand {
    if (this.isRoyalFlush()) {
      return PokerHand.RoyalFlush;
    }
    if (this.isStraightFlush()) {
      return PokerHand.StraightFlush;
    }
    if (this.isFourOfAKind()) {
      return PokerHand.FourOfAKind;
    }
    if (this.isFullHouse()) {
      return PokerHand.FullHouse;
    }
    if (this.isFlush()) {
      return PokerHand.Flush;
    }
    if (this.isStraight()) {
      return PokerHand.Straight;
    }
    if (this.isThreeOfAKind()) {
      return PokerHand.ThreeOfAKind;
    }
    if (this.isTwoPair()) {
      return PokerHand.TwoPair;
    }
    if (this.isJacksOrBetter()) {
      return PokerHand.JacksOrBetter;
    }
    return PokerHand.Nothing;
  }

  private isRoyalFlush(): boolean {
    if (!this.isFlush()) {
      return false;
    }

    const royalFlushRanks = [Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];
    // check if each royal flush rank is in the hand
    return royalFlushRanks.every(rank => this.hand.some(card => card.rank === rank));
  }

  private isStraightFlush(): boolean {
    return this.isFlush() && this.isStraight();
  }

  private isFourOfAKind(): boolean {
    return this.hand[0].rank === this.hand[3].rank || this.hand[1].rank === this.hand[4].rank;
  }

  private isFullHouse(): boolean {
    return (this.hand[0].rank === this.hand[2].rank && this.hand[3].rank === this.hand[4].rank) ||
      (this.hand[0].rank === this.hand[1].rank && this.hand[2].rank === this.hand[4].rank);
  }

  private isFlush(): boolean {
    return this.hand.every(card => card.suit === this.hand[0].suit);
  }

  private isStraight(): boolean {

    // ace can be low in a straight
    if (this.hand[0].rank === Rank.Two && this.hand[4].rank === Rank.Ace) {
      return this.hand[1].rank === Rank.Three && this.hand[2].rank === Rank.Four &&
        this.hand[3].rank === Rank.Five;
    }

    // check if each card is one rank higher than the previous card
    return this.hand.every((card, index) => index === 0 || card.rank === this.hand[index - 1].rank + 1);
  }

  private isThreeOfAKind(): boolean {
    return this.hand[0].rank === this.hand[2].rank || this.hand[1].rank === this.hand[3].rank ||
      this.hand[2].rank === this.hand[4].rank;
  }

    private isTwoPair(): boolean {
        return (this.hand[0].rank === this.hand[1].rank && this.hand[2].rank === this.hand[3].rank) ||
        (this.hand[0].rank === this.hand[1].rank && this.hand[3].rank === this.hand[4].rank) ||
        (this.hand[1].rank === this.hand[2].rank && this.hand[3].rank === this.hand[4].rank);
    }

    private isJacksOrBetter(): boolean {
        const highRanks = [Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];
        return this.hand.some((card, index) => 
            highRanks.includes(card.rank) && 
            (index < this.hand.length - 1 && card.rank === this.hand[index + 1].rank)
        );
    }
}