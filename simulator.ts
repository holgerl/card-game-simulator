export interface State {
    nofPlayers: number;
    copy(): State;
    toString(): void;
}

export interface Move {
    toString(): string;
}

export interface RuleSet {
    makeStartState(nofPlayers: number): State;
    listMoves(state: State): Move[];
    doMove(state: State, move: Move): State;
    isGameOver(state: State): boolean;
    listWinners(state: State): number[];
}

export interface Tactic {
    chooseMove(state: State, moves: Move[]): Move;
}

export class CardGameSimulator {

    public simulate(nofPlayers: number, ruleSet: RuleSet, tactic: Tactic): void {
        let state = ruleSet.makeStartState(nofPlayers);
        let nofTurns = 0;

        console.log(state.toString());
        
        while (!ruleSet.isGameOver(state)) {
            const moves = ruleSet.listMoves(state);
            console.log(`Moves: ${moves.join(", ")}`);
            
            const move = tactic.chooseMove(state, moves);
            console.log(`Chosen move: ${move.toString()}`);
            
            state = ruleSet.doMove(state, move);
            console.log(state.toString());

            nofTurns++;
        }

        const winners = ruleSet.listWinners(state).map(playerIndex => `Player ${playerIndex}`);

        console.log(`Winners after ${nofTurns} turns: ${winners}`);
    }
}