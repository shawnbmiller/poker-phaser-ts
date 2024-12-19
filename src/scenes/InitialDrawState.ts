import { RedrawState } from "./RedrawState";
import { PokerGameState } from "./PokerGameState";

export class InitialDrawState extends PokerGameState {
    onEnter(): void {
        for (let i = 0; i < 5; i++) {
            this.context.hand[i] = this.context.deck.deal();
        }
        
        this.context.onDraw();
    }
    increaseBet(): void { }
    decreaseBet(): void { }
    betMax(): void { }

    holdOne(): void {
        this.context.hand[0].held = !this.context.hand[0].held;
        this.context.onHoldToggled(0);
    }
    holdTwo(): void {
        this.context.hand[1].held = !this.context.hand[1].held;
        this.context.onHoldToggled(1);
    }
    holdThree(): void {
        this.context.hand[2].held = !this.context.hand[2].held;
        this.context.onHoldToggled(2);
    }
    holdFour(): void {
        this.context.hand[3].held = !this.context.hand[3].held;
        this.context.onHoldToggled(3);
    }
    holdFive(): void {
        this.context.hand[4].held = !this.context.hand[4].held;
        this.context.onHoldToggled(4);
    }
    next(): PokerGameState {
        return new RedrawState(this.context);
    }
}
