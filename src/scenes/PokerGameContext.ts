import { EventEmitter } from 'events';
import { Deck } from '../models/deck';
import { PlayingCard } from '../models/playing-card';
import { BetState } from './BetState';
import { PokerGameState } from './PokerGameState';
import { PokerHandEvaluator } from '../models/poker-hand-evaluator';

export class PokerGameContext extends EventEmitter {
    static readonly MAX_BET = 100;
    deck: Deck;
    hand: PlayingCard[] = [];
    private _credits: number;
    public get credits(): number {
        return this._credits;
    }
    public set credits(value: number) {
        if (value < 0) {
            value = 0;
        }
        if (this._credits === value) {
            return;
        }
        this._credits = value;
        this.emit('creditsChanged');
    }
    private _bet: number = 1;
    evaluation: any;
    public get bet(): number {
        return this._bet;
    }
    public set bet(value: number) {
        if (value > PokerGameContext.MAX_BET) {
            this._bet = PokerGameContext.MAX_BET;
        } else if (value < 1) {
            this._bet = 1;
        } else {
            if (this._bet !== value) {
            this._bet = value;
            this.emit('betChanged');
            }
        }
    }

    constructor() {
        super();
        this.state = new BetState(this);
        this.credits = 100;
    }

    private _state: PokerGameState;
    public get state(): PokerGameState {
        return this._state;
    }
    public set state(v: PokerGameState) {
        // if v is the same as the current state, do nothing
        if (this._state === v) {
            return;
        }
        // call onExit on the current state
        if (this._state) this._state.onExit();
        // set the new state
        this._state = v;
        console.log("state changed to", this._state.constructor.name);
        // call onEnter on the new state
        if(this._state) this._state.onEnter();
    }

    public next() {
        this.state = this.state.next();
    }

    public onIncreaseBet() {
        this.state.increaseBet();
    }

    public onDecreaseBet() {
        this.state.decreaseBet();
    }

    public onBetMax() {
        this.state.betMax();
    }

    public onHoldOne() {
        this.state.holdOne();
    }

    public onHoldTwo() {
        this.state.holdTwo();
    }

    public onHoldThree() {
        this.state.holdThree();
    }

    public onHoldFour() {
        this.state.holdFour();
    }

    public onHoldFive() {
        this.state.holdFive();
    }

    public onDraw() {
        // evaluate the hand
        const evaluator = new PokerHandEvaluator(this.hand);
        this.evaluation = evaluator.evaluate();
        this.emit('draw');
    }

    public onRedraw() {
        // evaluate the hand
        const evaluator = new PokerHandEvaluator(this.hand);
        this.evaluation = evaluator.evaluate();
        // notify the view to redraw
        this.emit('redraw');

        // check if the player won
        if (this.evaluation !== 'Nothing') {
            this.credits += this.bet * this.payout(this.evaluation);
        }
        
    }
    payout(evaluation: any): number {
        // Implement the payout logic based on the evaluation
        switch (evaluation) {
            case 'Royal Flush':
                return 250;
            case 'Straight Flush':
                return 50;
            case 'Four of a Kind':
                return 25;
            case 'Full House':
                return 9;
            case 'Flush':
                return 6;
            case 'Straight':
                return 4;
            case 'Three of a Kind':
                return 3;
            case 'Two Pair':
                return 2;
            case 'Jacks or Better':
                return 1;
            default:
                return 0;
        }
    }

    // function to notify hold was toggled
    public onHoldToggled(index: number) {
        this.emit('holdToggled', index);
    }
}
