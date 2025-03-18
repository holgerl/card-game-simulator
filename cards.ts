export enum Suit {
    Hearts = "Hearts",
    Diamonds = "Diamonds",
    Clubs = "Clubs",
    Spades = "Spades"
}

export class StandardPlayingCard {
    constructor(public readonly suit: Suit, public readonly rank: number) {}
    
    toString(): string {
        const suitSymbols = {
            Hearts: "♥",
            Diamonds: "♦",
            Clubs: "♣",
            Spades: "♠"
        };

        function rankToString(rank: number): string {
            if (rank <= 10) {
                return rank.toString();
            } else {
                const rankSymbols = {
                    11: "J",
                    12: "Q",
                    13: "K"
                }

                return rankSymbols[rank];
            }
        }

        return `${rankToString(this.rank)}${suitSymbols[this.suit]}`;
    }
    
    matches(other: StandardPlayingCard): boolean {
        return this.suit === other.suit || this.rank === other.rank;
    }

    equals(card: StandardPlayingCard) {
        return this.suit === card.suit && this.rank === card.rank;
    }
}

export class Pile {
    cards: StandardPlayingCard[] = [];

    constructor(...cards: StandardPlayingCard[]) {
        this.cards = cards;
    }

    push(card: StandardPlayingCard): void {
        this.cards.push(card);
    }

    pop(): StandardPlayingCard {
        if (this.cards.length === 0) {
            throw new Error("Pile is empty");
        }
        return this.cards.pop();
    }

    popMany(n: number): Pile {
        const pile = new Pile();
        this.cards.splice(this.cards.length - n, n).map(card => pile.push(card));
        return pile;
    }
    
    remove(card: StandardPlayingCard): void {
        this.cards = this.cards.filter(c => !c.equals(card));
    }

    top(): StandardPlayingCard {
        return this.cards[this.cards.length - 1];
    }

    size(): number {
        return this.cards.length;
    }

    toString(): string {
        return "[" + this.cards.map(card => card.toString()).join(" ") + "]";
    }

    shuffle(): Pile {
        for (let i = 0; i < this.cards.length; i++) {
            const j = Math.floor(Math.random() * this.cards.length);
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        
        return this
    }

    copy(): Pile {
        return new Pile(...this.cards);
    }
}

export function makeDeck(): Pile {
    const deck: Pile = new Pile();
    
    // @ts-ignore
    for (let suit of Object.values(Suit)) {
        for (let rank = 1; rank <= 13; rank++) {
            deck.push(new StandardPlayingCard(suit, rank));
        }
    }
    
    return deck;
}