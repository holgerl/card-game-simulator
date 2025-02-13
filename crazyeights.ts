import { Tactic, State, Move, RuleSet } from "./simulator";
import { makeDeck, Pile, StandardPlayingCard, Suit } from "./cards";

export class CrazyEightsDefaultTactic implements Tactic {
    chooseMove(state: State, moves: Move[]): Move {
        const goodMoves = moves.filter(move => (move as CrazyEightsMove).type === CrazyEightsMoveType.Play);
        return goodMoves.length > 0 ? goodMoves[0] : moves[0];
    }
}

export class CrazyEightsState implements State {
    constructor(
        public nofPlayers: number,
        public drawPile: Pile,
        public centerPile: Pile,
        public hands: Pile[],
        public currentPlayer: number,
    ) {
    }

    toString(): String {
        return `
            player: ${this.currentPlayer} 
            center: ${this.centerPile.top().toString()} 
            drawPile: ${this.drawPile.size()} cards
            hands: ${this.hands.map(hand => hand.toString())}
        `;
    }
    
    copy(): CrazyEightsState {
        return new CrazyEightsState(
            this.nofPlayers,
            this.drawPile.copy(),
            this.centerPile.copy(),
            this.hands.map(hand => hand.copy()),
            this.currentPlayer
        );
    }
}

enum CrazyEightsMoveType {
    Draw = "draw",
    Play = "play",
}

export class CrazyEightsMove implements Move {
    constructor(public readonly type: CrazyEightsMoveType, public readonly card?: StandardPlayingCard) {}

    toString(): string {
        return (this.type === CrazyEightsMoveType.Play 
                ? this.card.toString() 
                : this.type.toString()
            );
    }
}

function shuffleCenterPileIntoDrawPileIfNeeded(state: CrazyEightsState) {
    if (state.drawPile.size() === 0) {
        state.drawPile = state.centerPile.copy()
        const topCard = state.drawPile.pop();
        state.centerPile = new Pile(topCard);
        state.drawPile.shuffle();
    }
}

export class CrazyEightsRuleSet implements RuleSet {
    makeStartState(nofPlayers: number): State {
        const drawPile = makeDeck().shuffle()

        const hands: Pile[] = []
        for (let i = 0; i < nofPlayers; i++) {
            hands.push(drawPile.popMany(5));
        }

        const topCard = drawPile.pop();
        const centerPile = new Pile();
        centerPile.push(topCard);

        const currentPlayer = 0;

        return new CrazyEightsState(
            nofPlayers,
            drawPile,
            centerPile,
            hands,
            currentPlayer
        );
    }

    doMove(oldState: CrazyEightsState, move: CrazyEightsMove): State {
        const state = oldState.copy();
        
        let hand = state.hands[state.currentPlayer];
        let topCard = state.centerPile.top();
        
        if (move.type === CrazyEightsMoveType.Draw) {
            for (let i = 0; i < 3; i++) {
                const drawcard = state.drawPile.pop();

                shuffleCenterPileIntoDrawPileIfNeeded(state);

                if (drawcard.matches(topCard)) {
                    state.centerPile.push(drawcard);
                    break;
                } else {
                    hand.push(drawcard);
                }
            }
        } else if (move.type === CrazyEightsMoveType.Play) {
            const card = move.card;
            hand.remove(card)
            state.centerPile.push(card);
        }

        state.currentPlayer = (state.currentPlayer + 1) % state.nofPlayers;
        
        return state;
    }

    isGameOver(state: CrazyEightsState): boolean {
        return state.hands.filter(hand => hand.size() === 0).length > 0
    }

    listWinners(state: CrazyEightsState): number[] {
        return state.hands.filter(hand => hand.size() === 0).map((_, i) => i)
    }

    listMoves(state: CrazyEightsState): CrazyEightsMove[] {
        const moves = [new CrazyEightsMove(CrazyEightsMoveType.Draw)]

        const topCard = state.centerPile.top()

        state.hands[state.currentPlayer].cards.forEach(card => {
            if (card.matches(topCard)) {
                moves.push(new CrazyEightsMove(CrazyEightsMoveType.Play, card))
            }
        })

        return moves;
    }

}
