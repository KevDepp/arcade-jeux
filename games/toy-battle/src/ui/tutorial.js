export const TUTORIAL_STEP_IDS = Object.freeze({
  INTRO: "intro",
  DRAW: "draw",
  AI_DRAW_REPLY: "aiDrawReply",
  SELECT_OPENING: "selectOpening",
  PLACE_OPENING: "placeOpening",
  AI_PLACE_REPLY: "aiPlaceReply",
  INVALID_PLACEMENT: "invalidPlacement",
  SELECT_COVER: "selectCover",
  PLACE_COVER: "placeCover",
  MEDAL_AND_EFFECT: "medalAndEffect",
  KWAK_LESSON: "kwakLesson",
  SELECT_SPECIAL: "selectSpecial",
  PLACE_SPECIAL: "placeSpecial",
  QG_THREAT: "qgThreat",
  COMPLETE: "complete",
});

export const TUTORIAL_TARGETS = Object.freeze({
  seed: "tutorial-0",
  openingTroopType: "skully",
  openingNodeId: "b1",
  redDemoTroopType: "crochet",
  redDemoNodeId: "b2",
  coverTroopType: "star",
  coverNodeId: "b2",
  invalidNodeId: "b4",
});

export const TUTORIAL_IDS = Object.freeze({
  SYNTHETIC: "synthetic-training",
  CEMETERY: "cemetery-training",
});

export const DEFAULT_TUTORIAL_ID = TUTORIAL_IDS.SYNTHETIC;

export const CEMETERY_TUTORIAL_TARGETS = Object.freeze({
  seed: "cemetery-tutorial-7",
  openingTroopType: "skully",
  openingNodeId: "p_top_center_square",
  redDemoTroopType: "crochet",
  redDemoNodeId: "p_bottom_right_square",
  coverTroopType: "star",
  coverNodeId: "p_bottom_right_square",
  invalidNodeId: "p_left_middle_square",
  specialEffectTroopType: "kwak",
  taughtRegionId: null,
  taughtSpecialBaseId: "sp_se_pumpkin",
  threatenedHqNodeId: "qg_red",
});

export const TUTORIAL_STEPS = Object.freeze([
  Object.freeze({
    id: TUTORIAL_STEP_IDS.INTRO,
    title: "Goal",
    text: "Win by taking 2 medals on this training board or by reaching the red Q.G.",
    action: "next",
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.DRAW,
    title: "Draw",
    text: "Click Draw to add two troops to your support. Red will make a scripted reply.",
    action: "draw",
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.SELECT_OPENING,
    title: "Select",
    text: "Select the highlighted Skully troop from your support.",
    action: "selectTroop",
    troopType: TUTORIAL_TARGETS.openingTroopType,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.PLACE_OPENING,
    title: "Connected placement",
    text: "Place Skully on the highlighted base connected to your Q.G.",
    action: "placeTroop",
    nodeId: TUTORIAL_TARGETS.openingNodeId,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.INVALID_PLACEMENT,
    title: "Illegal placement",
    text: "The far red gate is disabled because your connection stops at the red troop.",
    action: "invalidPlacement",
    nodeId: TUTORIAL_TARGETS.invalidNodeId,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.SELECT_COVER,
    title: "Cover by force",
    text: "Select the highlighted Star. Its force 6 can cover red Crochet force 4.",
    action: "selectTroop",
    troopType: TUTORIAL_TARGETS.coverTroopType,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.PLACE_COVER,
    title: "Take the base",
    text: "Place Star on the highlighted red troop to cover it and complete the region.",
    action: "placeTroop",
    nodeId: TUTORIAL_TARGETS.coverNodeId,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.MEDAL_AND_EFFECT,
    title: "Medal and effect",
    text: "You control both region bases, gained 1 medal, and skipped an optional troop effect.",
    action: "next",
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.COMPLETE,
    title: "Path to victory",
    text: "One more medal wins on this board. You can also win by reaching the red Q.G.",
    action: "complete",
  }),
]);

export const CEMETERY_TUTORIAL_STEPS = Object.freeze([
  Object.freeze({
    id: TUTORIAL_STEP_IDS.INTRO,
    title: "Lire la carte",
    text: "Le Cimetiere se lit depuis votre Q.G. bleu: suivez les chemins, occupez les bases, reperez les citrouilles speciales, les regions et les medailles.",
    action: "next",
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.DRAW,
    title: "Piocher ou poser",
    text: "Un tour sert a faire une seule action. Commencez par piocher: votre support peut contenir 8 troupes maximum.",
    action: "draw",
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.AI_DRAW_REPLY,
    title: "Tour IA: pioche",
    text: "Rouge a aussi joue son tour et a pioche. Le journal montre les actions des deux camps avant que vous rejouiez.",
    action: "next",
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.SELECT_OPENING,
    title: "Choisir Skully",
    text: "Selectionnez Skully dans votre support. Le panneau de decision affiche ensuite les emplacements autorises et interdits.",
    action: "selectTroop",
    troopType: CEMETERY_TUTORIAL_TARGETS.openingTroopType,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.PLACE_OPENING,
    title: "Connexion au Q.G.",
    text: "Posez Skully sur la route haute droite: cette base touche votre Q.G. bleu par un chemin connecte, donc elle est legale.",
    action: "placeTroop",
    nodeId: CEMETERY_TUTORIAL_TARGETS.openingNodeId,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.AI_PLACE_REPLY,
    title: "Tour IA: Crochet",
    text: "Rouge pose Crochet sur la route basse gauche. C'est la troupe que vous allez recouvrir: le journal garde la trace du tour IA.",
    action: "next",
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.INVALID_PLACEMENT,
    title: "Pose interdite",
    text: "La grande dalle bord gauche est interdite: une pose doit rester connectee au Q.G. par vos propres bases occupees; une base vide ou adverse coupe la chaine.",
    action: "invalidPlacement",
    nodeId: CEMETERY_TUTORIAL_TARGETS.invalidNodeId,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.SELECT_COVER,
    title: "Recouvrir par force",
    text: "Selectionnez Star. Sa force 6 peut recouvrir Crochet rouge force 4 sur la route basse gauche.",
    action: "selectTroop",
    troopType: CEMETERY_TUTORIAL_TARGETS.coverTroopType,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.PLACE_COVER,
    title: "Recouvrir Crochet",
    text: "Posez Star sur la route basse gauche: vous recouvrez Crochet et reprenez ce point de chemin.",
    action: "placeTroop",
    nodeId: CEMETERY_TUTORIAL_TARGETS.coverNodeId,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.MEDAL_AND_EFFECT,
    title: "Route et effet",
    text: "Le modele spatial T-050 garde les regions et medailles en attente de relecture; seules les grandes dalles sont jouables (les tombes ne sont que decoration). Retenez surtout la connexion et les bases speciales.",
    action: "next",
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.KWAK_LESSON,
    title: "Kwak joker",
    text: "Kwak est joker: il peut recouvrir n'importe quelle troupe adverse, mais n'importe quelle troupe adverse peut aussi recouvrir Kwak.",
    action: "next",
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.SELECT_SPECIAL,
    title: "Choisir Kwak",
    text: "Selectionnez Kwak pour declencher une base speciale du Cimetiere.",
    action: "selectTroop",
    troopType: CEMETERY_TUTORIAL_TARGETS.specialEffectTroopType,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.PLACE_SPECIAL,
    title: "Base speciale du Cimetiere",
    text: "Posez Kwak sur la citrouille sud-est: une base speciale du Cimetiere recupere une de vos troupes defaussees vers le support si une place est libre.",
    action: "placeTroop",
    nodeId: CEMETERY_TUTORIAL_TARGETS.taughtSpecialBaseId,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.QG_THREAT,
    title: "Menace Q.G.",
    text: "Autre chemin de victoire: si votre chaine atteint le Q.G. rouge et qu'une troupe peut y etre posee, vous gagnez immediatement.",
    action: "next",
    nodeId: CEMETERY_TUTORIAL_TARGETS.threatenedHqNodeId,
  }),
  Object.freeze({
    id: TUTORIAL_STEP_IDS.COMPLETE,
    title: "Pret a jouer",
    text: "Vous avez vu la carte, la pioche, la connexion, une pose interdite, le recouvrement, Kwak, les medailles, une base speciale, le Q.G. et le tour IA.",
    action: "complete",
  }),
]);

export const TUTORIAL_DEFINITIONS = Object.freeze({
  [TUTORIAL_IDS.SYNTHETIC]: Object.freeze({
    id: TUTORIAL_IDS.SYNTHETIC,
    terrainId: "synthetic-mvp-terrain",
    steps: TUTORIAL_STEPS,
    targets: TUTORIAL_TARGETS,
  }),
  [TUTORIAL_IDS.CEMETERY]: Object.freeze({
    id: TUTORIAL_IDS.CEMETERY,
    terrainId: "le-cimetiere-maudit",
    steps: CEMETERY_TUTORIAL_STEPS,
    targets: CEMETERY_TUTORIAL_TARGETS,
  }),
});

export function tutorialDefinition(tutorialId = DEFAULT_TUTORIAL_ID) {
  return TUTORIAL_DEFINITIONS[tutorialId] ?? TUTORIAL_DEFINITIONS[DEFAULT_TUTORIAL_ID];
}

export function tutorialDefinitionForSession(session) {
  return tutorialDefinition(session?.tutorialId);
}

export function tutorialTargetsForSession(session) {
  return tutorialDefinitionForSession(session).targets;
}

export function createTutorialSession(tutorialId = DEFAULT_TUTORIAL_ID) {
  return {
    active: true,
    tutorialId: tutorialDefinition(tutorialId).id,
    stepIndex: 0,
    feedback: "",
    completed: false,
  };
}

export function currentTutorialStep(session) {
  if (!session?.active) return null;
  const steps = tutorialDefinitionForSession(session).steps;
  return steps[Math.min(session.stepIndex, steps.length - 1)];
}

export function advanceTutorialSession(session) {
  if (!session?.active) return session;
  const steps = tutorialDefinitionForSession(session).steps;
  const nextIndex = Math.min(session.stepIndex + 1, steps.length - 1);
  return {
    ...session,
    stepIndex: nextIndex,
    feedback: "",
    completed: steps[nextIndex].id === TUTORIAL_STEP_IDS.COMPLETE,
  };
}

export function tutorialProgressLabel(session) {
  if (!session?.active) return "";
  return `${session.stepIndex + 1}/${tutorialDefinitionForSession(session).steps.length}`;
}
