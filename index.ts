import { CardGameSimulator, RuleSet, Tactic } from "./simulator";
import { CrazyEightsRuleSet, CrazyEightsDefaultTactic } from "./crazyeights";
import { MonsterRuleSet, MonsterDefaultTactic } from "./monster";


const simulationSetup = {
    nofPlayers: 2,
    ruleSet: new MonsterRuleSet(),
    tactic: new MonsterDefaultTactic(),
}

const cardGameSimulator: CardGameSimulator = new CardGameSimulator(0);
cardGameSimulator.simulateOne(simulationSetup);
//cardGameSimulator.simulateMany(100, simulationSetup);
