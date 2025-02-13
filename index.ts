import { CardGameSimulator, RuleSet, Tactic } from "./simulator";
import { CrazyEightsRuleSet, CrazyEightsDefaultTactic } from "./crazyeights";

const ruleSet: RuleSet = new CrazyEightsRuleSet();
const tactic: Tactic = new CrazyEightsDefaultTactic();
const cardGameSimulator: CardGameSimulator = new CardGameSimulator();
cardGameSimulator.simulate(2, ruleSet, tactic);
