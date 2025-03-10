﻿using Garland.Data.Output;
using MySql.Data.MySqlClient;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data
{
    public static class PatchDatabase
    {
        private static bool _patchesChanged = false;
        private static Dictionary<string, Dictionary<string, ValueTuple<decimal, decimal>>> _patchesByIdByType = new Dictionary<string, Dictionary<string, ValueTuple<decimal, decimal>>>();

        public static Dictionary<int, int> ItemPatchCategoryByUICategory = new Dictionary<int, int>();
        public static Dictionary<int, string> ItemPatchCategories = new Dictionary<int, string>();

        static PatchDatabase()
        {
            ItemPatchCategories[0] = "装备: 战斗精英/魔法导师";
            ItemPatchCategories[1] = "装备: 能工巧匠";
            ItemPatchCategories[2] = "装备: 大地使者";
            ItemPatchCategories[3] = "装备: 时装";
            ItemPatchCategories[4] = "药品";
            ItemPatchCategories[5] = "杂货";
            ItemPatchCategories[6] = "食品";
            ItemPatchCategories[7] = "水产品";
            ItemPatchCategories[8] = "染料";
            ItemPatchCategories[9] = "房屋相关";
            ItemPatchCategories[10] = "魔晶石";
            ItemPatchCategories[11] = "宠物";
            ItemPatchCategories[12] = "栽培用品";
            ItemPatchCategories[13] = "季节活动";
            ItemPatchCategories[14] = "九宫幻卡";
            ItemPatchCategories[15] = "飞空艇/潜水艇部件";
            ItemPatchCategories[16] = "管弦乐琴相关";
            ItemPatchCategories[17] = "坐骑";
            ItemPatchCategories[18] = "装备: PvP";
            ItemPatchCategories[19] = "元素"; // For materia categories only.
            ItemPatchCategories[20] = "绘画作品";

            ItemPatchCategoryByUICategory[1] = 0; // Pugilist's Arm
            ItemPatchCategoryByUICategory[2] = 0; // Gladiator's Arm
            ItemPatchCategoryByUICategory[3] = 0; // Marauder's Arm
            ItemPatchCategoryByUICategory[4] = 0; // Archer's Arm
            ItemPatchCategoryByUICategory[5] = 0; // Lancer's Arm
            ItemPatchCategoryByUICategory[6] = 0; // One–handed Thaumaturge's Arm
            ItemPatchCategoryByUICategory[7] = 0; // Two–handed Thaumaturge's Arm
            ItemPatchCategoryByUICategory[8] = 0; // One–handed Conjurer's Arm
            ItemPatchCategoryByUICategory[9] = 0; // Two–handed Conjurer's Arm
            ItemPatchCategoryByUICategory[10] = 0; // Arcanist's Grimoire
            ItemPatchCategoryByUICategory[11] = 0; // Shield
            ItemPatchCategoryByUICategory[12] = 1; // Carpenter's Primary Tool
            ItemPatchCategoryByUICategory[13] = 1; // Carpenter's Secondary Tool
            ItemPatchCategoryByUICategory[14] = 1; // Blacksmith's Primary Tool
            ItemPatchCategoryByUICategory[15] = 1; // Blacksmith's Secondary Tool
            ItemPatchCategoryByUICategory[16] = 1; // Armorer's Primary Tool
            ItemPatchCategoryByUICategory[17] = 1; // Armorer's Secondary Tool
            ItemPatchCategoryByUICategory[18] = 1; // Goldsmith's Primary Tool
            ItemPatchCategoryByUICategory[19] = 1; // Goldsmith's Secondary Tool
            ItemPatchCategoryByUICategory[20] = 1; // Leatherworker's Primary Tool
            ItemPatchCategoryByUICategory[21] = 1; // Leatherworker's Secondary Tool
            ItemPatchCategoryByUICategory[22] = 1; // Weaver's Primary Tool
            ItemPatchCategoryByUICategory[23] = 1; // Weaver's Secondary Tool
            ItemPatchCategoryByUICategory[24] = 1; // Alchemist's Primary Tool
            ItemPatchCategoryByUICategory[25] = 1; // Alchemist's Secondary Tool
            ItemPatchCategoryByUICategory[26] = 1; // Culinarian's Primary Tool
            ItemPatchCategoryByUICategory[27] = 1; // Culinarian's Secondary Tool
            ItemPatchCategoryByUICategory[28] = 2; // Miner's Primary Tool
            ItemPatchCategoryByUICategory[29] = 2; // Miner's Secondary Tool
            ItemPatchCategoryByUICategory[30] = 2; // Botanist's Primary Tool
            ItemPatchCategoryByUICategory[31] = 2; // Botanist's Secondary Tool
            ItemPatchCategoryByUICategory[32] = 2; // Fisher's Primary Tool
            ItemPatchCategoryByUICategory[33] = 2; // Fishing Tackle
            //ItemPatchCategoryByUICategory[34] = 34; // Head
            //ItemPatchCategoryByUICategory[35] = 35; // Body
            //ItemPatchCategoryByUICategory[36] = 36; // Legs
            //ItemPatchCategoryByUICategory[37] = 37; // Hands
            //ItemPatchCategoryByUICategory[38] = 38; // Feet
            //ItemPatchCategoryByUICategory[39] = 39; // Waist
            //ItemPatchCategoryByUICategory[40] = 40; // Necklace
            //ItemPatchCategoryByUICategory[41] = 41; // Earrings
            //ItemPatchCategoryByUICategory[42] = 42; // Bracelets
            //ItemPatchCategoryByUICategory[43] = 43; // Ring
            ItemPatchCategoryByUICategory[44] = 4; // Medicine
            ItemPatchCategoryByUICategory[45] = 5; // Ingredient
            ItemPatchCategoryByUICategory[46] = 6; // Meal
            ItemPatchCategoryByUICategory[47] = 7; // Seafood
            ItemPatchCategoryByUICategory[48] = 5; // Stone
            ItemPatchCategoryByUICategory[49] = 5; // Metal
            ItemPatchCategoryByUICategory[50] = 5; // Lumber
            ItemPatchCategoryByUICategory[51] = 5; // Cloth
            ItemPatchCategoryByUICategory[52] = 5; // Leather
            ItemPatchCategoryByUICategory[53] = 5; // Bone
            ItemPatchCategoryByUICategory[54] = 5; // Reagent
            ItemPatchCategoryByUICategory[55] = 8; // Dye
            ItemPatchCategoryByUICategory[56] = 5; // Part
            ItemPatchCategoryByUICategory[57] = 9; // Furnishing
            ItemPatchCategoryByUICategory[58] = 10; // Materia
            ItemPatchCategoryByUICategory[59] = 5; // Crystal
            ItemPatchCategoryByUICategory[60] = 5; // Catalyst
            ItemPatchCategoryByUICategory[61] = 5; // Miscellany
            //ItemPatchCategoryByUICategory[62] = 62; // Soul Crystal
            ItemPatchCategoryByUICategory[63] = 5; // Other
            ItemPatchCategoryByUICategory[64] = 9; // Construction Permit
            ItemPatchCategoryByUICategory[65] = 9; // Roof
            ItemPatchCategoryByUICategory[66] = 9; // Exterior Wall
            ItemPatchCategoryByUICategory[67] = 9; // Window
            ItemPatchCategoryByUICategory[68] = 9; // Door
            ItemPatchCategoryByUICategory[69] = 9; // Roof Decoration
            ItemPatchCategoryByUICategory[70] = 9; // Exterior Wall Decoration
            ItemPatchCategoryByUICategory[71] = 9; // Placard
            ItemPatchCategoryByUICategory[72] = 9; // Fence
            ItemPatchCategoryByUICategory[73] = 9; // Interior Wall
            ItemPatchCategoryByUICategory[74] = 9; // Flooring
            ItemPatchCategoryByUICategory[75] = 9; // Ceiling Light
            ItemPatchCategoryByUICategory[76] = 9; // Outdoor Furnishing
            ItemPatchCategoryByUICategory[77] = 9; // Table
            ItemPatchCategoryByUICategory[78] = 9; // Tabletop
            ItemPatchCategoryByUICategory[79] = 9; // Wall-mounted
            ItemPatchCategoryByUICategory[80] = 9; // Rug
            ItemPatchCategoryByUICategory[81] = 11; // Minion
            ItemPatchCategoryByUICategory[82] = 12; // Gardening
            ItemPatchCategoryByUICategory[83] = 10; // Demimateria
            ItemPatchCategoryByUICategory[84] = 0; // Rogue's Arm
            ItemPatchCategoryByUICategory[85] = 13; // Seasonal Miscellany
            ItemPatchCategoryByUICategory[86] = 14; // Triple Triad Card
            ItemPatchCategoryByUICategory[87] = 0; // Dark Knight's Arm
            ItemPatchCategoryByUICategory[88] = 0; // Machinist's Arm
            ItemPatchCategoryByUICategory[89] = 0; // Astrologian's Arm
            ItemPatchCategoryByUICategory[90] = 15; // Airship Hull
            ItemPatchCategoryByUICategory[91] = 15; // Airship Rigging
            ItemPatchCategoryByUICategory[92] = 15; // Airship Aftcastle
            ItemPatchCategoryByUICategory[93] = 15; // Airship Forecastle
            ItemPatchCategoryByUICategory[94] = 16; // Orchestrion Roll
            ItemPatchCategoryByUICategory[95] = 20; // Painting
            ItemPatchCategoryByUICategory[100] = 5; // Currency
            ItemPatchCategoryByUICategory[101] = 15; // Submersible Hull
            ItemPatchCategoryByUICategory[102] = 15; // Submersible Stern
            ItemPatchCategoryByUICategory[103] = 15; // Submersible Bow
            ItemPatchCategoryByUICategory[104] = 15; // Submersible Bridge
            ItemPatchCategoryByUICategory[105] = 0; // Blue Mage's Arm
            ItemPatchCategoryByUICategory[106] = 0; // Gunbreaker's Arm
            ItemPatchCategoryByUICategory[107] = 0; // Dancer's Arm
            ItemPatchCategoryByUICategory[108] = 0; // Reaper's Arm
            ItemPatchCategoryByUICategory[109] = 0; // Sage's Arm
            ItemPatchCategoryByUICategory[110] = 0; // Viper's Arm
            ItemPatchCategoryByUICategory[111] = 0; // Pictomancer's Arm
            ItemPatchCategoryByUICategory[112] = 3; // Outfits
        }

        public static void Initialize()
        {
            var patchData = (JArray)JsonConvert.DeserializeObject(File.ReadAllText(Config.PatchesPath));
            foreach (dynamic obj in patchData)
            {
                var type = (string)obj.type;
                var id = (string)obj.id;
                decimal patch = (decimal)obj.patch;


                ValueTuple<decimal, decimal> patchTuple = new (patch, 0);

                if (obj.namingPatch != null)
                {
                    decimal namingPatch = (decimal)obj.namingPatch;
                    patchTuple = new (patch, namingPatch);
                }

                if (!_patchesByIdByType.TryGetValue(type, out var patchesById))
                {
                    patchesById = new Dictionary<string, ValueTuple<decimal, decimal>>();
                    _patchesByIdByType[type] = patchesById;
                }

                patchesById[id] = patchTuple;
            }

        }

        public static decimal ResolvePriorPatch(ValueTuple<decimal, decimal> patchTuple)
        {
            if (patchTuple.Item2 != 0)
                return patchTuple.Item2;
            return patchTuple.Item1;
        }

        public static decimal Get(string type, int id)
        {
            return Get(type, id.ToString());
        }

        public static decimal Get(string type, string id)
        {
            if (_patchesByIdByType.TryGetValue(type, out var patchesById))
            {
                if (patchesById.TryGetValue(id, out var patch))
                    return ResolvePriorPatch(patch);
            }
            else
                _patchesByIdByType[type] = patchesById = new Dictionary<string, ValueTuple<decimal, decimal>>();

            System.Diagnostics.Debug.WriteLine("Patch not found for {0} {1}", type, id);
            _patchesChanged = true;

            patchesById[id] = new (GarlandDatabase.NextPatch, 0);
            return GarlandDatabase.NextPatch;
        }

        public static bool HasPatch(string type, string id)
        {
            if (_patchesByIdByType.TryGetValue(type, out var patchesById))
            {
                return patchesById.ContainsKey(id);
            }
            else return false;
        }

        public static void Set(string type, string id, decimal patch)
        {
            if (!_patchesByIdByType.TryGetValue(type, out var patchesById))
                _patchesByIdByType[type] = patchesById = new Dictionary<string, ValueTuple<decimal, decimal>>();

            patchesById[id] = new (patch, 0);
            _patchesChanged = true;
        }

        public static void SetNamingPatch(string type, string id, decimal patch)
        {
            if (!_patchesByIdByType.TryGetValue(type, out var patchesById))
                _patchesByIdByType[type] = patchesById = new Dictionary<string, ValueTuple<decimal, decimal>>();

            ValueTuple<decimal, decimal> newPatch = (patch, patch);
            if (patchesById.TryGetValue(id, out var oriPatch))
            {
                newPatch = (oriPatch.Item1, patch);
            }
            patchesById[id] = newPatch;
            _patchesChanged = true;
        }

        public static void VerifyNamingPatch(MySqlConnection conn, dynamic obj, string type)
        {
            var sql = $"SELECT Json FROM DataJson WHERE Id = '{obj.id}' AND Type = '{type}' AND Lang = 'chs' ORDER BY Version DESC LIMIT 1";
            var json = (string)SqlDatabase.ExecuteScalar(conn, sql);
            if (json != null)
            {
                dynamic originalObject = JsonConvert.DeserializeObject(json);
                originalObject = originalObject[type];

                if ((originalObject.name == "" || originalObject.name == null) && (obj.chs.name != "" && obj.chs.name != null))
                {
                    PatchDatabase.SetNamingPatch(type, obj.id.ToString(), GarlandDatabase.NextPatch);
                }
            }
            else if (PatchDatabase.HasPatch(type, obj.id.ToString()))
            {
                PatchDatabase.SetNamingPatch(type, obj.id.ToString(), GarlandDatabase.NextPatch);
            }
        }

        public static void WritePatchLists(JsOutput jsout, UpdatePackage update, string lang)
        {
            //if (!_patchesChanged)
            //    return;

            foreach (var majorPatch in GarlandDatabase.MajorPatches)
            {
                var majorPatchEnd = majorPatch.Id + .1m;

                // Collect data.
                var idsByTypeByPatch = new Dictionary<decimal, Dictionary<string, List<string>>>();
                foreach (var typePair in _patchesByIdByType)
                {
                    foreach (var idPair in typePair.Value)
                    {
                        foreach (var patcho in new decimal[] { idPair.Value.Item1, idPair.Value.Item2 })
                        {
                            decimal patch = (decimal)patcho;

                            if (patch < majorPatch.Id || patch >= majorPatchEnd)
                                continue;

                            if (!idsByTypeByPatch.TryGetValue(patch, out var idsByType))
                            {
                                idsByType = new Dictionary<string, List<string>>();
                                idsByTypeByPatch[patch] = idsByType;
                            }

                            if (!idsByType.TryGetValue(typePair.Key, out var ids))
                            {
                                ids = new List<string>();
                                idsByType[typePair.Key] = ids;
                            }

                            ids.Add(idPair.Key);
                        }
                        
                    }
                }

                // Write it out.
                dynamic root = new JObject();
                root.patch = new JObject();
                root.patch.id = majorPatch.FormattedId;
                root.patch.name = majorPatch.Name;
                root.patch.series = majorPatch.Series;

                var patches = new JObject();
                root.patch.patches = patches;

                foreach (var patchPair in idsByTypeByPatch)
                {
                    var patch = new JObject();
                    foreach (var typePair in patchPair.Value)
                    {
                        var list = new JArray();
                        foreach (var id in typePair.Value)
                        {
                            var partial = GetPartial(jsout, typePair.Key, lang, id);
                            if (partial != null)
                                list.Add(partial);
                        }
                        patch[typePair.Key] = list;
                    }

                    var patchKey = patchPair.Key;
                    var patchKeyStr = Math.Floor(patchKey) == patchKey ? patchPair.Key.ToString("0.0", new CultureInfo("en-US", false)) : patchPair.Key.ToString(new CultureInfo("en-US", false));
                    patches[patchKeyStr] = patch;
                }

                var contents = JsonConvert.SerializeObject(root);
                update.IncludeDocument(majorPatch.FormattedId, "patch", lang, 2, contents);
            }
        }

        static JObject GetPartial(JsOutput jsout, string type, string lang, string id)
        {
            var partial = jsout.GetPartialOrNull(type, lang, id.ToString());
            if (partial == null)
                return null;

            if (type == "item")
            {
                // Stupid hack - need to ensure all item keys are strings to remove!
                if (int.TryParse(id, out var idNum))
                    partial["g"] = GarlandDatabase.Instance.ItemsById[idNum].patchCategory;
                else
                    partial["g"] = GarlandDatabase.Instance.ItemsById[id].patchCategory;
            }

            return partial;
        }

        public static void WriteMasterPatchList()
        {
            var patches = new JArray();
            foreach (var typePair in _patchesByIdByType.OrderBy(p => p.Key))
            {
                foreach (var idPair in typePair.Value.OrderBy(p => p.Key))
                {
                    dynamic item = new JObject();
                    item.type = typePair.Key;
                    item.id = idPair.Key;
                    item.patch = idPair.Value.Item1;
                    if (idPair.Value.Item2 != 0)
                        item.namingPatch = idPair.Value.Item2;
                    patches.Add(item);
                }
            }

            if (!Directory.Exists("output"))
                Directory.CreateDirectory("output");

            var contents = JsonConvert.SerializeObject(patches);
            contents = contents.Replace("},", "},\r\n");

            if (!Directory.Exists(Config.SupplementalPath))
                Directory.CreateDirectory(Config.SupplementalPath);

            File.WriteAllText(Config.PatchesPath, contents, Encoding.UTF8);
        }

        public static int GetPatchCategory(SaintCoinach.Xiv.Item item)
        {
            if (Hacks.IsItemSkipped(item.Name, item.Key))
                return -1;

            if (item.ItemAction is SaintCoinach.Xiv.ItemActions.MountUnlock)
                return 17;

            if (item.ItemAction is SaintCoinach.Xiv.ItemActions.CompanionUnlock)
                return 11;

            var equipment = item as SaintCoinach.Xiv.Items.Equipment;

            // PvP Equipment
            if (equipment != null && equipment.IsPvP)
                return 18;

            // Fixed categories
            if (ItemPatchCategoryByUICategory.TryGetValue(item.ItemUICategory.Key, out var category))
                return category;

            // Equipment by parameters
            if (equipment != null)
            {
                // Check parameters for accessories.
                foreach (var param in equipment.AllParameters)
                {
                    var attrCategory = GetAttributePatchCategory(param.BaseParam);
                    if (attrCategory != null && attrCategory.Value != 19)
                        return attrCategory.Value;
                }

                // Remaining soul crystals
                if (equipment.ItemUICategory.Key == 62)
                    return 0;

                // No discernable parameters - Glamour.
                return 3;
            }

            // If you're reading this update the ItemPatchCategoryByUICategory map at the top of this file.
            throw new NotImplementedException($"Unknown patch category for {item.Name} ({item.Key}), ItemUICategory {item.ItemUICategory.Key}");
        }

        public static int? GetAttributePatchCategory(SaintCoinach.Xiv.BaseParam param)
        {
            switch (param.Key)
            {
                case 1: // Strength
                case 2: // Dexterity
                case 3: // Vitality
                case 4: // Intelligence
                case 5: // Mind
                case 6: // Piety
                case 19: // Tenacity
                case 22: // Direct Hit Rate
                case 27: // Critical Rate
                case 44: // Determination
                case 45: // Skill Speed
                case 46: // Spell Speed
                    return 0; // DoW / DoM

                case 11:
                case 70:
                case 71:
                    return 1; // DoH

                case 10:
                case 72:
                case 73:
                    return 2; // DoL

                case 57: // Slow Resist
                case 60: // Silence Resist
                case 61: // Blind Resist
                case 62: // Poison Resist
                case 63: // Stun Resist
                case 64: // Sleep Resist
                case 65: // Bind Resist
                case 66: // Heavy Resist
                    return 18; // PvP

                case 37:
                case 38:
                case 39:
                case 40:
                case 41:
                case 42:
                    return 19; // Elemental
            }

            return null;
        }
    }
}
