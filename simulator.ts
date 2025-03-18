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

export interface SimulationSetup {
    nofPlayers: number;
    ruleSet: RuleSet;
    tactic: Tactic;
}

export interface SingleGameStats {
    nofTurns: number;
    winners: number[];
}

export interface MultipleGameStats {
    nofTurnsMean: number;
    nofTurnsStdDev: number;
    victoryDistribution: number[];
}

function meanAndStandardDeviation(array: number[]): {mean: number, standardDeviation: number} {
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    const standardDeviation = Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);

    return {mean, standardDeviation};
}

export class CardGameSimulator {
    constructor(public logLevel = 0) {}

    log(severity : number = 0, ...args: any[]) {
        if (severity >= this.logLevel) {
            console.log(...args);
        }
    }

    public simulateOne({nofPlayers, ruleSet, tactic}: SimulationSetup): SingleGameStats {
        let state = ruleSet.makeStartState(nofPlayers);
        let nofTurns = 0;

        this.log(0, state.toString());
        
        while (!ruleSet.isGameOver(state)) {
            const moves = ruleSet.listMoves(state);
            this.log(0, `Moves: ${moves.join(", ")}`);
            
            const move = tactic.chooseMove(state, moves);
            this.log(0, `Chosen move: ${move.toString()}`);
            
            state = ruleSet.doMove(state, move);
            this.log(0, state.toString());

            nofTurns++;
        }
        
        const stats: SingleGameStats = {
            nofTurns,
            winners: ruleSet.listWinners(state),
        }

        const winnerNames = stats.winners.map(playerIndex => `Player ${playerIndex}`);

        this.log(1, `Winners after ${nofTurns} turns: ${winnerNames}`);
        
        return stats;
    }

    public simulateMany(nofGames : number, simulationSetup: SimulationSetup): MultipleGameStats {
        // @ts-ignore
        const nofTurnsArray = new Array(nofGames).fill(0);
        // @ts-ignore
        const victoriesCount = new Array(simulationSetup.nofPlayers).fill(0);

        for (let i = 0; i < nofGames; i++) {
            const result = this.simulateOne(simulationSetup);
            nofTurnsArray[i] = result.nofTurns;
            result.winners.forEach(winner => {
                victoriesCount[winner]++
            });
        }

        let meanStdDev = meanAndStandardDeviation(nofTurnsArray);

        let totalVictories = victoriesCount.reduce((a, b) => a + b);

        const victoryDistribution = victoriesCount.map(count => count / totalVictories);

        const stats: MultipleGameStats = {
            nofTurnsMean: Math.round(meanStdDev.mean),
            nofTurnsStdDev: parseFloat(meanStdDev.standardDeviation.toFixed(1)),
            victoryDistribution,
        }

        this.log(2, `Stats after ${nofGames} games: ${JSON.stringify(stats)}`);

        return stats;
    }
}