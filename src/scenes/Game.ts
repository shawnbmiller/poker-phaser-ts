import { Scene } from "phaser";
import WebFont from "webfontloader";
import { PlayingCard, Rank, Suit } from "../models/playing-card";
import { PokerHand, PokerHandEvaluator } from "../models/poker-hand-evaluator";
import { PokerGameContext } from "./PokerGameContext";
import { BetState } from "./BetState";
import { InitialDrawState } from "./InitialDrawState";
import { Autopilot } from "./Autopilot";

const cardWidth = 190;
const cardHeight = (cardWidth / 2.5) * 3.5;
const cardSpacing = 10;
const startX = 512 - (cardWidth + cardSpacing) * 2;
const startY = 384 + cardHeight / 2 + cardSpacing;

// map poker hand to payout
export const payoutMap = new Map<PokerHand, number>([
  [PokerHand.RoyalFlush, 250],
  [PokerHand.StraightFlush, 50],
  [PokerHand.FourOfAKind, 25],
  [PokerHand.FullHouse, 6],
  [PokerHand.Flush, 5],
  [PokerHand.Straight, 4],
  [PokerHand.ThreeOfAKind, 3],
  [PokerHand.TwoPair, 2],
  [PokerHand.JacksOrBetter, 1],
]);

// map poker hand to display text
const handTextMap = new Map<PokerHand, string>([
  [PokerHand.RoyalFlush, "Royal Flush"],
  [PokerHand.StraightFlush, "Str Flush"],
  [PokerHand.FourOfAKind, "4 of a Kind"],
  [PokerHand.FullHouse, "Full House"],
  [PokerHand.Flush, "Flush"],
  [PokerHand.Straight, "Straight"],
  [PokerHand.ThreeOfAKind, "3 of a Kind"],
  [PokerHand.TwoPair, "2 Pair"],
  [PokerHand.JacksOrBetter, "Jacks or Better"],
]);

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  msg_text: Phaser.GameObjects.Text;
  suit: string[];
  values: string[];
  fileNames: string[];
  card: Phaser.GameObjects.Image[] = [];
  heldText: Phaser.GameObjects.Text[] = [];
  fontReady: boolean;
  handText: Phaser.GameObjects.Text;
  creditsText: Phaser.GameObjects.Text;
  gameOver: import("phaser").GameObjects.Text;
  gameContext: PokerGameContext;
  betText: import("phaser").GameObjects.Text;
  payoutValueTexts: Map<PokerHand, Phaser.GameObjects.Text>;
  roundToken: number;
  gameOverTimer?: Phaser.Time.TimerEvent;
  isAdvanceLocked: boolean;
  winnerPaidText: Phaser.GameObjects.Text;
  winnerPaidTimer?: Phaser.Time.TimerEvent;
  autopilot: Autopilot;

  constructor() {
    super("Game");
    this.suit = ["hearts", "diamonds", "clubs", "spades"];
    this.values = [
      "ace",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "jack",
      "queen",
      "king",
    ];
    this.fileNames = this.suit
      .map((s) => this.values.map((v) => `${s}_${v}`))
      .flat();
    this.gameContext = new PokerGameContext();
    this.payoutValueTexts = new Map<PokerHand, Phaser.GameObjects.Text>();
    this.roundToken = 0;
    this.isAdvanceLocked = false;
  }

  private clearPendingGameOverTimer() {
    if (this.gameOverTimer) {
      this.gameOverTimer.remove(false);
      this.gameOverTimer = undefined;
    }
  }

  private clearWinnerPaidTimer() {
    if (this.winnerPaidTimer) {
      this.winnerPaidTimer.remove(false);
      this.winnerPaidTimer = undefined;
    }
  }

  private hideWinnerPaidText() {
    this.clearWinnerPaidTimer();
    if (this.winnerPaidText) {
      this.winnerPaidText.setVisible(false);
    }
  }

  private showWinnerPaidText(totalPayout: number, redrawToken: number) {
    if (totalPayout <= 0) {
      this.hideWinnerPaidText();
      return;
    }

    this.clearWinnerPaidTimer();

    let paid = 0;
    this.winnerPaidText.setText("winner\npaid 0").setVisible(true);

    const delay = Math.max(1, Math.floor(2000 / totalPayout));
    this.winnerPaidTimer = this.time.addEvent({
      delay,
      repeat: totalPayout - 1,
      callback: () => {
        if (redrawToken !== this.roundToken) {
          this.hideWinnerPaidText();
          return;
        }

        paid += 1;
        this.winnerPaidText.setText(`winner\npaid ${paid}`);
      },
    });
  }

  private canAffordNextRound(): boolean {
    return this.gameContext.credits >= this.gameContext.bet;
  }

  private requestNextState() {
    if (this.isAdvanceLocked) {
      return;
    }

    this.gameContext.next();
  }

  init() {
    const element = document.createElement("style");

    document.head.appendChild(element);

    const sheet = element.sheet;

    let styles =
      '@font-face { font-family: "upheaval"; src: url("assets/upheaval/upheavtt.ttf") format("truetype"); }\n';

    if (sheet) {
      sheet.insertRule(styles, 0);
    }
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x2222ff);

    WebFont.load({
      custom: {
        families: ["upheaval"],
      },
      active: () => {
        this.setupGameInterface();
      },
    });
  }

  private setupGameInterface() {
    this.add
      .text(512, 70, "BONUS POKER", {
        fontFamily: "upheaval",
        fontSize: "32pt",
        color: "#ffffff",
        shadow: {
          color: "#333333",
          offsetX: 2,
          offsetY: 2,
          blur: 0,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(0.5);
    this.displayFaceDownCards();
    this.setupHeldText();
    this.setupGameOverText();
    this.setupPayoutBoxes();
    this.setupCreditsAndBet();

    // Create autopilot instance before setupDrawButton
    this.autopilot = new Autopilot(
      this,
      this.gameContext,
      this.heldText,
      this.requestNextState.bind(this),
    );

    this.setupDrawButton();
    this.setupWinnerPaidText();
    this.handText = this.add
      .text(0, 0, "", {
        fontFamily: "upheaval",
        fontSize: "24pt",
        color: "#ffffff",
        shadow: {
          color: "#333333",
          offsetX: 2,
          offsetY: 2,
          blur: 0,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(0.5);
    this.setupKeyboardInput();

    (this.gameContext as any).on("betChanged", this.displayBet.bind(this));
    (this.gameContext as any).on(
      "creditsChanged",
      this.displayCredits.bind(this),
    );
    (this.gameContext as any).on("draw", this.displayDraw.bind(this));
    (this.gameContext as any).on("redraw", this.displayRedraw.bind(this));
    (this.gameContext as any).on("holdToggled", this.toggleHold.bind(this));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.autopilot.shutdown();
      this.clearPendingGameOverTimer();
      this.hideWinnerPaidText();
    });
  }

  private displayRedraw() {
    const redrawToken = this.roundToken;
    const creditsBeforePayout = this.gameContext.credits;
    this.isAdvanceLocked = true;
    let maxRedrawDelay = 0;
    for (let i = 0; i < 5; i++) {
      // get a count of cards that are not held
      if (!this.gameContext.hand[i].held) {
        //set card to card back
        this.card[i].setTexture("back");
        const redrawDelay = i * 200;
        maxRedrawDelay = Math.max(maxRedrawDelay, redrawDelay);
        this.time.delayedCall(redrawDelay, () => {
          this.sound.play("wood");
          this.card[i].setTexture(
            this.getCardTexture(this.gameContext.hand[i]),
          );
        });
      }
    }

    // evaluate the hand after all redraws
    this.time.delayedCall(maxRedrawDelay, () => {
      if (redrawToken !== this.roundToken) {
        return;
      }

      // clear hold status
      this.gameContext.hand.forEach((card) => (card.held = false));
      this.heldText.forEach((held) => held.setVisible(false));

      const evaluation = this.gameContext.evaluation;
      this.handText.setText(`${evaluation}`);
      Phaser.Display.Align.In.Center(
        this.handText,
        this.heldText[2],
        0,
        -this.handText.height,
      );
      this.handText.setVisible(true);

      const payout = Math.max(
        0,
        this.gameContext.credits - creditsBeforePayout,
      );
      this.showWinnerPaidText(payout, redrawToken);

      // Move into Bet state when the hand is fully resolved so bet controls are active
      // before the next draw press.
      if (!(this.gameContext.state instanceof BetState)) {
        this.gameContext.next();
      }

      this.isAdvanceLocked = false;
      this.autopilot.tryAdvance(350);

      // after 1.5 seconds, game over text should be displayed
      this.clearPendingGameOverTimer();
      this.gameOverTimer = this.time.delayedCall(1500, () => {
        if (redrawToken !== this.roundToken) {
          return;
        }
        this.gameOver.setVisible(true);
        this.gameOverTimer = undefined;
      });
    });
  }

  private displayDraw() {
    this.roundToken += 1;
    const drawToken = this.roundToken;
    this.isAdvanceLocked = true;

    this.clearPendingGameOverTimer();
    // clear held text
    this.heldText.forEach((held) => held.setVisible(false));
    // clear hand text
    this.handText.setVisible(false);
    // clear game over text
    this.gameOver.setVisible(false);
    // clear winner text
    this.hideWinnerPaidText();
    // set all cards to face down
    this.displayFaceDownCards();
    // display each card in the hand
    for (let i = 0; i < 5; i++) {
      // wait 200ms before displaying the next card
      this.time.delayedCall(i * 220, () => {
        this.sound.play("wood");
        this.card[i].setTexture(this.getCardTexture(this.gameContext.hand[i]));
      });
    }

    // after all cards are displayed, evaluate the hand
    this.time.delayedCall(5 * 220, () => {
      if (drawToken !== this.roundToken) {
        return;
      }

      const evaluation = this.gameContext.evaluation;
      this.handText.setText(`${evaluation}`);
      this.handText.setVisible(true);
      Phaser.Display.Align.In.Center(
        this.handText,
        this.heldText[2],
        0,
        -this.handText.height,
      );
      this.isAdvanceLocked = false;
      console.log("initial hand", ...this.gameContext.hand);
      this.autopilot.advanceNow(this.isAdvanceLocked);
    });
  }

  private displayBet() {
    this.betText.setText(this.gameContext.bet.toString());
    this.updatePayoutValues();
    this.sound.play("blip");
  }

  private updatePayoutValues() {
    for (const [hand, basePayout] of payoutMap.entries()) {
      const payoutText = this.payoutValueTexts.get(hand);
      if (payoutText) {
        payoutText.setText((basePayout * this.gameContext.bet).toString());
      }
    }
  }

  private setupGameOverText() {
    // create GAME OVER text over the cards. should be a blue rectangle with red text outlined in yellow
    this.gameOver = this.add
      .text(512, 0, "GAME OVER", {
        fontFamily: "upheaval",
        fontSize: "64pt",
        color: "#ff0000",
        stroke: "#ffff00",
        strokeThickness: 5,
        backgroundColor: "#2222ff",
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setVisible(false);
    // align game over text to vertical center of cards
    Phaser.Display.Align.In.Center(this.gameOver, this.card[2]);
  }

  private setupHeldText() {
    this.heldText = [];
    for (let i = 0; i < 5; i++) {
      this.heldText[i] = this.add
        .text(0, 0, "HELD", {
          fontFamily: "upheaval",
          fontSize: "24pt",
          color: "#ffffff",
          shadow: {
            color: "#333333",
            offsetX: 2,
            offsetY: 2,
            blur: 0,
            fill: true,
            stroke: false,
          },
        })
        .setOrigin(0.5);
      Phaser.Display.Align.In.TopCenter(this.heldText[i], this.card[i], 0, 0);
      this.heldText[i].setVisible(false);
    }
  }

  private setupPayoutBoxes() {
    const createPayoutBox = (x: number, y: number) => {
      const outer = this.add.rectangle(x, y, (1024 - 60) / 2, 200, 0xffff00);
      const inner = this.add.rectangle(
        0,
        0,
        outer.width * 0.66,
        outer.height - 4,
        0x0000aa,
      );
      Phaser.Display.Align.In.LeftCenter(inner, outer, -2, 0);
      const valuesBox = this.add.rectangle(
        0,
        0,
        outer.width * 0.33,
        outer.height - 4,
        0xaa0000,
      );
      Phaser.Display.Align.In.RightCenter(valuesBox, outer, -2, 0);
      return { outer, inner, valuesBox };
    };

    const payoutBox1 = createPayoutBox(512 - 20 - (1024 - 60) / 4, 200);
    const payoutBox2 = createPayoutBox(512 + 20 + (1024 - 60) / 4, 200);

    const style2: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "upheaval",
      fontSize: "24pt",
      color: "#ffff66",
      shadow: {
        color: "#000000",
        offsetX: 1,
        offsetY: 1,
        blur: 0,
        fill: true,
        stroke: false,
      },
    };
    let y = 0;
    for (const [key, value] of payoutMap.entries()) {
      const box = y > 5 ? payoutBox2 : payoutBox1;
      this.add
        .text(0, y, `${handTextMap.get(key)}`, style2)
        .setOrigin(0, 0)
        .setPosition(
          box.inner.x - box.inner.width / 2 + 5,
          box.inner.y - box.inner.height / 2 + (y % 6) * 30,
        );
      const payoutText = this.add
        .text(0, y, `${value}`, style2)
        .setOrigin(1, 0)
        .setPosition(
          box.valuesBox.x + box.valuesBox.width / 2 - 5,
          box.valuesBox.y - box.valuesBox.height / 2 + (y % 6) * 30,
        );
      this.payoutValueTexts.set(key, payoutText);
      y++;
    }

    this.updatePayoutValues();
  }

  private setupCreditsAndBet() {
    this.add
      .text(1024 - 10, 768 - 50, "CREDITS", {
        fontFamily: "upheaval",
        fontSize: "24pt",
        color: "#ffffff",
        shadow: {
          color: "#333333",
          offsetX: 2,
          offsetY: 2,
          blur: 0,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(1, 1);
    this.creditsText = this.add
      .text(1024 - 10, 768 - 20, this.gameContext.credits.toString(), {
        fontFamily: "upheaval",
        fontSize: "24pt",
        color: "#ffffff",
        shadow: {
          color: "#333333",
          offsetX: 2,
          offsetY: 2,
          blur: 0,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(1, 1);

    const betLabel = this.add
      .text(0, 0, "BET", {
        fontFamily: "upheaval",
        fontSize: "24pt",
        color: "#ffffff",
        shadow: {
          color: "#333333",
          offsetX: 2,
          offsetY: 2,
          blur: 0,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(1, 1);
    Phaser.Display.Align.In.TopRight(
      betLabel,
      this.card[4],
      -15,
      betLabel.height + 5,
    );
    this.betText = this.add
      .text(0, 0, this.gameContext.bet.toString(), {
        fontFamily: "upheaval",
        fontSize: "24pt",
        color: "#ffffff",
        shadow: {
          color: "#333333",
          offsetX: 2,
          offsetY: 2,
          blur: 0,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(1, 1);
    Phaser.Display.Align.In.TopRight(this.betText, this.card[4], -15, 0);
  }

  private setupDrawButton() {
    const drawButton = this.add
      .rectangle(512, 718, 200, 50, 0x00aa00)
      .setInteractive({ useHandCursor: true });
    const drawText = this.add
      .text(512, 718, "DRAW", {
        fontFamily: "upheaval",
        fontSize: "24pt",
        color: "#ffffff",
        shadow: {
          color: "#333333",
          offsetX: 2,
          offsetY: 2,
          blur: 0,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(0.5);
    Phaser.Display.Align.In.Center(drawText, drawButton);

    drawButton.on("pointerdown", this.requestNextState.bind(this));

    const autopilotButton = this.add
      .rectangle(742, 718, 220, 50, 0x555555)
      .setInteractive({ useHandCursor: true });
    const autopilotButtonText = this.add
      .text(742, 718, "AUTO PLAY", {
        fontFamily: "upheaval",
        fontSize: "20pt",
        color: "#ffffff",
        shadow: {
          color: "#333333",
          offsetX: 2,
          offsetY: 2,
          blur: 0,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(0.5);
    Phaser.Display.Align.In.Center(autopilotButtonText, autopilotButton);

    autopilotButton.on("pointerdown", () => this.autopilot.toggle());

    const autopilotStatusText = this.add
      .text(742, 676, "AUTOPILOT: OFF", {
        fontFamily: "upheaval",
        fontSize: "18pt",
        color: "#ffffff",
        shadow: {
          color: "#333333",
          offsetX: 2,
          offsetY: 2,
          blur: 0,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(0.5);

    // Set autopilot UI elements
    this.autopilot.button = autopilotButton;
    this.autopilot.buttonText = autopilotButtonText;
    this.autopilot.statusText = autopilotStatusText;
  }

  private setupWinnerPaidText() {
    this.winnerPaidText = this.add
      .text(128, 768 - 20, "winner\npaid 0", {
        fontFamily: "upheaval",
        fontSize: "24pt",
        color: "#ffffff",
        align: "center",
        shadow: {
          color: "#333333",
          offsetX: 2,
          offsetY: 2,
          blur: 0,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(0.5, 1)
      .setVisible(false);
  }

  private setupKeyboardInput() {
    if (this.input.keyboard) {
      this.input.keyboard.on(
        "keydown-ONE",
        this.gameContext.onHoldOne,
        this.gameContext,
      );
      this.input.keyboard.on(
        "keydown-TWO",
        this.gameContext.onHoldTwo,
        this.gameContext,
      );
      this.input.keyboard.on(
        "keydown-THREE",
        this.gameContext.onHoldThree,
        this.gameContext,
      );
      this.input.keyboard.on(
        "keydown-FOUR",
        this.gameContext.onHoldFour,
        this.gameContext,
      );
      this.input.keyboard.on(
        "keydown-FIVE",
        this.gameContext.onHoldFive,
        this.gameContext,
      );
      this.input.keyboard.on("keydown-SPACE", this.requestNextState, this);
      this.input.keyboard.on(
        "keydown-ZERO",
        this.gameContext.onIncreaseBet,
        this.gameContext,
      );
      this.input.keyboard.on(
        "keydown-NINE",
        this.gameContext.onDecreaseBet,
        this.gameContext,
      );
      this.input.keyboard.on("keydown-A", () => this.autopilot.toggle(), this);
    }
  }

  private displayFaceDownCards() {
    for (let i = 0; i < 5; i++) {
      if (!this.card[i]) {
        this.card[i] = this.add
          .image(startX + i * (cardWidth + cardSpacing), startY, "back")
          .setInteractive({ useHandCursor: true });
        this.card[i].setDisplaySize(cardWidth, cardHeight);

        this.card[i].on("pointerdown", () => this.onCardSelected(i));
      } else {
        this.card[i].setTexture("back");
      }
    }
  }

  private onCardSelected(index: number) {
    switch (index) {
      case 0:
        this.gameContext.onHoldOne();
        break;
      case 1:
        this.gameContext.onHoldTwo();
        break;
      case 2:
        this.gameContext.onHoldThree();
        break;
      case 3:
        this.gameContext.onHoldFour();
        break;
      case 4:
        this.gameContext.onHoldFive();
        break;
    }
  }

  private getCardTexture(card: PlayingCard): string {
    let suit = "";
    let rank = "";
    switch (card.suit) {
      case Suit.Hearts:
        suit = "hearts";
        break;
      case Suit.Diamonds:
        suit = "diamonds";
        break;
      case Suit.Clubs:
        suit = "clubs";
        break;
      case Suit.Spades:
        suit = "spades";
        break;
    }

    switch (card.rank) {
      case Rank.Two:
        rank = "2";
        break;
      case Rank.Three:
        rank = "3";
        break;
      case Rank.Four:
        rank = "4";
        break;
      case Rank.Five:
        rank = "5";
        break;
      case Rank.Six:
        rank = "6";
        break;
      case Rank.Seven:
        rank = "7";
        break;
      case Rank.Eight:
        rank = "8";
        break;
      case Rank.Nine:
        rank = "9";
        break;
      case Rank.Ten:
        rank = "10";
        break;
      case Rank.Jack:
        rank = "jack";
        break;
      case Rank.Queen:
        rank = "queen";
        break;
      case Rank.King:
        rank = "king";
        break;
      case Rank.Ace:
        rank = "ace";
        break;
    }

    return `${suit}_${rank}`;
  }

  private toggleHold(index: number) {
    // set the visibility of the held text
    this.heldText[index].setVisible(this.gameContext.hand[index].held);
    this.sound.play("wood");
  }

  private displayCredits() {
    this.creditsText.setText(this.gameContext.credits.toString());
    this.autopilot.checkAndStopIfOutOfCredits();
  }
}
