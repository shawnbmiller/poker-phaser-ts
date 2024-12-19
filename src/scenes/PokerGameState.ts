import { PokerGameContext } from "./PokerGameContext";

export abstract class PokerGameState {
    protected context: PokerGameContext;
    constructor(context: PokerGameContext) {
        this.context = context;
    }
    abstract next(): PokerGameState;
    canTransitionNext(): boolean {
        return true;
    }
    onEnter(): void { }
    onExit(): void { }
    abstract increaseBet(): void;
    abstract decreaseBet(): void;
    abstract betMax(): void;
    abstract holdOne(): void;
    abstract holdTwo(): void;
    abstract holdThree(): void;
    abstract holdFour(): void;
    abstract holdFive(): void;
}
