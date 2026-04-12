import type { Question } from "@/lib/data/questions/types";
import { buildStudioConceptQuestions, type StudioConceptSpec } from "@/lib/robloxCourse/builders";

const terrainEditorSpec: StudioConceptSpec = {
  concept: "terrain-editor",
  title: "Terrain Editor",
  nodeType: "practice",
  definition: "Terrain Editor is the Studio toolset for sculpting, painting, smoothing, and filling Roblox terrain.",
  definitionDistractors: [
    "Terrain Editor is the panel that only shows the Instance hierarchy in the place.",
    "Terrain Editor is the service that stores connected player objects.",
    "Terrain Editor is the script class used only for client UI code.",
  ],
  scenarios: [
    {
      action: "sculpt hills, valleys, and cliffs out of Roblox terrain",
      distractors: ["Explorer", "Properties", "Output"],
      explanation: "Terrain Editor is built for shaping terrain volumes. Explorer and Properties help manage objects, but they do not sculpt terrain directly.",
      alternateAction: "raise and lower the landscape with terrain tools",
    },
    {
      action: "paint grass, rock, sand, or snow onto existing terrain",
      distractors: ["Toolbox", "Explorer", "Animation Editor"],
      explanation: "Terrain Editor includes material paint tools so you can apply terrain materials across the landscape.",
      alternateAction: "change terrain materials across the map",
    },
    {
      action: "smooth rough terrain so a mountain looks less blocky",
      distractors: ["Properties", "View tab", "Command Bar"],
      explanation: "The smooth and flatten style tools live in Terrain Editor, not in the Properties panel or ribbon tabs alone.",
      alternateAction: "soften a jagged terrain surface",
    },
    {
      action: "add or remove water terrain in a river or lake",
      distractors: ["Explorer", "Script Editor", "Material Manager"],
      explanation: "Terrain Editor can generate and edit water terrain directly as part of the terrain system.",
      alternateAction: "shape a lake using Roblox terrain water",
    },
    {
      action: "fill a large selected region with terrain material",
      distractors: ["Properties", "Toolbox", "Output"],
      explanation: "Region-based terrain fills are part of Terrain Editor workflows, not ordinary property editing.",
      alternateAction: "turn an empty terrain region into solid land",
    },
    {
      action: "convert rough world-building ideas into terrain instead of placing many parts by hand",
      distractors: ["Explorer", "Asset Manager", "Test panel"],
      explanation: "Terrain Editor is used when building natural landscapes, caves, and large organic environments.",
      alternateAction: "build natural landforms without stacking lots of separate parts",
    },
    {
      action: "use Studio brushes to carve caves through a mountain",
      distractors: ["Properties", "StarterGui", "ServerScriptService"],
      explanation: "Brush-based add, subtract, and smooth terrain operations belong to Terrain Editor.",
      alternateAction: "subtract terrain out of a mountain with a brush",
    },
    {
      action: "open the specialized Studio tool focused on terrain materials and brush operations",
      distractors: ["Explorer", "Properties", "Toolbox"],
      explanation: "Roblox provides a dedicated Terrain Editor for terrain-specific workflows, separate from the general hierarchy or property panels.",
      alternateAction: "work with Roblox terrain using dedicated brush tools",
    },
  ],
  truths: [
    {
      truth: "Terrain Editor is meant for natural-looking land, caves, water, and other terrain-based world shapes.",
      lie: "Terrain Editor is only for renaming scripts under ServerScriptService.",
      explanation: "Terrain Editor focuses on terrain content, while script naming and hierarchy management happen elsewhere in Studio.",
    },
    {
      truth: "Terrain Editor can paint different terrain materials like grass, rock, or sand.",
      lie: "Terrain Editor can only create one default terrain material for the whole map.",
      explanation: "Material painting is one of the core terrain workflows in Roblox Studio.",
    },
    {
      truth: "Smoothing terrain is a terrain-tool action rather than a normal Part property change.",
      lie: "You smooth terrain by changing a `Smooth` checkbox on a selected Part in Properties.",
      explanation: "Terrain and Parts are edited differently. Terrain smoothing uses terrain tools, not a generic part property.",
    },
    {
      truth: "Terrain water is part of the terrain system, not a separate Studio panel.",
      lie: "Water terrain can only be added by inserting a `WaterPanel` object from Explorer.",
      explanation: "Terrain water is created and shaped through terrain tools, not by adding a special hierarchy panel object.",
    },
    {
      truth: "Terrain Editor is useful when you want large landscapes without manually placing many small Parts.",
      lie: "Terrain Editor should never be used for mountains, valleys, or caves.",
      explanation: "Organic landforms are a major reason to use terrain instead of only Parts.",
    },
    {
      truth: "You still navigate the world in the viewport while using Terrain Editor tools.",
      lie: "Opening Terrain Editor hides the 3D world and only shows a text list of terrain cells.",
      explanation: "Terrain editing is visual and happens in the 3D workspace.",
    },
    {
      truth: "Terrain Editor is a Studio environment tool, not a runtime Lua service like Players or TweenService.",
      lie: "Terrain Editor is accessed in code with `game:GetService(\"TerrainEditor\")`.",
      explanation: "Terrain Editor is part of Studio UI. Roblox scripts do not fetch it as a runtime service.",
    },
    {
      truth: "A map can use both terrain and Parts together in the same place.",
      lie: "If a place has terrain, it cannot also contain normal Parts or Models.",
      explanation: "Roblox places commonly mix terrain with Parts, Models, and other Instances.",
    },
  ],
};

export const terrainEditorQuestions: Question[] = buildStudioConceptQuestions(terrainEditorSpec);
