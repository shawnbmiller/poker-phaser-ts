import { PlayingCard, Rank, Suit } from "../models/playing-card";
import { PokerHand, PokerHandEvaluator } from "../models/poker-hand-evaluator";
import { PokerGameContext } from "./PokerGameContext";
import { InitialDrawState } from "./InitialDrawState";
import { BetState } from "./BetState";
import { payoutMap } from "./Game";

const AUTOPILOT_STRATEGY_SAMPLES = 5000;
const AUTOPILOT_BASE_STRATEGY_SAMPLES = 400;
const AUTOPILOT_REFINEMENT_MARGIN = 0.06;
const AUTOPILOT_REFINEMENT_TOP_CANDIDATES = 3;

export class Autopilot {
  private enabled: boolean = false;
  private autopilotTimer?: Phaser.Time.TimerEvent;
  private gameContext: PokerGameContext;
  private scene: Phaser.Scene;
  private heldText: Phaser.GameObjects.Text[];
  private onStateRequestCallback: () => void;

  statusText: Phaser.GameObjects.Text;
  button: Phaser.GameObjects.Rectangle;
  buttonText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    gameContext: PokerGameContext,
    heldText: Phaser.GameObjects.Text[],
    onStateRequest: () => void,
  ) {
    this.scene = scene;
    this.gameContext = gameContext;
    this.heldText = heldText;
    this.onStateRequestCallback = onStateRequest;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) {
      return;
    }

    this.enabled = enabled;
    if (!enabled) {
      this.clearAutopilotTimer();
    }

    this.updateUI();

    if (enabled) {
      this.tryAdvance(250);
    }
  }

  toggle(): void {
    this.setEnabled(!this.enabled);
  }

  advanceNow(isAdvanceLocked: boolean): void {
    if (!this.enabled) {
      return;
    }

    if (isAdvanceLocked) {
      this.tryAdvance(200);
      return;
    }

    if (this.stopIfOutOfCredits()) {
      return;
    }

    if (this.gameContext.state instanceof InitialDrawState) {
      this.applyHoldStrategy();
    }

    this.onStateRequestCallback();
  }

  tryAdvance(delayMs = 300): void {
    if (!this.enabled) {
      return;
    }

    if (this.stopIfOutOfCredits()) {
      return;
    }

    this.clearAutopilotTimer();
    this.autopilotTimer = this.scene.time.delayedCall(delayMs, () => {
      this.autopilotTimer = undefined;
      this.advanceNow(false);
    });
  }

  shutdown(): void {
    this.setEnabled(false);
    this.clearAutopilotTimer();
  }

  checkAndStopIfOutOfCredits(): void {
    this.stopIfOutOfCredits();
  }

  private clearAutopilotTimer(): void {
    if (this.autopilotTimer) {
      this.autopilotTimer.remove(false);
      this.autopilotTimer = undefined;
    }
  }

  private stopIfOutOfCredits(): boolean {
    if (
      this.enabled &&
      this.gameContext.state instanceof BetState &&
      !this.canAffordNextRound()
    ) {
      this.setEnabled(false);
      return true;
    }

    return false;
  }

  private canAffordNextRound(): boolean {
    return this.gameContext.credits >= this.gameContext.bet;
  }

  private updateUI(): void {
    if (!this.statusText || !this.button || !this.buttonText) {
      return;
    }

    this.statusText.setText(
      this.enabled ? "AUTOPILOT: ON" : "AUTOPILOT: OFF",
    );
    this.button.setFillStyle(this.enabled ? 0xaa5500 : 0x555555);
    this.buttonText.setText(this.enabled ? "STOP AUTO" : "AUTO PLAY");
  }

  private applyHoldStrategy(): void {
    if (this.gameContext.hand.length !== 5) {
      return;
    }

    const bestHoldMask = this.selectBestHoldMask(this.gameContext.hand);

    for (let i = 0; i < this.gameContext.hand.length; i++) {
      const shouldHold = (bestHoldMask & (1 << i)) !== 0;
      this.gameContext.hand[i].held = shouldHold;
      this.heldText[i].setVisible(shouldHold);
    }
  }

  private selectBestHoldMask(hand: PlayingCard[]): number {
    const remainingCards = this.getRemainingCards(hand);
    const totalSamples = Math.max(1, AUTOPILOT_STRATEGY_SAMPLES);
    const baseSamples = Math.min(
      totalSamples,
      Math.max(1, AUTOPILOT_BASE_STRATEGY_SAMPLES),
    );

    const estimates: { mask: number; expectedPayout: number }[] = [];

    for (let holdMask = 0; holdMask < 32; holdMask++) {
      const expectedPayout = this.estimateExpectedPayout(
        hand,
        remainingCards,
        holdMask,
        baseSamples,
      );
      estimates.push({ mask: holdMask, expectedPayout });
    }

    estimates.sort((a, b) => b.expectedPayout - a.expectedPayout);

    if (estimates.length === 0) {
      return 0;
    }

    const leader = estimates[0];
    const runnerUp = estimates[1];
    const gap = runnerUp
      ? leader.expectedPayout - runnerUp.expectedPayout
      : Number.POSITIVE_INFINITY;

    const shouldRefine =
      totalSamples > baseSamples &&
      Number.isFinite(gap) &&
      gap < AUTOPILOT_REFINEMENT_MARGIN;

    if (!shouldRefine) {
      return leader.mask;
    }

    const topCount = Math.min(
      AUTOPILOT_REFINEMENT_TOP_CANDIDATES,
      estimates.length,
    );
    const topCandidates = estimates.slice(0, topCount);
    const extraSamples = totalSamples - baseSamples;

    const refined = topCandidates.map((candidate) => {
      const extraExpected = this.estimateExpectedPayout(
        hand,
        remainingCards,
        candidate.mask,
        extraSamples,
      );
      const combinedExpected =
        (candidate.expectedPayout * baseSamples +
          extraExpected * extraSamples) /
        totalSamples;

      return { mask: candidate.mask, expectedPayout: combinedExpected };
    });

    refined.sort((a, b) => b.expectedPayout - a.expectedPayout);
    return refined[0].mask;
  }

  private estimateExpectedPayout(
    hand: PlayingCard[],
    remainingCards: PlayingCard[],
    holdMask: number,
    sampleCount: number,
  ): number {
    const heldIndexes: number[] = [];
    const discardIndexes: number[] = [];

    for (let i = 0; i < hand.length; i++) {
      if ((holdMask & (1 << i)) !== 0) {
        heldIndexes.push(i);
      } else {
        discardIndexes.push(i);
      }
    }

    if (sampleCount <= 0) {
      return 0;
    }

    if (discardIndexes.length === 0) {
      return this.evaluatePayoutMultiplier(hand);
    }

    let totalPayout = 0;
    for (let sample = 0; sample < sampleCount; sample++) {
      const simulatedHand = hand.map(
        (card) => new PlayingCard(card.suit, card.rank),
      );
      const draws = this.drawRandomCardsWithoutReplacement(
        remainingCards,
        discardIndexes.length,
      );

      for (let i = 0; i < discardIndexes.length; i++) {
        simulatedHand[discardIndexes[i]] = draws[i];
      }

      totalPayout += this.evaluatePayoutMultiplier(simulatedHand);
    }

    return totalPayout / sampleCount;
  }

  private evaluatePayoutMultiplier(hand: PlayingCard[]): number {
    const evaluation = new PokerHandEvaluator(hand).evaluate();
    return payoutMap.get(evaluation) ?? 0;
  }

  private drawRandomCardsWithoutReplacement(
    cards: PlayingCard[],
    drawCount: number,
  ): PlayingCard[] {
    const pool = cards.slice();
    const drawn: PlayingCard[] = [];

    for (let i = 0; i < drawCount; i++) {
      const index = Math.floor(Math.random() * pool.length);
      drawn.push(pool[index]);
      pool.splice(index, 1);
    }

    return drawn;
  }

  private getRemainingCards(hand: PlayingCard[]): PlayingCard[] {
    const deckCards: PlayingCard[] = [];

    for (const suit of [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades]) {
      for (let rank = Rank.Two; rank <= Rank.Ace; rank = (rank + 1) as Rank) {
        deckCards.push(new PlayingCard(suit, rank));
      }
    }

    return deckCards.filter(
      (deckCard) =>
        !hand.some(
          (handCard) =>
            handCard.suit === deckCard.suit && handCard.rank === deckCard.rank,
        ),
    );
  }
}
