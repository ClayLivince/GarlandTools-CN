using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SaintCoinach.Imaging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Saint = SaintCoinach.Xiv;

namespace Garland.Data.Modules
{
    public class FishingSpots : Module
    {
        Dictionary<string, dynamic> _baitByName = new Dictionary<string, dynamic>();
        Dictionary<string, dynamic> _fishingSpotsByName = new Dictionary<string, dynamic>();
        Dictionary<string, dynamic> _fishingSpotsByEnName = new Dictionary<string, dynamic>();
        List<dynamic> _fishItems = new List<dynamic>();

        string[] _comma = new string[] { ", " };

        Dictionary<string, Tuple<int, int, int>> _hackFishingSpotLocations = new Dictionary<string, Tuple<int, int, int>>()
        {
            // Diadem fishing spots have no set coordinates.
            ["云冠洞穴"] = Tuple.Create(1647, 14, 34), // 158
            ["云冠西南池"] = Tuple.Create(1647, 8, 30), // 149
            ["云冠西北池"] = Tuple.Create(1647, 10, 9), // 151
            ["狂风云海"] = Tuple.Create(1647, 31, 11), // 152
            ["无风云海"] = Tuple.Create(1647, 28, 33), // 153
            ["旋风云海"] = Tuple.Create(1647, 13, 24), // 154
            ["摇风云海"] = Tuple.Create(3444, 30, 16), // 
            ["息风云海"] = Tuple.Create(3444, 1, 1), // 

            ["多玛飞地"] = Tuple.Create(2813, 8, 5), // 

            ["加拉迪翁湾外海"] = Tuple.Create(3444, 11, 11), // 237
            ["加拉迪翁湾外海幻海流"] = Tuple.Create(3444, 11, 11), // 238
            ["梅尔托尔海峡南"] = Tuple.Create(3445, 11, 11), // 239
            ["梅尔托尔海峡南幻海流"] = Tuple.Create(3445, 11, 11), // 240
            ["罗塔诺海海面"] = Tuple.Create(3447, 11, 11), // 241
            ["罗塔诺海海面幻海流"] = Tuple.Create(3447, 11, 11), // 242
            ["梅尔托尔海峡北"] = Tuple.Create(3446, 11, 11), // 243
            ["梅尔托尔海峡北幻海流"] = Tuple.Create(3446, 11, 11), // 244
            ["谢尔达莱群岛近海"] = Tuple.Create(3641, 11, 11), // 246
            ["谢尔达莱群岛近海幻海流"] = Tuple.Create(3641, 11, 11), // 247
            ["绯汐海近海"] = Tuple.Create(3642, 11, 11), // 248
            ["绯汐海近海幻海流"] = Tuple.Create(3642, 11, 11), // 249
            ["罗斯利特湾近海"] = Tuple.Create(3643, 11, 11), // 250
            ["罗斯利特湾近海幻海流"] = Tuple.Create(3643, 11, 11), // 251

        };

        HashSet<int> _hackExcludedFishingSpots = new HashSet<int>() {
            // Legacy Diadem fishing spots.
            147, 150
        };

        Dictionary<string, int> _statusesByName = new Dictionary<string, int>()
        {
            ["Salvage"] = 1172,
            ["Truth of Oceans"] = 1173,
            ["Fisher's Intuition"] = 568,
            ["Spearfisher's Intuition"] = 2891,
        };

        public override string Name => "Fish";

        public override void Start()
        {
            BuildFishingSpots();
            BuildFish();
            BuildSupplementalFishData();
            BuildSupplementalSpearfishData();
            BuildBaitChains();
        }

        dynamic BuildBait(string baitName)
        {
            if (_baitByName.TryGetValue(baitName, out var bait))
                return bait;

            dynamic item = null;
            try
            {
                item = GarlandDatabase.Instance.ItemsByName[baitName];
            }
            catch (KeyNotFoundException)
            {
                item = GarlandDatabase.Instance.ItemsByEnName[baitName];
            }


            bait = new JObject();
            bait.name = item.chs.name;
            bait.id = item.id;
            bait.icon = item.icon;

            if (item.category == 47) // Seafood
                bait.mooch = 1;
            else if (item.category != 33) // Fishing tackle
                throw new InvalidOperationException("Bad bait.");

            _builder.Db.Baits.Add(bait);
            _baitByName[baitName] = bait;
            return bait;
        }

        void BuildFish()
        {
            Dictionary<int, Saint.FishParameter> iFishParameterIndex = new Dictionary<int, Saint.FishParameter>();
            Dictionary<int, Saint.SpearfishingItem> iSpearfishingItemIndex = new Dictionary<int, Saint.SpearfishingItem>();
            foreach (var iFishParameter in _builder.InterSheet<Saint.FishParameter>())
            {
                iFishParameterIndex[iFishParameter.Key] = iFishParameter;
            }
            foreach (var iSpearfishingItem in _builder.InterSheet<Saint.SpearfishingItem>())
            {
                iSpearfishingItemIndex[iSpearfishingItem.Key] = iSpearfishingItem;
            }

            foreach (var sFishParameter in _builder.Sheet<Saint.FishParameter>())
            {
                var fishNoteInfo = _builder.Sheet("FishingNoteInfo").First(row =>
                {
                    return row.Key == sFishParameter.Key;
                });

                if (!iFishParameterIndex.TryGetValue(sFishParameter.Key, out var iFishParameter))
                {
                    DatabaseBuilder.PrintLine($"iFishParameter {sFishParameter.Key}, {sFishParameter.Text} not found.");
                    continue;
                }

                var guideText = sFishParameter.Text.ToString();
                if (string.IsNullOrEmpty(guideText))
                    continue;

                var item = GarlandDatabase.Instance.ItemsById[sFishParameter.Item.Key];
                item.fish = new JObject();
                item.fish.guide = guideText;
                _builder.Localize.Column(item.fish, sFishParameter, iFishParameter, "Text", "guide", null);
                item.fish.icon = GetFishIcon((UInt16)sFishParameter.Item.GetRaw("Icon"));

                if (fishNoteInfo.As<Byte>("WeatherRestriction") > 0)
                    item.fish.weatherRestricted = 1;
                if (fishNoteInfo.As<Byte>("TimeRestriction") > 0)
                    item.fish.timeRestricted = 1;

                var sGatheringSubCategory = (Saint.GatheringSubCategory)sFishParameter["GatheringSubCategory"];
                if (sGatheringSubCategory != null && sGatheringSubCategory.Key > 0)
                {
                    item.fish.folklore = sGatheringSubCategory.Item.Key;
                    _builder.Db.AddReference(item, "item", (int)item.fish.folklore, false);

                    var folkloreItem = _builder.Db.ItemsById[sGatheringSubCategory.Item.Key];
                    if (folkloreItem.unlocks == null)
                        folkloreItem.unlocks = new JArray();
                    folkloreItem.unlocks.Add(sFishParameter.Item.Key);
                    _builder.Db.AddReference(folkloreItem, "item", sFishParameter.Item.Key, false);
                }
            }

            foreach (var sSpearfishingItem in _builder.Sheet<Saint.SpearfishingItem>())
            {
                var iSpearfishingItem = iSpearfishingItemIndex[sSpearfishingItem.Key];
                var guideText = sSpearfishingItem["Description"]?.ToString();
                if (string.IsNullOrEmpty(guideText))
                    continue;

                var sItem = (Saint.Item)sSpearfishingItem["Item"];
                var item = GarlandDatabase.Instance.ItemsById[sItem.Key];
                item.fish = new JObject();
                item.fish.guide = guideText;
                _builder.Localize.Column(item.fish, sSpearfishingItem, iSpearfishingItem, "Description", "guide");
                item.fish.icon = GetFishIcon((UInt16)sItem.GetRaw("Icon"));
            }
        }

        int GetFishIcon(UInt16 itemIconIndex)
        {
            // Replace 02 icon id with 07, eg. 029046 -> 079046 for fish rubbing image
            var fishIconIndex = itemIconIndex - 20000 + 70000;
            var icon = IconHelper.GetIcon(_builder.Realm.Packs, fishIconIndex);
            return IconDatabase.EnsureEntry("fish", icon);
        }

        void BuildSupplementalFishData()
        {
            dynamic currentFishingSpot = null;
            JArray currentFishingSpotItems = null;
            dynamic currentNode = null;
            JArray currentNodeItems = null;

            var lines = Utils.Tsv(Path.Combine(Config.SupplementalPath, "FFXIV Data - Fishing.tsv"));
            foreach (var rLine in lines.Skip(1))
            {
                // Line data
                var name = rLine[0].Trim();

                if (string.IsNullOrEmpty(name))
                    continue;

                if (name.StartsWith("#"))
                    continue;

                if (_fishingSpotsByEnName.TryGetValue(name, out var fishingSpot))
                {
                    currentNode = null;
                    currentNodeItems = null;
                    currentFishingSpot = fishingSpot;
                    currentFishingSpotItems = fishingSpot.items;
                    continue;
                }

                // Name may reference either fishing spot, spearfishing node, or fish - check here.
                if (_builder.Db.SpearfishingNodesByEnName.TryGetValue(name, out var node))
                {
                    currentFishingSpot = null;
                    currentFishingSpotItems = null;
                    currentNode = node;
                    currentNodeItems = node.items;
                    continue;
                }

                // Fish info
                var bait = rLine[1].Trim();
                var start = rLine[2].Trim();
                var end = rLine[3].Trim();
                var transition = rLine[4].Trim();
                var weather = rLine[5].Trim();
                var predator = rLine[6].Trim();
                var tug = rLine[7].Trim();
                var hookset = rLine[8].Trim();

                switch (hookset)
                {
                    case "Precision":
                        {
                            hookset = "精准提钩";
                            break;
                        }
                    case "Powerful":
                        {
                            hookset = "强力提钩";
                            break;
                        }
                }

                var gathering = rLine[9].Trim();
                var snagging = rLine[10].Trim();
                var fishEyes = rLine[11].Trim();
                var ff14anglerId = rLine[12].Trim();
                var note = rLine[13].Trim();

                Console.WriteLine(name);
                var itemID = 0;

                // Fill item fishing information.
                try
                {
                    var item = GetFishItem(name);

                    dynamic spot = new JObject();
                    if (currentFishingSpot != null)
                        spot.spot = currentFishingSpot.id;
                    else if (currentNode != null)
                        spot.node = currentNode.id;

                    // Sanity check weather and time restrictions.
                    // Sanity check only applies to normal fishing spots.  The
                    // fields aren't available for spearfishing yet.
                    if (currentFishingSpot != null)
                        CheckConditions(name, item.fish, ref weather, ref transition, ref start, ref end);

                    // Baits & Gigs
                    if (bait.Contains("Gig Head"))
                    {
                        if (spot.gig == null)
                            spot.gig = new JArray();
                        spot.gig.Add(bait);
                    }
                    else if (!string.IsNullOrEmpty(bait))
                    {
                        //bait = clayManager.getItemNameChs(bait.Trim());
                        spot.tmpBait = bait;

                        foreach (string possibleBaitRaw in bait.Split(','))
                        {
                            string possibleBait = possibleBaitRaw.Trim();
                            if (name == possibleBait)
                                continue;
                            // If not otherwise specified, fish should inherit the time
                            // and weather restrictions of restricted bait (like predators).
                            if (!_builder.Db.ItemsByEnName.TryGetValue(possibleBait, out var baitItem))
                                throw new InvalidOperationException($"Can't find bait {possibleBait} for {name} at {currentFishingSpot.en.name}.  Is the spelling correct?");

                            if (baitItem.fish != null)
                            {
                                dynamic baitSpotView = ((JArray)baitItem.fish?.spots)?.FirstOrDefault(s => s["spot"] == spot.spot && s["node"] == spot.node);
                                if (baitSpotView == null)
                                    throw new InvalidOperationException($"Can't find mooch {possibleBait} for {name} at {currentFishingSpot.en.name}.  Did you forget to add it to the spot?");

                                InheritConditions(spot, baitSpotView, weather, transition, start, end);
                            }
                        }
                    }

                    // Time restrictions
                    if (start != "" || end != "")
                    {
                        spot.during = new JObject();
                        if (start != "")
                            spot.during.start = int.Parse(start);
                        if (end != "")
                            spot.during.end = int.Parse(end);
                    }

                    // Weather restrictions
                    if (transition != "")
                    {
                        var transitionList = transition.Split(_comma, StringSplitOptions.None);
                        for (int i = 0; i < transitionList.Length; i++)
                        {
                            transitionList[i] = _builder.Db.WeatherByEnName[transitionList[i]];
                        }
                        CheckWeather(transitionList);
                        spot.transition = new JArray(transitionList);
                    }

                    if (weather != "")
                    {
                        var weatherList = weather.Split(_comma, StringSplitOptions.None);
                        for (int i = 0; i < weatherList.Length; i++)
                        {
                            weatherList[i] = _builder.Db.WeatherByEnName[weatherList[i]];
                        }
                        CheckWeather(weatherList);
                        spot.weather = new JArray(weatherList);
                    }

                    // Predators
                    if (predator != "")
                    {
                        var tokens = predator.Split(_comma, StringSplitOptions.None);
                        spot.predator = new JArray();
                        for (var i = 0; i < tokens.Length; i += 2)
                        {
                            var predatorName = tokens[i];
                            //var predatorID = clayManager.getItemID(predatorName);
                            spot.predator.Add(BuildPredator(predatorName, tokens[i + 1]));

                            // If not otherwise specified, fish should inherit the time
                            // and weather restrictions of restricted predators (like bait).
                            var predatorItem = _builder.Db.ItemsByEnName[predatorName];
                            //var predatorItem = _builder.Db.ItemsById[predatorID];
                            if (predatorItem.fish != null)
                            {
                                var predatorSpots = (JArray)predatorItem.fish.spots;
                                dynamic predatorSpotView = predatorSpots.FirstOrDefault(s => s["spot"] == spot.spot && s["node"] == spot.node);
                                if (predatorSpotView == null)
                                {
                                    // Predators for spearfishing nodes may not exist on this spot/node.
                                    // Fallback to any available spot.
                                    predatorSpotView = predatorSpots.FirstOrDefault();
                                    if (predatorSpotView == null)
                                        throw new InvalidOperationException($"Can't find predator view for {name} predator {predatorName}.");
                                }

                                InheritConditions(spot, predatorSpotView, weather, transition, start, end);
                            }
                        }
                    }

                    // Other properties.
                    if (hookset != "")
                        spot.hookset = hookset;
                    if (tug != "")
                    {
                        switch (tug)
                        {
                            case "!":
                            case "Light":
                                spot.tug = "轻杆";
                                break;
                            case "!!":
                            case "Medium":
                                spot.tug = "中杆";
                                break;
                            case "!!!":
                            case "Heavy":
                                spot.tug = "重杆";
                                break;
                            default:
                                spot.tug = tug;
                                break;
                        }
                    }
                    if (gathering != "")
                        spot.gatheringReq = int.Parse(gathering);
                    if (snagging != "")
                        spot.snagging = 1;
                    if (fishEyes != "")
                        spot.fishEyes = 1;
                    if (ff14anglerId != "")
                        spot.ff14anglerId = int.Parse(ff14anglerId);
                    if (note != "")
                        spot.note = note;

                    // Add the fish to this gathering point if it's not otherwise there.

                    if (currentFishingSpot != null && !currentFishingSpotItems.Any(i => (int)i["id"] == (int)item.id))
                    {
                        if (item.fishingSpots == null)
                            item.fishingSpots = new JArray();
                        item.fishingSpots.Add(currentFishingSpot.id);

                        dynamic obj = new JObject();
                        obj.id = item.id;
                        obj.lvl = item.ilvl;
                        currentFishingSpot.items.Add(obj);
                        _builder.Db.AddReference(currentFishingSpot, "item", (int)item.id, false);
                        _builder.Db.AddReference(item, "fishing", (int)currentFishingSpot.id, true);
                    }

                    if (currentNode != null && !currentNodeItems.Any(i => (int)i["id"] == (int)item.id))
                    {
                        if (item.nodes == null)
                            item.nodes = new JArray();
                        item.nodes.Add(currentNode.id);

                        dynamic obj = new JObject();
                        obj.id = item.id;
                        currentNodeItems.Add(obj);
                        _builder.Db.AddReference(currentNode, "item", (int)item.id, false);
                        _builder.Db.AddReference(item, "node", (int)currentNode.id, true);
                    }

                    item.fish.spots.Add(spot);
                }
                catch (KeyNotFoundException e)
                {
                    DatabaseBuilder.PrintLine($"No item found with name {name}.");
                }
            }
        }

        dynamic GetFishItem(string itemName)
        {
            var item = GarlandDatabase.Instance.ItemsByEnName[itemName];
            _fishItems.Add(item);
            // Some quest fish may not have been previously recognized as a fish.
            if (item.fish == null)
                item.fish = new JObject();

            if (item.fish.spots == null)
                item.fish.spots = new JArray();

            return item;
        }

        void BuildSupplementalSpearfishData()
        {
            dynamic currentNode = null;
            JArray currentNodeItems = null;

            var lines = Utils.Tsv(Path.Combine(Config.SupplementalPath, "FFXIV Data - Spearfishing.tsv"));
            foreach (var rLine in lines.Skip(1))
            {

                // Line data
                var name = rLine[0].Trim();

                if (string.IsNullOrEmpty(name))
                    continue;

                if (name.StartsWith("#"))
                    continue;

                var buff = rLine[7].Trim();
                var unlock = rLine[8].Trim();

                // Name may reference either fishing spot, spearfishing node, or fish - check here.
                if (_builder.Db.SpearfishingNodesByEnName.TryGetValue(name, out var node))
                {
                    currentNode = node;
                    currentNodeItems = node.items;
                    BuildBuffAndUnlockRequirements(node, "node", node.id.ToString(), unlock, buff);
                    continue;
                }
                try
                {
                    // Fish info
                    var shadow = rLine[1].Trim();
                    var speed = rLine[2].Trim();
                    var start = rLine[3].Trim();
                    var end = rLine[4].Trim();
                    var transition = rLine[5].Trim();
                    var weather = rLine[6].Trim();
                    var note = rLine[9].Trim();

                    dynamic item = GetFishItem(name);

                    dynamic spot = new JObject();
                    if (currentNode != null)
                        spot.node = currentNode.id;

                    // Shadow and Speed
                    if (shadow != "")
                    {
                        spot.shadow = shadow;
                    }
                    if (speed != "")
                    {
                        if (speed.StartsWith("V. "))
                            speed = speed.Replace("V. ", "Very ");

                        spot.speed = speed;
                    }

                    // Time restrictions
                    if (start != "" || end != "")
                    {
                        spot.during = new JObject();
                        if (start != "")
                            spot.during.start = int.Parse(start);
                        if (end != "")
                            spot.during.end = int.Parse(end);
                    }

                    // Weather restrictions
                    if (transition != "")
                    {
                        var transitionList = transition.Split(_comma, StringSplitOptions.None);
                        CheckWeather(transitionList);
                        spot.transition = new JArray(transitionList);
                    }

                    if (weather != "")
                    {
                        var weatherList = weather.Split(_comma, StringSplitOptions.None);
                        CheckWeather(weatherList);
                        spot.weather = new JArray(weatherList);
                    }

                    BuildBuffAndUnlockRequirements(spot, "item", item.id.ToString(), unlock, buff);

                    // Note
                    if (note != "")
                    {
                        item.fish.note = note;
                    }

                    if (currentNode != null && !currentNodeItems.Any(i => (int)i["id"] == (int)item.id))
                    {
                        if (item.nodes == null)
                            item.nodes = new JArray();
                        item.nodes.Add(currentNode.id);

                        dynamic obj = new JObject();
                        obj.id = item.id;
                        currentNodeItems.Add(obj);
                        _builder.Db.AddReference(currentNode, "item", (int)item.id, false);
                        _builder.Db.AddReference(item, "node", (int)currentNode.id, true);
                    }

                    item.fish.spots.Add(spot);
                }
                catch (KeyNotFoundException e)
                {
                    DatabaseBuilder.PrintLine($"No item found with name {name}.");
                }

            }
        }

        void BuildBuffAndUnlockRequirements(dynamic sealedObject, string sealedObjectType,
                                string sealedObjectId, string unlock, string buff)
        {
            if (unlock != "")
            {
                try
                {
                    var conditions = unlock.Split(_comma, StringSplitOptions.None);

                    var jUnlock = new JArray();
                    foreach (string condition in conditions)
                    {
                        string[] frags = condition.Split(':');
                        string unlockItemName = frags[0].Trim();
                        int unlockItemQty = int.Parse(frags[1], System.Globalization.NumberStyles.Integer);

                        dynamic nodeUnlock = new JObject();
                        var unlockItem = _builder.Db.ItemsByEnName[unlockItemName.Trim()];
                        nodeUnlock.id = unlockItem.id;
                        nodeUnlock.amount = unlockItemQty;
                        _builder.Db.AddReference(sealedObject, "item", (int)unlockItem.id, true);
                        _builder.Db.AddReference(unlockItem, sealedObjectType, sealedObjectId, false);
                        jUnlock.Add(nodeUnlock);
                    }

                    if (jUnlock.Count > 0)
                    {
                        sealedObject.predator = jUnlock;
                    }
                }
                catch (Exception unlockEx)
                {
                    DatabaseBuilder.PrintLine($"Error occurred when building unlock of {sealedObject}.");
                }
            }

            if (buff != "")
            {
                try
                {
                    _statusesByName.TryGetValue(buff, out int statusId);
                    _builder.Db.StatusesById.TryGetValue(statusId, out var status);

                    if (status != null)
                    {
                        sealedObject.buff = status.id;
                        _builder.Db.AddReference(sealedObject, "status", status.id.ToString(), true);
                    }
                }
                catch (Exception buffEx)
                {
                    DatabaseBuilder.PrintLine($"Error occurred when building required buff of {sealedObject}.");
                }

            }
        }

        void InheritConditions(dynamic spot, dynamic inheritSpot, string weather, string transition, string start, string end)
        {
            if (weather == "" && inheritSpot.weather != null)
                spot.weather = new JArray(inheritSpot.weather);
            if (transition == "" && inheritSpot.transition != null)
                spot.transition = new JArray(inheritSpot.transition);
            if (start == "" && end == "" && inheritSpot.during != null)
                spot.during = new JObject(inheritSpot.during);
        }

        void CheckConditions(string name, dynamic fish, ref string weather, ref string transition, ref string start, ref string end)
        {
            bool isTimeRestricted = fish.timeRestricted == 1;
            bool isWeatherRestricted = fish.weatherRestricted == 1;

            if (start == "N/A")
            {
                if (isTimeRestricted)
                    DatabaseBuilder.PrintLine($"{name} has time restrictions but N/A for start time.");
                else
                    start = "";
            }

            if (end == "N/A")
            {
                if (isTimeRestricted)
                    DatabaseBuilder.PrintLine($"{name} has time restrictions but N/A for end time.");
                else
                    end = "";
            }

            if (weather == "N/A")
            {
                if (isWeatherRestricted)
                    DatabaseBuilder.PrintLine($"{name} has weather restrictions but N/A for weather.");
                else
                    weather = "";
            }

            if (transition == "N/A")
            {
                if (isWeatherRestricted)
                    DatabaseBuilder.PrintLine($"{name} has weather restrictions but N/A for transition.");
                else
                    transition = "";
            }

            if (!isTimeRestricted && start != "")
            {
                DatabaseBuilder.PrintLine($"{name} has no time restrictions, but start is {start}.");
                start = "";
            }

            if (!isTimeRestricted && end != "")
            {
                DatabaseBuilder.PrintLine($"{name} has no time restrictions, but end is {end}.");
                end = "";
            }

            if (!isWeatherRestricted && transition != "")
            {
                DatabaseBuilder.PrintLine($"{name} has no weather restrictions, but transition is {transition}.");
                transition = "";
            }

            if (!isWeatherRestricted && weather != "")
            {
                DatabaseBuilder.PrintLine($"{name} has no weather restrictions, but weather is {weather}.");
                weather = "";
            }
        }

        void BuildBaitChains()
        {
            foreach (var item in _fishItems)
            {
                foreach (var spot in item.fish.spots)
                {
                    if (spot.tmpBait == null || spot.spot == null)
                        continue;

                    spot.baits = new JArray();
                    List<List<string>> baitChains = new List<List<string>>();

                    foreach (string possibleBaitRaw in spot.tmpBait.Value.Split(','))
                    {
                        string possibleBait = possibleBaitRaw.Trim();
                        List<string> baitNames = new List<string>();
                        var baitObj = BuildBait(possibleBait);
                        dynamic bait = new JArray();
                        foreach (var baitChain in GetBaitChains(spot, baitObj))
                        {
                            baitNames.Add((string)baitChain.name);
                            bait.Add((int)baitChain.id);
                            _builder.Db.AddReference(item, "item", (int)baitChain.id, false);
                        }

                        spot.baits.Add(bait);
                        baitChains.Add(baitNames);
                    }

                    var fishingSpot = _builder.Db.FishingSpotsById[(int)spot.spot];
                    _builder.Db.Fish.Add(BuildFishView(item, spot, fishingSpot, baitChains));

                    spot.Remove("tmpBait");
                }
            }
        }

        IEnumerable<dynamic> GetBaitChains(dynamic spot, dynamic baitObj)
        {
            if (baitObj.mooch != null)
            {
                var baitFishItem = _builder.Db.ItemsById[(int)baitObj.id];
                foreach (var baitSpot in baitFishItem.fish.spots)
                {
                    if (baitSpot.spot != spot.spot || baitSpot.node != baitSpot.node)
                        continue;

                    if (baitSpot.tmpBait != null)
                    {
                        var subBait = BuildBait(((string)baitSpot.tmpBait).Split(',')[0].Trim());
                        foreach (var subBaitChain in GetBaitChains(baitSpot, subBait))
                            yield return subBaitChain;
                    }
                    else
                    {
                        foreach (var subBaitId in baitSpot.baits[0])
                        {
                            var subBaitFishItem = _builder.Db.ItemsById[(int)subBaitId];
                            yield return BuildBait((string)subBaitFishItem.chs.name);
                        }
                    }
                }
            }

            yield return baitObj;
        }

        void CheckWeather(string[] weatherList)
        {
            if (!weatherList.All(w => _builder.Db.Weather.Contains(w)))
                throw new InvalidOperationException($"Bad weather list: {string.Join(", ", weatherList)}");
        }

        dynamic BuildPredator(string name, string amount)
        {
            dynamic obj = new JObject();
            obj.id = (int)GarlandDatabase.Instance.ItemsByEnName[name].id;
            obj.amount = int.Parse(amount);
            return obj;
        }

        dynamic BuildPredatorView(dynamic fishItem, dynamic spotView, dynamic predator)
        {
            var predatorItem = GarlandDatabase.Instance.ItemsById[(int)predator.id];

            if (predatorItem.fish == null)
                throw new InvalidOperationException("Predator " + predatorItem.chs.name + " has no fishing data.");

            dynamic view = new JObject();
            view.name = predatorItem.chs.name;
            view.predatorAmount = predator.amount;

            // Find the fishing spot for this predator that matches the current spot.
            dynamic predatorSpot = ((JArray)predatorItem.fish.spots).First(s => s["spot"] == spotView.spot);
            view.bait = new JArray();
            foreach (var baitId in predatorSpot.baits[0])
            {
                var bait = GarlandDatabase.Instance.ItemsById[(int)baitId];
                view.bait.Add(bait.chs.name);
                GarlandDatabase.Instance.AddReference(fishItem, "item", (int)baitId, false);
            }

            view.id = predatorItem.id;
            view.icon = predatorItem.icon;

            GarlandDatabase.Instance.AddReference(fishItem, "item", (int)predatorItem.id, false);
            return view;
        }

        dynamic BuildFishView(dynamic item, dynamic spotView, dynamic fishingSpot, List<List<string>> baitChains)
        {
            // Convert item fish data into a view for Bell/ffxivfisher.
            dynamic view = new JObject();

            view.name = item.chs.name;
            view.patch = item.patch;

            if (spotView.snagging != null)
                view.snagging = 1;

            if (item.fish.folklore != null)
                view.folklore = 1;

            if (spotView.fishEyes != null)
                view.fishEyes = 1;

            view.baits = JArray.FromObject(baitChains);

            if (spotView.during != null)
                view.during = spotView.during;

            if (spotView.predator != null)
            {
                view.predator = new JArray();
                foreach (var predator in spotView.predator)
                {
                    view.predator.Add(BuildPredatorView(item, spotView, predator));
                }
            }

            if (spotView.weather != null)
                view.weather = spotView.weather;

            if (spotView.transition != null)
                view.transition = spotView.transition;

            if (spotView.hookset != null)
                view.hookset = spotView.hookset;

            if (spotView.tug != null)
                view.tug = spotView.tug;

            view.id = item.id;
            view.icon = item.icon;
            view.func = "fish";
            view.rarity = item.rarity;

            view.title = fishingSpot.chs.name;
            view.category = GetFishingSpotCategoryName((int)fishingSpot.category);
            view.spot = (int)spotView.spot;
            view.lvl = fishingSpot.lvl;

            if (fishingSpot.x != null)
            {
                var x = (double)fishingSpot.x;
                var y = (double)fishingSpot.y;
                view.coords = new JArray(x, y);
                view.radius = fishingSpot.radius;
            }

            var location = GarlandDatabase.Instance.LocationsById[(int)fishingSpot.zoneid];
            view.zone = MapZoneName((string)location.name);

            return view;
        }

        string MapZoneName(string name)
        {
            switch (name)
            {
                case "格里达尼亚旧街":
                case "格里达尼亚新街":
                    return "格里达尼亚";

                case "利姆萨·罗敏萨下层甲板":
                case "利姆萨·罗敏萨上层甲板":
                    return "利姆萨·罗敏萨";
            }

            return name;
        }

        void BuildFishingSpots()
        {
            Dictionary<int, Saint.FishingSpot> iFishingSpotById = new Dictionary<int, Saint.FishingSpot>();
            foreach (var iFishingSpot in _builder.InterSheet<Saint.FishingSpot>())
                iFishingSpotById[iFishingSpot.Key] = iFishingSpot;

            foreach (var sFishingSpot in _builder.Sheet<Saint.FishingSpot>())
            {
                if (sFishingSpot.Key <= 1 || sFishingSpot.GatheringLevel == 0 || sFishingSpot.PlaceName == null)
                    continue; // Skip

                if (_hackExcludedFishingSpots.Contains(sFishingSpot.Key))
                    continue;

                if (sFishingSpot.PlaceName.Name.ToString().Length == 0)
                    continue;

                iFishingSpotById.TryGetValue(sFishingSpot.Key, out var iFishingSpot);

                var name = Utils.Capitalize(sFishingSpot.PlaceName.Name.ToString());
                var iName = iFishingSpot == null ? name : Utils.Capitalize(iFishingSpot.PlaceName.Name.ToString());

                dynamic spot = new JObject();
                spot.id = sFishingSpot.Key;
                _builder.Localize.Column(spot, sFishingSpot, iFishingSpot, "PlaceName", "name");
                spot.patch = PatchDatabase.Get("fishing", sFishingSpot.Key);
                spot.category = sFishingSpot.FishingSpotCategory - 1;
                spot.lvl = sFishingSpot.GatheringLevel;
                spot.radius = sFishingSpot.Radius;

                // Skipping ocean fishing for now
                if (sFishingSpot.TerritoryType != null && sFishingSpot.TerritoryType.Map.Key != 604)
                {
                    var locationInfo = _builder.LocationInfoByMapId[sFishingSpot.TerritoryType.Map.Key];
                    spot.x = Math.Round(sFishingSpot.MapX, 2);
                    spot.y = Math.Round(sFishingSpot.MapY, 2);

                    spot.zoneid = sFishingSpot.TerritoryType.Map.PlaceName.Key;
                    _builder.Db.AddLocationReference(sFishingSpot.TerritoryType.Map.PlaceName.Key);
                }
                else if (_hackFishingSpotLocations.TryGetValue(name, out var locationInfo))
                {
                    spot.zoneid = locationInfo.Item1;
                    spot.x = locationInfo.Item2;
                    spot.y = locationInfo.Item3;
                    spot.approx = 1;

                    if (sFishingSpot.Radius == 0)
                        spot.radius = 300; // estimate

                    _builder.Db.AddLocationReference(locationInfo.Item1);
                }
                else
                    DatabaseBuilder.PrintLine($"No location for fishing spot [{sFishingSpot.Key}] {name}");

                spot.areaid = sFishingSpot.PlaceName.Key;
                _builder.Db.AddLocationReference(sFishingSpot.PlaceName.Key);

                JArray items = new JArray();
                foreach (var sItem in sFishingSpot.Items)
                {
                    try
                    {
                        var item = _builder.Db.ItemsById[sItem.Key];
                        if (item.fishingSpots == null)
                            item.fishingSpots = new JArray();
                        item.fishingSpots.Add(sFishingSpot.Key);

                        dynamic obj = new JObject();
                        obj.id = sItem.Key;
                        obj.lvl = sItem.ItemLevel.Key;
                        items.Add(obj);
                        _builder.Db.AddReference(spot, "item", sItem.Key, false);
                        _builder.Db.AddReference(item, "fishing", sFishingSpot.Key, true);
                    }
                    catch (KeyNotFoundException e)
                    {
                        Console.WriteLine("No item found for key" + sItem.Key.ToString());
                    }
                }
                spot.items = items;

                _builder.Db.FishingSpots.Add(spot);
                _builder.Db.FishingSpotsById[sFishingSpot.Key] = spot;

                _fishingSpotsByName[name] = spot;
                _fishingSpotsByEnName[iName] = spot;
            }
        }

        static string GetFishingSpotCategoryName(int key)
        {
            switch (key)
            {
                case 0: return "海洋垂钓";
                case 1: return "淡水垂钓";
                case 2: return "沙海垂钓";
                case 3: return "浮岛垂钓";
                case 4: return "云海垂钓";
                case 5: return "熔岩垂钓";
                case 6: return "魔泉垂钓";
                case 7: return "盐湖垂钓";
                case 8: return "星海垂钓";
                default: throw new NotImplementedException();
            }
        }
    }
}
