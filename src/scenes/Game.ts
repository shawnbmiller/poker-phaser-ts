import { Scene } from 'phaser';
import WebFont from 'webfontloader';
import { Deck } from '../models/deck';
import { PlayingCard, Rank, Suit } from '../models/playing-card';
import { PokerHandEvaluator } from '../models/poker-hand-evaluator';


const cardWidth = 190;
const cardHeight = cardWidth/2.5*3.5;
const cardSpacing = 10;
const startX = 512 - ((cardWidth + cardSpacing) * 2);
const startY = 384 + (cardHeight / 2) + cardSpacing;
const payouts = { 
    'Royal Flush': 250, 'Str Flush': 50, 'Four of a Kind': 25, 'Full House': 6, 'Flush': 5, 
    'Straight': 4, '3 of a Kind': 3, '2 Pair': 2, 'Jacks or Better': 1 };

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    msg_text : Phaser.GameObjects.Text;
    suit: string[];
    values: string[];
    fileNames: string[];
    card: Phaser.GameObjects.Image[] = [];
    heldText: Phaser.GameObjects.Text[] = [];
    fontReady: boolean;
    deck: Deck;
    hand: PlayingCard[];
    handText: Phaser.GameObjects.Text;
    
    

    constructor ()
    {
        super('Game');
        this.suit = ['hearts', 'diamonds', 'clubs', 'spades'];
        this.values = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
        this.fileNames = this.suit.map(s => this.values.map(v => `${s}_${v}`)).flat();
    }

    init ()
    {
        //  Inject our CSS
        const element = document.createElement('style');

        document.head.appendChild(element);

        const sheet = element.sheet;

        let styles = '@font-face { font-family: "upheaval"; src: url("assets/upheaval/upheavtt.ttf") format("truetype"); }\n';

        if (sheet) {
            sheet.insertRule(styles, 0);
        }
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x2222ff);
       
        WebFont.load({
            custom: {
                families: ['upheaval'] 
            },
            active: () => {
                this.setupGameInterface();
            }
        });

    }



    private setupGameInterface() {
        this.add.text(512, 70, 'BONUS POKER', { fontFamily: 'upheaval', fontSize: '32pt', color: '#ffffff', shadow: {color: '#333333', offsetX: 2, offsetY: 2, blur: 0, fill: true, stroke: false }}).setOrigin(0.5);

        // display 5 card backs in a row across the bottom half of the screen
        this.displayFaceDownCards();

        // add HELD above each card
        this.heldText = [];
        for (let i = 0; i < 5; i++) {
            this.heldText[i] = this.add.text(0, 0, 'HELD', { fontFamily: 'upheaval', fontSize: '24pt', color: '#ffffff', shadow: {color: '#333333', offsetX: 2, offsetY: 2, blur: 0, fill: true, stroke: false }}).setOrigin(0.5);
            Phaser.Display.Align.In.TopCenter(this.heldText[i], this.card[i], 0, 0);
            this.heldText[i].setVisible(false);
        }

        //add row with pair of rectangles in the top half of the screen
        let rectWidth = (1024 - 60) / 2;
        let rectHeight = 200;

        const payoutBox1 = this.add.rectangle(0, 0, rectWidth, rectHeight, 0xffff00);
        console.log("originx:", payoutBox1.originX);
        const payoutBox2 = this.add.rectangle(0, 0, rectWidth, rectHeight, 0xffff00);

        Phaser.Display.Align.In.LeftCenter(payoutBox1, this.add.zone((1024 / 2) + 20, 200, 1024, 250));
        Phaser.Display.Align.In.RightCenter(payoutBox2, this.add.zone((1024 / 2) - 20, 200, 1024, 250));

        rectWidth -= 4;
        rectHeight -= 4;
        const payoutBox1Inner = this.add.rectangle(0, 0, rectWidth, rectHeight, 0x0000AA);
        const payoutBox2Inner = this.add.rectangle(0, 0, rectWidth, rectHeight, 0x0000AA);
        Phaser.Display.Align.In.Center(payoutBox1Inner, payoutBox1);
        Phaser.Display.Align.In.Center(payoutBox2Inner, payoutBox2);

        const valueWidth = rectWidth * .33;
        const valueHeight = rectHeight;
        const payoutBox1ValuesBox = this.add.rectangle(0, 0, valueWidth, valueHeight, 0xAA0000);
        const payoutBox2ValuesBox = this.add.rectangle(0, 0, valueWidth, valueHeight, 0xAA0000);
        Phaser.Display.Align.In.RightCenter(payoutBox1ValuesBox, payoutBox1Inner);
        Phaser.Display.Align.In.RightCenter(payoutBox2ValuesBox, payoutBox2Inner);

        // add a 2 pixel wide rectangle on the left side of payoutBox1ValuesBox and payoutBox2ValuesBox
        const payoutBox1ValuesBoxLeft = this.add.rectangle(0, 0, 2, valueHeight, 0xFFFF00);
        Phaser.Display.Align.In.LeftCenter(payoutBox1ValuesBoxLeft, payoutBox1ValuesBox);
        const payoutBox2ValuesBoxLeft = this.add.rectangle(0, 0, 2, valueHeight, 0xFFFF00);
        Phaser.Display.Align.In.LeftCenter(payoutBox2ValuesBoxLeft, payoutBox2ValuesBox);

        // add text to the inner rectangles
        const style2: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'upheaval', fontSize: '24pt', color: '#ffff66', shadow: {color: '#000000', offsetX: 1, offsetY: 1, blur: 0, fill: true, stroke: false }};
        let y = 0;
        for (const [key, value] of Object.entries(payouts)) {
            const nameBox = (y > 5) ? payoutBox2Inner : payoutBox1Inner;
            const handNameText = this.add.text(0, y, `${key.toUpperCase()}`, style2);
            Phaser.Display.Align.In.TopLeft(handNameText, nameBox, -5, (handNameText.height + 5) * -(y % 6));

            const payoutBox = (y > 5) ? payoutBox2ValuesBox : payoutBox1ValuesBox;
            const payoutText = this.add.text(0, y, `${value}`, style2);
            Phaser.Display.Align.In.TopRight(payoutText, payoutBox, -5, (payoutText.height + 5) * -(y % 6));
            y += 1;
        }

        // display number for credits in bottom right corner
        this.add.text(1024 - 10, 768 - 50, 'CREDITS', { fontFamily: 'upheaval', fontSize: '24pt', color: '#ffffff', shadow: {color: '#333333', offsetX: 2, offsetY: 2, blur: 0, fill: true, stroke: false }}).setOrigin(1, 1);
        this.add.text(1024 - 10, 768 - 20, '100', { fontFamily: 'upheaval', fontSize: '24pt', color: '#ffffff', shadow: {color: '#333333', offsetX: 2, offsetY: 2, blur: 0, fill: true, stroke: false }}).setOrigin(1, 1);

        // display number for bet above the rightmost card
        var betLabel = this.add.text(0, 0, 'BET', { fontFamily: 'upheaval', fontSize: '24pt', color: '#ffffff', shadow: {color: '#333333', offsetX: 2, offsetY: 2, blur: 0, fill: true, stroke: false }}).setOrigin(1, 1);
        Phaser.Display.Align.In.TopRight(betLabel, this.card[4], -15, betLabel.height + 5);
        console.log("betLabel:", betLabel.x, betLabel.y);
        var betValue = this.add.text(0, 0, '1', { fontFamily: 'upheaval', fontSize: '24pt', color: '#ffffff', shadow: {color: '#333333', offsetX: 2, offsetY: 2, blur: 0, fill: true, stroke: false }}).setOrigin(1, 1);
        Phaser.Display.Align.In.TopRight(betValue, this.card[4], -15, 0);

        // add a button at the bottom of the screen that says DRAW
        const drawButton = this.add.rectangle(0, 0, 200, 50, 0x00aa00);
        Phaser.Display.Align.In.BottomCenter(drawButton, this.add.zone(512, 718, 1024, 75));
        const drawText = this.add.text(0, 0, 'DRAW', { fontFamily: 'upheaval', fontSize: '24pt', color: '#ffffff', shadow: {color: '#333333', offsetX: 2, offsetY: 2, blur: 0, fill: true, stroke: false }}).setOrigin(0.5);
        Phaser.Display.Align.In.Center(drawText, drawButton);
        // add a handler for clicking the draw button
        drawButton.setInteractive();
        drawButton.on('pointerdown', () => {
            console.log('Draw button was clicked');
            // remove HELD from all cards
            this.heldText.forEach(held => held.setVisible(false));
            // remove the hand text
            if (this.handText) {
                this.handText.destroy();
            }
            this.deck = new Deck();
            this.deck.shuffle();
            this.hand = [];
            for (let i = 0; i < 5; i++) {
                this.hand.push(this.deck.deal());
            }
            console.log('hand:', this.hand);
            // display the 5 cards
            for (let i = 0; i < 5; i++) {
                this.time.delayedCall(i * 200, () => {
                    // play a sound
                    this.sound.play('wood');
                    console.log('getting texture', this.getCardTexture(this.hand[i]));
                this.card[i].setTexture(this.getCardTexture(this.hand[i]));

                if (i == 4) {
                    // evaluate the hand
                    let evaluator = new PokerHandEvaluator(this.hand);
                    let evaluation = evaluator.evaluate();
                    console.log('evaluation:', evaluation);
                    // display the evaluation centered above held text
                    this.handText = this.add.text(0, 0, `${evaluation}`, { fontFamily: 'upheaval', fontSize: '24pt', color: '#ffffff', shadow: {color: '#333333', offsetX: 2, offsetY: 2, blur: 0, fill: true, stroke: false }}).setOrigin(0.5);
                    Phaser.Display.Align.In.Center(this.handText, this.heldText[2], 0, -this.handText.height);

                }}
            );
            }
        });

        // add a handler for pressing d
        if (this.input.keyboard) {
            // add a handler for pressing 1-5
            this.input.keyboard.on('keydown-ONE', () => {
                console.log('1 key was pressed');
                // display HELD above the first card
                this.heldText[0].setVisible(!this.heldText[0].visible);
                this.sound.play('wood');
            });
            this.input.keyboard.on('keydown-TWO', () => {
                console.log('2 key was pressed');
                // display HELD above the second card
                this.heldText[1].setVisible(!this.heldText[1].visible);
                this.sound.play('wood');
            });
            this.input.keyboard.on('keydown-THREE', () => {
                console.log('3 key was pressed');
                // display HELD above the third card
                this.heldText[2].setVisible(!this.heldText[2].visible);
                this.sound.play('wood');
            });
            this.input.keyboard.on('keydown-FOUR', () => {
                console.log('4 key was pressed');
                // display HELD above the fourth card
                this.heldText[3].setVisible(!this.heldText[3].visible);
                this.sound.play('wood');
            });
            this.input.keyboard.on('keydown-FIVE', () => {
                console.log('5 key was pressed');
                // display HELD above the fifth card
                this.heldText[4].setVisible(!this.heldText[4].visible);
                this.sound.play('wood');
            });
            
        }
            
    }

    private displayFaceDownCards() {
        for (let i = 0; i < 5; i++) {
            this.card[i] = this.add.image(startX + (i * (cardWidth + cardSpacing)), startY, 'back');
            this.card[i].setDisplaySize(cardWidth, cardHeight);
        }
    }

    private getCardTexture(card: PlayingCard): string {
        let suit = '';
        let rank = '';
        switch (card.suit) {
            case Suit.Hearts:
                suit = 'hearts';
                break;
            case Suit.Diamonds:
                suit = 'diamonds';
                break;
            case Suit.Clubs:
                suit = 'clubs';
                break;
            case Suit.Spades:
                suit = 'spades';
                break;
        }

        switch (card.rank) {
            case Rank.Two:
                rank = '2';
                break;
            case Rank.Three:
                rank = '3';
                break;
            case Rank.Four:
                rank = '4';
                break;
            case Rank.Five:
                rank = '5';
                break;
            case Rank.Six:
                rank = '6';
                break;
            case Rank.Seven:
                rank = '7';
                break;
            case Rank.Eight:
                rank = '8';
                break;
            case Rank.Nine:
                rank = '9';
                break;
            case Rank.Ten:
                rank = '10';
                break;
            case Rank.Jack:
                rank = 'jack';
                break;
            case Rank.Queen:
                rank = 'queen';
                break;
            case Rank.King:
                rank = 'king';
                break;
            case Rank.Ace:
                rank = 'ace';
                break;
        }

        return `${suit}_${rank}`;
    }
}
