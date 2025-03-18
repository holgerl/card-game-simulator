import { Tactic, State, Move, RuleSet } from "./simulator";
import { makeDeck, Pile, StandardPlayingCard, Suit } from "./cards";

export class MonsterState implements State {
    constructor(
        public nofPlayers: number,
        public currentPlayer: number,
        public drawPile: Pile,
        public hands: Pile[],
        public lives: Pile[],
        public monsters: Monster[][],
        public defeatedMonsters: Pile[],
    ) {}

    toString(): String {
        return `
            player: ${this.currentPlayer} 
            drawPile: ${this.drawPile.size()} cards
            hands: ${this.hands.map(hand => hand.toString())}
            lives: ${this.lives.map(pile => pile.size())}
            monsters: ${this.monsters.map(monsters =>
                monsters.length === 0 ? "[]" : "[" + monsters.map(monster => monster.toString()) + "]"
            )}
            defeatedMonsters: ${this.defeatedMonsters.map(hand => hand.size())}
        `;
    }
    
    copy(): MonsterState {
        return new MonsterState(
            this.nofPlayers,
            this.currentPlayer,
            this.drawPile.copy(),
            this.hands.map(hand => hand.copy()),
            this.lives.map(pile => pile.copy()),
            this.monsters.map(monsters => monsters.map(monster => monster.copy())),
            this.defeatedMonsters.map(pile => pile.copy()),
        );
    }
}

class Monster extends Pile {
    constructor(...cards: StandardPlayingCard[]) {
        super(...cards);
    }

    strength(): number {
        return this.body().reduce((acc, card) => acc + card.rank, 0);
    }

    copy(): Monster {
        return new Monster(...this.cards);
    }
    
    head(): StandardPlayingCard {
        return this.cards.filter((card) => card.rank >= 10)[0];
    }
    
    body(): StandardPlayingCard[] {
        return this.cards.filter((card) => card.rank < 10);
    }

    toString(): string {
        return "(" + this.head().toString() + " " + this.body().map(card => card.rank).join(" ") + ")";
    }
}

enum MonsterMoveType {
    Draw = "draw",
    Place = "place",
    AttackMonster = "attackMonster",
    AttackLives = "attackLives",
}

export class MonsterDefaultTactic implements Tactic {
    static getMoveRanking(move: MonsterMove): number {
        if (move.type === MonsterMoveType.Draw) {
            return 0;
        } else if (move.type === MonsterMoveType.Place) {
            return move.myMonster.strength();
        } else if (move.type === MonsterMoveType.AttackLives) {
            return 1000;
        } else if (move.type === MonsterMoveType.AttackMonster) {
            const totalSize = move.myMonster.size() + move.otherMonster.size();
            const sign = move.myMonster.strength() > move.otherMonster.strength() ? 1 : -1;
            return sign * (100 + totalSize);
        }
    }

    chooseMove(state: State, moves: Move[]): Move {
        moves.sort((a, b) => {
            let moveA = a as MonsterMove;
            let moveB = b as MonsterMove;
            return MonsterDefaultTactic.getMoveRanking(moveA) - MonsterDefaultTactic.getMoveRanking(moveB);
        })
        
        console.log("Sorted:", moves.map(move => move.toString()).join(", "));
        
        return moves[moves.length - 1];
    }
}

export class MonsterMove implements Move {
    constructor(
        public readonly type: MonsterMoveType, 
        public readonly myMonster?: Monster,
        public readonly myMonsterIndex?: number,
        public readonly otherPlayerIndex?: number,
        public readonly otherMonster?: Monster,
        public readonly otherMonsterIndex?: number
    ) {}

    toString(): string {
        const stringBuilder = [this.type.toString()];

        if (this.type === MonsterMoveType.Place) {
            stringBuilder.push(this.myMonster.toString());
        }

        if (this.type === MonsterMoveType.AttackMonster) {
            stringBuilder.push(this.myMonster.toString());
            stringBuilder.push(`against player ${this.otherPlayerIndex} monster`);
            stringBuilder.push(this.otherMonster.toString());
        }
        
        if (this.type === MonsterMoveType.AttackLives) {
            stringBuilder.push(`against player ${this.otherPlayerIndex}`);
        }

        return stringBuilder.join(" ");
    }
}

export class MonsterRuleSet implements RuleSet {
    makeStartState(nofPlayers: number): State {
        const drawPile = makeDeck().shuffle()

        const hands: Pile[] = [];
        const lives: Pile[] = [];
        const monsters: Monster[][] = [];
        const defeatedMonsters: Pile[] = [];
        
        for (let i = 0; i < nofPlayers; i++) {
            lives.push(drawPile.popMany(5));
            hands.push(drawPile.popMany(5));
            monsters.push([]);
            defeatedMonsters.push(new Pile());
        }

        const currentPlayer = 0;
        
        return new MonsterState(
            nofPlayers,
            currentPlayer,
            drawPile,
            hands,
            lives,
            monsters,
            defeatedMonsters,
        );
    }

    doMove(oldState: MonsterState, move: MonsterMove): State {
        const state = oldState.copy();
        
        let hand = state.hands[state.currentPlayer];
        
        if (move.type === MonsterMoveType.Draw) {
            hand.push(state.drawPile.pop());
        } else if (move.type === MonsterMoveType.Place) {
            move.myMonster.cards.forEach((card) => hand.remove(card))
            state.monsters[state.currentPlayer].push(move.myMonster);
        } else if (move.type === MonsterMoveType.AttackMonster) {
            state.monsters[state.currentPlayer].splice(move.myMonsterIndex, 1);
            state.monsters[move.otherPlayerIndex].splice(move.otherMonsterIndex, 1);
            if (move.myMonster.strength() > move.otherMonster.strength()) {
                state.defeatedMonsters[state.currentPlayer].pushMany(move.myMonster);
                state.defeatedMonsters[state.currentPlayer].pushMany(move.otherMonster);
            } else {
                state.defeatedMonsters[move.otherPlayerIndex].pushMany(move.myMonster);
                state.defeatedMonsters[move.otherPlayerIndex].pushMany(move.otherMonster);
            }
        } else if (move.type === MonsterMoveType.AttackLives) {
            hand.push(state.lives[move.otherPlayerIndex].pop());
        }

        state.currentPlayer = (state.currentPlayer + 1) % state.nofPlayers;
        
        return state;
    }

    isGameOver(state: MonsterState): boolean {
        const emptyDrawPile = state.drawPile.isEmpty();
        const emptyLives = state.lives.filter(pile => pile.isEmpty()).length > 0;
        return emptyDrawPile || emptyLives;
    }

    listWinners(state: MonsterState): number[] {
        const playersAlive: {player: number, points: number}[] = [];

        state.lives.forEach((lives, i) => {
            if (!lives.isEmpty()) playersAlive.push(
                {player: i, points: state.defeatedMonsters[i].size()}
            );
        });

        playersAlive.sort((a, b) => b.points - a.points).reverse();

        const topPlayers = playersAlive.filter(player => player.points === playersAlive[0].points);

        const winnerPlayers = topPlayers.map(player => player.player);
        
        return winnerPlayers
    }

    listMoves(state: MonsterState): MonsterMove[] {
        const moves = [new MonsterMove(MonsterMoveType.Draw)]

        const hand = state.hands[state.currentPlayer];

        const isMonsterCard = (card: StandardPlayingCard) => card.rank >= 10;

        const monsterCards = hand.cards.filter(isMonsterCard)

        const strengthCards = hand.cards.filter((card) => !isMonsterCard(card));

        if (monsterCards.length > 0) {
            monsterCards.forEach((monsterCard: StandardPlayingCard) => {
                const matchingStrengthCards = strengthCards.filter(strengthCard => strengthCard.suit === monsterCard.suit);
                
                if (matchingStrengthCards.length === 0) return;

                const combinations: Pile[] = new Pile(...matchingStrengthCards).combinations();

                combinations.forEach((combination: Pile) => {
                    combination.push(monsterCard);

                    moves.push(new MonsterMove(
                        MonsterMoveType.Place,
                        new Monster(...combination.cards)
                    ));
                });
            });
        }
        
        const myMonsters = state.monsters[state.currentPlayer];
        
        if (myMonsters.length > 0) {
            myMonsters.forEach((myMonster: Monster, myMonsterIndex) => {
                state.monsters.forEach((otherPlayerMonsters: Monster[], otherPlayerIndex) => {
                    if (otherPlayerIndex === state.currentPlayer) return; // Skip self
                    otherPlayerMonsters.forEach((otherMonster: Monster, otherMonsterIndex) => {
                        if (myMonster.strength() !== otherMonster.strength()) {
                            moves.push(new MonsterMove(
                                MonsterMoveType.AttackMonster,
                                myMonster,
                                myMonsterIndex,
                                otherPlayerIndex,
                                otherMonster,
                                otherMonsterIndex
                            ));
                        }
                    });
                });
            });
            
            state.monsters.forEach((otherPlayerMonsters: Monster[], otherPlayerIndex) => {
                if (otherPlayerMonsters.length === 0) {
                    moves.push(new MonsterMove(
                        MonsterMoveType.AttackLives,
                        myMonsters[0],
                        0,
                        otherPlayerIndex
                    ));
                }
            });
        }

        return moves;
    }
}
