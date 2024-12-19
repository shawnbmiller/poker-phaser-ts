import { Deck } from "../models/deck";
import { InitialDrawState } from "./InitialDrawState";
import { PokerGameState } from "./PokerGameState";
import { PokerGameContext } from "./PokerGameContext";

export class BetState extends PokerGameState {
    onEnter(): void {
        this.context.deck = new Deck();
        this.context.deck.shuffle();
        this.context.hand = [];
    }
    onExit(): void {
        this.context.credits -= this.context.bet;
    }
    increaseBet(): void {
        this.context.bet += 1;
    }
    decreaseBet(): void {
        this.context.bet -= 1;
    }
    betMax(): void {
        this.context.bet = PokerGameContext.MAX_BET;
    }
    holdOne(): void { }
    holdTwo(): void { }
    holdThree(): void { }
    holdFour(): void { }
    holdFive(): void { }
    next(): PokerGameState {
        if (this.canTransitionNext()) {
            return new InitialDrawState(this.context);
        }

        return this;
    }
    canTransitionNext(): boolean {
        return this.context.credits >= this.context.bet;
    }
}
