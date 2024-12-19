import { PokerHandEvaluator } from "../models/poker-hand-evaluator";
import { BetState } from "./BetState";
import { payoutMap } from "./Game";
import { PokerGameState } from "./PokerGameState";




export class RedrawState extends PokerGameState {
    onEnter(): void {
        // deal new cards for each card that is not held
        for (let i = 0; i < 5; i++) {
            if (!this.context.hand[i].held) {
                this.context.hand[i] = this.context.deck.deal();
            }
        }

        this.context.onRedraw();
    }
    increaseBet(): void {
        // do nothing
    }
    decreaseBet(): void {
        // do nothing
    }
    betMax(): void {
        // do nothing
    }
    holdOne(): void {
        // do nothing
    }
    holdTwo(): void {
        // do nothing
    }
    holdThree(): void {
        // do nothing
    }
    holdFour(): void {
        // do nothing
    }
    holdFive(): void {
        // do nothing
    }
    next(): PokerGameState {
        return new BetState(this.context);
    }
}
