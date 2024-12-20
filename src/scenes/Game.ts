import { Scene } from "phaser";
import WebFont from "webfontloader";
import { PlayingCard, Rank, Suit } from "../models/playing-card";
import { PokerHand } from "../models/poker-hand-evaluator";
import { PokerGameContext } from "./PokerGameContext";

const cardWidth = 190;
const cardHeight = (cardWidth / 2.5) * 3.5;
const cardSpacing = 10;
const startX = 512 - (cardWidth + cardSpacing) * 2;
const startY = 384 + cardHeight / 2 + cardSpacing;
// const payouts = {
//     'Royal Flush': 250, 'Str Flush': 50, 'Four of a Kind': 25, 'Full House': 6, 'Flush': 5,
//     'Straight': 4, '3 of a Kind': 3, '2 Pair': 2, 'Jacks or Better': 1
// };

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
    // credits: number;
    // bet: number;
    creditsText: Phaser.GameObjects.Text;
    gameOver: import("phaser").GameObjects.Text;
    gameContext: PokerGameContext;
    betText: import("phaser").GameObjects.Text;

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
        this.setupDrawButton();
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

        this.gameContext.on('betChanged', this.displayBet.bind(this));
        this.gameContext.on('creditsChanged', this.displayCredits.bind(this));
        this.gameContext.on('draw', this.displayDraw.bind(this));
        this.gameContext.on('redraw', this.displayRedraw.bind(this));
        this.gameContext.on('holdToggled', this.toggleHold.bind(this));

    }

    private displayRedraw() {
        let count = 0;
        for (let i = 0; i < 5; i++) {
            // get a count of cards that are not held
            if (!this.gameContext.hand[i].held) {
                //set card to card back
                this.card[i].setTexture("back");
                this.time.delayedCall(i * 200, () => {
                    this.sound.play("wood");
                    this.card[i].setTexture(this.getCardTexture(this.gameContext.hand[i]));
                });
                count++;
            }
        }

        // evaluate the hand after all redraws
        this.time.delayedCall(count * 200, () => {
            // clear hold status
            this.gameContext.hand.forEach((card) => (card.held = false));
            this.heldText.forEach((held) => held.setVisible(false));

            const evaluation = this.gameContext.evaluation;
            this.handText.setText(`${evaluation}`);
            Phaser.Display.Align.In.Center(
                this.handText,
                this.heldText[2],
                0,
                -this.handText.height
            );
            this.handText.setVisible(true);

            // after 1.5 seconds, game over text should be displayed
            this.time.delayedCall(1500, () => {
                this.gameOver.setVisible(true);
            });
        });
    }

    private displayDraw() {
        // clear held text
        this.heldText.forEach((held) => held.setVisible(false));
        // clear hand text
        this.handText.setVisible(false);
        // clear game over text
        this.gameOver.setVisible(false);
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
        this.time.delayedCall(5 * 200, () => {
            const evaluation = this.gameContext.evaluation;
            this.handText.setText(`${evaluation}`);
            this.handText.setVisible(true);
            Phaser.Display.Align.In.Center(
                this.handText,
                this.heldText[2],
                0,
                -this.handText.height
            );
            console.log("initial hand", ...this.gameContext.hand);
        });
    }

    private displayBet() {
        this.betText.setText(this.gameContext.bet.toString());
        this.sound.play("blip");
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
                0x0000aa
            );
            Phaser.Display.Align.In.LeftCenter(inner, outer, -2, 0);
            const valuesBox = this.add.rectangle(
                0,
                0,
                outer.width * 0.33,
                outer.height - 4,
                0xaa0000
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
                    box.inner.y - box.inner.height / 2 + (y % 6) * 30
                );
            this.add
                .text(0, y, `${value}`, style2)
                .setOrigin(1, 0)
                .setPosition(
                    box.valuesBox.x + box.valuesBox.width / 2 - 5,
                    box.valuesBox.y - box.valuesBox.height / 2 + (y % 6) * 30
                );
            y++;
        }
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
            betLabel.height + 5
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
            .setInteractive();
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

        drawButton.on("pointerdown", this.gameContext.next.bind(this.gameContext));
    }

    // private NextAction = () => {
    //     if (this.state === GameState.Bet) {
    //         // perform Initial draw
    //         this.startGameRound();
    //     } else if (this.state === GameState.InitialDraw) {
    //         // perform Redraw
    //         this.state = GameState.Redraw;
    //         let count = 0;
    //         for (let i = 0; i < 5; i++) {
    //             // get a count of cards that are not held
    //             if (!this.hand[i].held) {
    //                 //set card to card back
    //                 this.card[i].setTexture("back");
    //                 this.hand[i] = this.deck.deal();
    //                 this.time.delayedCall(i * 200, () => {
    //                     this.sound.play("wood");
    //                     this.card[i].setTexture(this.getCardTexture(this.hand[i]));
    //                 });
    //                 count++;
    //             }
    //         }

    //         // evaluate the hand after all redraws
    //         this.time.delayedCall(count * 200, () => {
    //             // clear hold status
    //             this.hand.forEach((card) => (card.held = false));
    //             this.heldText.forEach((held) => held.setVisible(false));

    //             const evaluator = new PokerHandEvaluator(this.hand);
    //             console.log("redraw hand", ...this.hand);
    //             const evaluation = evaluator.evaluate();
    //             this.handText.setText(`${evaluation}`);
    //             Phaser.Display.Align.In.Center(
    //                 this.handText,
    //                 this.heldText[2],
    //                 0,
    //                 -this.handText.height
    //             );
    //             this.handText.setVisible(true);

    //             // calculate payout
    //             const payout = payoutMap.get(evaluation);
    //             if (payout !== undefined) {
    //                 this.gameContext.credits += payout * this.gameContext.bet;
    //             }
    //             this.displayCredits();

    //             // after 1.5 seconds, game over text should be displayed
    //             this.time.delayedCall(1500, () => {
    //                 this.gameOver.setVisible(true);
    //             });
    //         });
    //     } else {
    //         // // set all cards to face down
    //         // this.card.forEach((c) => c.setTexture("back"));
    //         // // clear hand
    //         // this.hand = [];
    //         // // clear hand text
    //         // this.handText.setVisible(false);
    //         // // set state to bet
    //         // this.state = GameState.Bet;
    //         // // hide game over text
    //         // this.gameOver.setVisible(false);
    //     }
    // };

    // private startGameRound() {
    //     this.displayCredits();

    //     // reset UI
    //     this.heldText.forEach((held) => held.setVisible(false));
    //     this.handText.setVisible(false);

    //     // display the cards
    //     for (let i = 0; i < 5; i++) {
    //         this.time.delayedCall(i * 200, () => {
    //             this.sound.play("wood");
    //             this.card[i].setTexture(this.getCardTexture(this.gameContext.hand[i]));
    //         });
    //     }

    //     // after all cards are displayed, evaluate the hand
    //     this.time.delayedCall(5 * 200, () => {
    //         const evaluation = this.gameContext.evaluation;
    //         this.handText.setText(`${evaluation}`);
    //         this.handText.setVisible(true);
    //         Phaser.Display.Align.In.Center(
    //             this.handText,
    //             this.heldText[2],
    //             0,
    //             -this.handText.height
    //         );
    //         console.log("initial hand", ...this.gameContext.hand);
    //     });
    // }

    private setupKeyboardInput() {
        if (this.input.keyboard) {
            this.input.keyboard.on("keydown-ONE", this.gameContext.onHoldOne, this.gameContext);
            this.input.keyboard.on("keydown-TWO", this.gameContext.onHoldTwo, this.gameContext);
            this.input.keyboard.on("keydown-THREE", this.gameContext.onHoldThree, this.gameContext);
            this.input.keyboard.on("keydown-FOUR", this.gameContext.onHoldFour, this.gameContext);
            this.input.keyboard.on("keydown-FIVE", this.gameContext.onHoldFive, this.gameContext);
            this.input.keyboard.on("keydown-SPACE", this.gameContext.next, this.gameContext);
            this.input.keyboard.on("keydown-ZERO", this.gameContext.onIncreaseBet, this.gameContext);
            this.input.keyboard.on("keydown-NINE", this.gameContext.onDecreaseBet, this.gameContext);
        }
    }

    private displayFaceDownCards() {
        for (let i = 0; i < 5; i++) {
            this.card[i] = this.add.image(
                startX + i * (cardWidth + cardSpacing),
                startY,
                "back"
            );
            this.card[i].setDisplaySize(cardWidth, cardHeight);
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
    }
}




