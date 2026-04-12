import type { Question } from "@/lib/data/questions/types";
import { advancedSystemsQuestions } from "@/lib/robloxCourse/questions/advanced-systems";
import { checkpointSystemQuestions } from "@/lib/robloxCourse/questions/checkpoint-system";
import { explorerPanelQuestions } from "@/lib/robloxCourse/questions/explorer-panel";
import { clickDetectorQuestions } from "@/lib/robloxCourse/questions/click-detector";
import { characterHumanoidQuestions } from "@/lib/robloxCourse/questions/character-humanoid";
import { dataStoreServiceQuestions } from "@/lib/robloxCourse/questions/data-store-service";
import { eventsConnectQuestions } from "@/lib/robloxCourse/questions/events-connect";
import { getServiceQuestions } from "@/lib/robloxCourse/questions/getservice";
import { hudButtonsQuestions } from "@/lib/robloxCourse/questions/hud-buttons";
import { instanceNewQuestions } from "@/lib/robloxCourse/questions/instance-new";
import { leaderstatsQuestions } from "@/lib/robloxCourse/questions/leaderstats";
import { liveSecurityQuestions } from "@/lib/robloxCourse/questions/live-security";
import { moduleScriptsQuestions } from "@/lib/robloxCourse/questions/module-scripts";
import { partManipulationQuestions } from "@/lib/robloxCourse/questions/part-manipulation";
import { playtestPublishingQuestions } from "@/lib/robloxCourse/questions/playtest-publishing";
import { playersServiceQuestions } from "@/lib/robloxCourse/questions/players-service";
import { propertiesPanelQuestions } from "@/lib/robloxCourse/questions/properties-panel";
import { raycastingQuestions } from "@/lib/robloxCourse/questions/raycasting";
import { remoteEventQuestions } from "@/lib/robloxCourse/questions/remote-event";
import { remoteFunctionQuestions } from "@/lib/robloxCourse/questions/remote-function";
import { saveFlowQuestions } from "@/lib/robloxCourse/questions/save-flow";
import { screenGuiQuestions } from "@/lib/robloxCourse/questions/screen-gui";
import { scriptTypesQuestions } from "@/lib/robloxCourse/questions/script-types";
import { soundServiceQuestions } from "@/lib/robloxCourse/questions/sound-service";
import { studioLayoutQuestions } from "@/lib/robloxCourse/questions/studio-layout";
import { terrainEditorQuestions } from "@/lib/robloxCourse/questions/terrain-editor";
import { toolboxPanelQuestions } from "@/lib/robloxCourse/questions/toolbox-panel";
import { tweenServiceQuestions } from "@/lib/robloxCourse/questions/tween-service";
import { touchedEventQuestions } from "@/lib/robloxCourse/questions/touched-event";
import { visualEffectsQuestions } from "@/lib/robloxCourse/questions/visual-effects";
import { workspaceServiceQuestions } from "@/lib/robloxCourse/questions/workspace-service";

export {
  advancedSystemsQuestions,
  checkpointSystemQuestions,
  leaderstatsQuestions,
  hudButtonsQuestions,
  saveFlowQuestions,
  soundServiceQuestions,
  visualEffectsQuestions,
  liveSecurityQuestions,
  moduleScriptsQuestions,
  raycastingQuestions,
  studioLayoutQuestions,
  explorerPanelQuestions,
  propertiesPanelQuestions,
  toolboxPanelQuestions,
  partManipulationQuestions,
  playtestPublishingQuestions,
  terrainEditorQuestions,
  workspaceServiceQuestions,
  instanceNewQuestions,
  scriptTypesQuestions,
  getServiceQuestions,
  playersServiceQuestions,
  eventsConnectQuestions,
  touchedEventQuestions,
  clickDetectorQuestions,
  characterHumanoidQuestions,
  remoteEventQuestions,
  remoteFunctionQuestions,
  screenGuiQuestions,
  tweenServiceQuestions,
  dataStoreServiceQuestions,
};

export const robloxQuestionBank: Record<string, Question[]> = {
  "studio-layout": studioLayoutQuestions,
  "explorer-panel": explorerPanelQuestions,
  "properties-panel": propertiesPanelQuestions,
  "toolbox-panel": toolboxPanelQuestions,
  "part-manipulation": partManipulationQuestions,
  "playtest-publishing": playtestPublishingQuestions,
  "terrain-editor": terrainEditorQuestions,
  "workspace-service": workspaceServiceQuestions,
  "instance-new": instanceNewQuestions,
  "script-types": scriptTypesQuestions,
  getservice: getServiceQuestions,
  "players-service": playersServiceQuestions,
  "events-connect": eventsConnectQuestions,
  "checkpoint-system": checkpointSystemQuestions,
  "touched-event": touchedEventQuestions,
  "click-detector": clickDetectorQuestions,
  "character-humanoid": characterHumanoidQuestions,
  leaderstats: leaderstatsQuestions,
  "remote-event": remoteEventQuestions,
  "remote-function": remoteFunctionQuestions,
  "screen-gui": screenGuiQuestions,
  "hud-buttons": hudButtonsQuestions,
  "tween-service": tweenServiceQuestions,
  "data-store-service": dataStoreServiceQuestions,
  "save-flow": saveFlowQuestions,
  "sound-service": soundServiceQuestions,
  "visual-effects": visualEffectsQuestions,
  "live-security": liveSecurityQuestions,
  "module-scripts": moduleScriptsQuestions,
  raycasting: raycastingQuestions,
  "advanced-systems": advancedSystemsQuestions,
};
