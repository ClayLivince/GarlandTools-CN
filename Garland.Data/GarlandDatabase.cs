using Garland.Data.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data
{
    public class GarlandDatabase
    {
        // NOTE: This section must be updated with every patch!
        public const decimal NextPatch = 6.11m;
        public const decimal GlobalPatch = 6.2m;
        public static Patch[] MajorPatches = new[] {
            new Patch(1m, "遗产", "遗产"),

            new Patch(2m, "重生之境", "重生之境"),
            new Patch(2.1m, "觉醒之境", "重生之境"),
            new Patch(2.2m, "混沌的漩涡", "重生之境"),
            new Patch(2.3m, "艾欧泽亚的守护者", "重生之境"),
            new Patch(2.4m, "寒冰的幻想", "重生之境"),
            new Patch(2.5m, "希望的灯火", "重生之境"),

            new Patch(3m, "苍穹之禁城", "苍穹之禁城"),
            new Patch(3.1m, "光与暗的分界", "苍穹之禁城"),
            new Patch(3.2m, "命运的齿轮", "苍穹之禁城"),
            new Patch(3.3m, "绝命怒嚎", "苍穹之禁城"),
            new Patch(3.4m, "灵魂继承者", "苍穹之禁城"),
            new Patch(3.5m, "命运的止境", "苍穹之禁城"),

            new Patch(4m, "红莲之狂潮", "红莲之狂潮"),
            new Patch(4.1m, "英雄归来", "红莲之狂潮"),
            new Patch(4.2m, "曙光微明", "红莲之狂潮"),
            new Patch(4.3m, "月下芳华", "红莲之狂潮"),
            new Patch(4.4m, "狂乱前奏", "红莲之狂潮"),
            new Patch(4.5m, "英雄挽歌", "红莲之狂潮"),

            new Patch(5m, "暗影之逆焰", "暗影之逆焰"),
            new Patch(5.1m, "纯白誓约，漆黑密约", "暗影之逆焰"),
            new Patch(5.2m, "追忆的凶星", "暗影之逆焰"),
            new Patch(5.3m, "水晶的残光", "暗影之逆焰"),
            new Patch(5.4m, "另一个未来", "暗影之逆焰"),
            new Patch(5.5m, "死斗至黎明", "暗影之逆焰"),

            new Patch(6m, "晓月之终途", "晓月之终途"),
            new Patch(6.1m, "崭新的冒险", "晓月之终途"),
        };

        public static int LevelCap = -1; // Filled in from Miscellaneous.
        public static int BlueMageLevelCap = 70;

        public HashSet<int> LocationReferences = new HashSet<int>();
        public Dictionary<object, List<DataReference>> DataReferencesBySource = new Dictionary<object, List<DataReference>>();
        public List<int> EmbeddedPartialItemIds = new List<int>();
        public List<dynamic> EmbeddedIngredientItems = new List<dynamic>();
        public HashSet<int> IgnoredCurrencyItemIds = new HashSet<int>();

        public List<dynamic> Items = new List<dynamic>();
        public List<dynamic> Mobs = new List<dynamic>();
        public List<dynamic> Locations = new List<dynamic>();
        public List<dynamic> iLocations = new List<dynamic>();
        public List<dynamic> Nodes = new List<dynamic>();
        public List<dynamic> NodeBonuses = new List<dynamic>();
        public List<dynamic> Npcs = new List<dynamic>();
        public List<dynamic> Instances = new List<dynamic>();
        public List<dynamic> Quests = new List<dynamic>();
        public List<dynamic> QuestJournalGenres = new List<dynamic>();
        public List<dynamic> FishingSpots = new List<dynamic>();
        public List<dynamic> Leves = new List<dynamic>();
        public List<dynamic> WeatherRates = new List<dynamic>();
        public List<string> Weather = new List<string>();
        public List<dynamic> Achievements = new List<dynamic>();
        public List<dynamic> AchievementCategories = new List<dynamic>();
        public List<dynamic> Fates = new List<dynamic>();
        public List<dynamic> DutyRoulette = new List<dynamic>();
        public List<dynamic> ItemCategories = new List<dynamic>();
        public List<dynamic> ItemSeries = new List<dynamic>();
        public List<dynamic> ItemSpecialBonus = new List<dynamic>();
        public List<dynamic> JobCategories = new List<dynamic>();
        public List<dynamic> Ventures = new List<dynamic>();
        public List<dynamic> Actions = new List<dynamic>();
        public List<dynamic> ActionCategories = new List<dynamic>();
        public List<dynamic> Baits = new List<dynamic>();
        public List<dynamic> Jobs = new List<dynamic>();
        public List<dynamic> Dyes = new List<dynamic>();
        public List<dynamic> Statuses = new List<dynamic>();

        public dynamic MateriaJoinRates;

        public Dictionary<string, JArray> LevelingEquipmentByJob = new Dictionary<string, JArray>();
        public Dictionary<string, JObject> EndGameEquipmentByJob = new Dictionary<string, JObject>();
        public Dictionary<int, int> ExperienceToNextByLevel = new Dictionary<int, int>();

        public Dictionary<object, dynamic> ItemsById = new Dictionary<object, dynamic>();
        public Dictionary<int, dynamic> NpcsById = new Dictionary<int, dynamic>();
        public Dictionary<int, dynamic> LeveRewardsById = new Dictionary<int, dynamic>();
        public Dictionary<int, dynamic> InstancesById = new Dictionary<int, dynamic>();
        public Dictionary<int, dynamic> ActionsById = new Dictionary<int, dynamic>();
        public Dictionary<int, dynamic> FishingSpotsById = new Dictionary<int, dynamic>();
        public Dictionary<int, dynamic> QuestsById = new Dictionary<int, dynamic>();
        public Dictionary<int, dynamic> LocationsById = new Dictionary<int, dynamic>();
        public Dictionary<string, int> LocationIdsByName = new Dictionary<string, int>();
        public Dictionary<string, int> LocationIdsByEnName = new Dictionary<string, int>();
        public Dictionary<string, dynamic> WeatherByEnName = new Dictionary<string, dynamic>();
        public Dictionary<string, dynamic> ItemsByName = new Dictionary<string, dynamic>();
        public Dictionary<string, dynamic> ItemsByEnName = new Dictionary<string, dynamic>();
        public Dictionary<int, List<dynamic>> ItemsByInstanceId = new Dictionary<int, List<dynamic>>();
        public Dictionary<int, List<dynamic>> ItemsBySeriesId = new Dictionary<int, List<dynamic>>();
        public Dictionary<int, dynamic> NodesById = new Dictionary<int, dynamic>();
        public Dictionary<string, dynamic> SpearfishingNodesByName = new Dictionary<string, dynamic>();
        public Dictionary<string, dynamic> SpearfishingNodesByEnName = new Dictionary<string, dynamic>();
        public Dictionary<int, dynamic> VenturesById = new Dictionary<int, dynamic>();
        public Dictionary<int, dynamic> StatusesById = new Dictionary<int, dynamic>();

        public Dictionary<SaintCoinach.Xiv.PlaceName, LocationInfo> LocationIndex;

        public static HashSet<string> LocalizedTypes = new HashSet<string>() { "achievement", "action", "fate", "fishing", "instance", "item", "leve", "quest", "npc", "mob", "status" };

        // Views
        public List<dynamic> NodeViews = new List<dynamic>();
        public List<dynamic> Fish = new List<dynamic>();

        // For Additional tools write things:
        public Dictionary<int, dynamic> CardItemByCardId = new Dictionary<int, dynamic>();
        public List<dynamic> CardNpcs = new List<dynamic>();

        #region Singleton
        private GarlandDatabase() { }

        public static GarlandDatabase Instance { get; } = new GarlandDatabase();
        #endregion

        public void AddLocationReference(int id)
        {
            if (id <= 10)
                throw new InvalidOperationException();

            LocationReferences.Add(id);
        }

        public void AddReference(object source, string type, string id, bool isNested)
        {
            if (!DataReferencesBySource.TryGetValue(source, out var list))
                DataReferencesBySource[source] = list = new List<DataReference>();

            AddReference(list, type, id, isNested);
        }

        public void AddReference(object source, string type, int id, bool isNested)
        {
            AddReference(source, type, id.ToString(), isNested);
        }

        public void AddReference(object source, string type, IEnumerable<int> ids, bool isNested)
        {
            if (!DataReferencesBySource.TryGetValue(source, out var list))
                DataReferencesBySource[source] = list = new List<DataReference>();

            foreach (var id in ids)
                AddReference(list, type, id.ToString(), isNested);
        }

        public void AddReference(object source, string type, IEnumerable<string> ids, bool isNested)
        {
            if (!DataReferencesBySource.TryGetValue(source, out var list))
                DataReferencesBySource[source] = list = new List<DataReference>();

            foreach (var id in ids)
                AddReference(list, type, id, isNested);
        }

        void AddReference(List<DataReference> list, string type, string id, bool isNested)
        {
            if (list.Any(dr => dr.Type == type && dr.Id == id))
                return; // Skip dupes.

            list.Add(new DataReference(type, id, isNested));
        }
    }
}
