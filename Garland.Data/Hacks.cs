using Garland.Data.Models;
using Newtonsoft.Json.Linq;
using SaintCoinach.Xiv;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data
{
    public static class Hacks
    {
        public static HashSet<int> ExcludedShops = new HashSet<int>() {
            1769474, // Currency Test
            1769475, // Materia Test
            1769524, // Items in Development
        };

        public static HashSet<int> NoModelCategories = new HashSet<int>()
        {
            33, // Fishing Tackle
            39, // Waist
            62  // Job Soul
        };

        public static string GetShopName(ScriptInstruction si)
        {
            if (si.Label.Contains("FCCSHOP"))
                return "军票兑换 (物品)";
            else if (si.Label == "MOBSHOP1")
                return "兵团徽章交易";
            else if (si.Label == "MOBSHOP2")
                return "兵团徽章交易 (高级)";
            else if (si.Label == "SHOP_SPOIL")
                return "通货交易";
            else if (si.Label == "SPECIAL_SHOP0" && si.Argument == 1769813)
                return "成就币交易";
            else if (si.Label == "SPECIAL_SHOP1" && si.Argument == 1769845)
                return "成就币交易";
            else if (si.Label == "SPECIAL_SHOP2" && si.Argument == 1769846)
                return "成就币交易";
            else if (si.Label == "SHOP_0" && si.Argument == 1769842)
                return "库洛奖状：金奖交换";
            else if (si.Label == "SHOP_1" && si.Argument == 1769841)
                return "库洛奖状：银奖交换";
            else if (si.Label == "SHOP_2" && si.Argument == 1769956)
                return "库洛奖状：铜奖交换";
            else if (si.Label == "SHOP" && si.Argument == 1769812)
                return "PVP 奖励";
            else if (si.Label == "REPLICA_SHOP0" && si.Argument == 262918)
                return "复制禁地兵装（战斗精英）";
            else if (si.Label == "REPLICA_SHOP1" && si.Argument == 262922)
                return "复制禁地兵装（魔法导师）";
            else if (si.Label == "FREE_SHOP_BATTLE" && si.Argument == 1769898)
                return "成就奖励 战斗";
            else if (si.Label == "FREE_SHOP_PVP" && si.Argument == 1769899)
                return "成就奖励 玩家对战";
            else if (si.Label == "FREE_SHOP_CHARACTER" && si.Argument == 1769900)
                return "成就奖励 角色";
            else if (si.Label == "FREE_SHOP_ITEM" && si.Argument == 1769901)
                return "成就奖励 道具";
            else if (si.Label == "FREE_SHOP_CRAFT" && si.Argument == 1769902)
                return "成就奖励 制作";
            else if (si.Label == "FREE_SHOP_GATHERING" && si.Argument == 1769903)
                return "成就奖励 采集";
            else if (si.Label == "FREE_SHOP_QUEST" && si.Argument == 1769904)
                return "成就奖励 任务";
            else if (si.Label == "FREE_SHOP_EXPLORATION" && si.Argument == 1769905)
                return "成就奖励 探索";
            else if (si.Label == "FREE_SHOP_GRANDCOMPANY" && si.Argument == 1769906)
                return "成就奖励 大国防联军";

            else if (si.Label == "SPSHOP_HANDLER_ID" && si.Argument == 1770041)
                return "天穹街振兴票";
            else if (si.Label == "SPSHOP2_HANDLER_ID" && si.Argument == 1770281)
                return "天穹街振兴票（装备·家具）";
            else if (si.Label == "SPSHOP3_HANDLER_ID" && si.Argument == 1770301)
                return "天穹街振兴票（素材·魔晶石·消耗品）";
            else if (si.Label == "SPSHOP4_HANDLER_ID" && si.Argument == 1770343)
                return "庆典参加证书";

            else
            {
                DatabaseBuilder.PrintLine($"Unknown shop label {si.Label}, arg {si.Argument}.");
                return si.Label;
            }
        }

        public static bool IsItemSkipped(string name, int key)
        {
            switch (key)
            {
                case 17557: // Dated Radz-at-Han Coin
                    return false;

                case 22357: // Wrapped Present (no icon)
                    return true;
            }

            if (name.Length == 0)
                return true;

            if (name.StartsWith("过期"))
                return true;

            return false;
        }

        public static bool IsNpcSkipped(ENpc sNpc)
        {
            if (sNpc.Resident == null)
                return true;

            if (string.IsNullOrWhiteSpace(sNpc.Resident.Singular))
                return true;

            return false;
        }

        public static void SetManualShops(SaintCoinach.ARealmReversed realm, Dictionary<int, GarlandShop> shopsByKey)
        {
            var sENpcs = realm.GameData.ENpcs;

            // Special Shops
            var syndony = sENpcs[1016289];
            shopsByKey[1769635].ENpcs = new ENpc[] { syndony };

            var eunakotor = new ENpc[] { sENpcs[1017338] };
            shopsByKey[1769675].ENpcs = eunakotor;
            shopsByKey[1769869].Fill("将装备带出死者宫殿", eunakotor);

            var disreputablePriest = new ENpc[] { sENpcs[1018655] };
            shopsByKey[1769743].Fill("Exchange Wolf Marks (Melee)", disreputablePriest);
            shopsByKey[1769744].Fill("Exchange Wolf Marks (Ranged)", disreputablePriest);

            var eurekaGerolt = new ENpc[] { sENpcs[1025047] };
            shopsByKey[1769820].Fill("制作或强化禁地兵装（骑士）", eurekaGerolt);
            shopsByKey[1769821].Fill("制作或强化禁地兵装（战士）", eurekaGerolt);
            shopsByKey[1769822].Fill("制作或强化禁地兵装（暗黑骑士）", eurekaGerolt);
            shopsByKey[1769823].Fill("制作或强化禁地兵装（龙骑士）", eurekaGerolt);
            shopsByKey[1769824].Fill("制作或强化禁地兵装（武僧）", eurekaGerolt);
            shopsByKey[1769825].Fill("制作或强化禁地兵装（忍者）", eurekaGerolt);
            shopsByKey[1769826].Fill("制作或强化禁地兵装（武士）", eurekaGerolt);
            shopsByKey[1769827].Fill("制作或强化禁地兵装（吟游诗人）", eurekaGerolt);
            shopsByKey[1769828].Fill("制作或强化禁地兵装（机工士）", eurekaGerolt);
            shopsByKey[1769829].Fill("制作或强化禁地兵装（黑魔法师）", eurekaGerolt);
            shopsByKey[1769830].Fill("制作或强化禁地兵装（召唤师）", eurekaGerolt);
            shopsByKey[1769831].Fill("制作或强化禁地兵装（赤魔法师）", eurekaGerolt);
            shopsByKey[1769832].Fill("制作或强化禁地兵装（白魔法师）", eurekaGerolt);
            shopsByKey[1769833].Fill("制作或强化禁地兵装（学者）", eurekaGerolt);
            shopsByKey[1769834].Fill("制作或强化禁地兵装（占星术士）", eurekaGerolt);

            var confederateCustodian = new ENpc[] { sENpcs[1025848] };
            shopsByKey[1769871].Fill("天之陶器碎片兑换", confederateCustodian);
            shopsByKey[1769870].Fill("将装备带出天之御柱", confederateCustodian);

            // Gil Shops
            var domanJunkmonger = new ENpc[] { sENpcs[1025763] };
            shopsByKey[262919].ENpcs = domanJunkmonger;

            // Gemstone Traders
            shopsByKey[1769957].ENpcs = new ENpc[] { sENpcs[1027998] }; // Gramsol, Crystarium
            shopsByKey[1769958].ENpcs = new ENpc[] { sENpcs[1027538] }; // Pedronille, Eulmore
            shopsByKey[1769959].ENpcs = new ENpc[] { sENpcs[1027385] }; // Siulmet, Lakeland
            shopsByKey[1769960].ENpcs = new ENpc[] { sENpcs[1027497] }; // ??, Kholusia
            shopsByKey[1769961].ENpcs = new ENpc[] { sENpcs[1027892] }; // Halden, Amh Araeng
            shopsByKey[1769962].ENpcs = new ENpc[] { sENpcs[1027665] }; // Sul Lad, Il Mheg
            shopsByKey[1769963].ENpcs = new ENpc[] { sENpcs[1027709] }; // Nacille, Rak'tika
            shopsByKey[1769964].ENpcs = new ENpc[] { sENpcs[1027766] }; // ??, Tempest
        }

        public static bool IsMainAttribute (string attribute)
        {
            switch (attribute)
            {
                case "力量":
                case "灵巧":
                case "耐力":
                case "智力":
                case "精神":
                case "信仰":
                    return true;
            }

            return false;
        }

        public static void CreateDiademNodes(GarlandDatabase db)
        {
            //dynamic mining = new JObject();
            //mining.id = 10000;
            //mining.type = 0;
            //mining.lvl = 60;
            //mining.name = "Node";
            //mining.zoneid = -2;
            //mining.items = new JArray(CreateNodeItem(12534), CreateNodeItem(12537), CreateNodeItem(12535), CreateNodeItem(13750));
            //db.Nodes.Add(mining);

            //dynamic quarrying = new JObject();
            //quarrying.id = 10001;
            //quarrying.type = 1;
            //quarrying.lvl = 60;
            //quarrying.name = "Node";
            //quarrying.zoneid = -2;
            //quarrying.items = new JArray(CreateNodeItem(13751));
            //db.Nodes.Add(quarrying);

            //dynamic logging = new JObject();
            //logging.id = 10001;
            //logging.type = 2;
            //logging.lvl = 60;
            //logging.name = "Node";
            //logging.zoneid = -2;
            //logging.items = new JArray(CreateNodeItem(12586), CreateNodeItem(12891), CreateNodeItem(12579), CreateNodeItem(13752));
            //db.Nodes.Add(logging);

            //dynamic harvesting = new JObject();
            //harvesting.id = 10002;
            //harvesting.type = 3;
            //harvesting.lvl = 60;
            //harvesting.name = "Node";
            //harvesting.zoneid = -2;
            //harvesting.items = new JArray(CreateNodeItem(12879), CreateNodeItem(12878), CreateNodeItem(13753));
            //db.Nodes.Add(harvesting);
        }

        private static dynamic CreateNodeItem(int itemId)
        {
            dynamic obj = new JObject();
            obj.id = itemId;
            return obj;
        }

        public static void SetInstanceIcon(ContentFinderCondition sContentFinderCondition, dynamic obj)
        {
            if (sContentFinderCondition.Content.Key == 55001)
            {
                // Aquapolis
                obj.fullIcon = 1;
                return;
            }

            if (sContentFinderCondition.Content.Key == 55002)
            {
                // Lost Canals of Uznair
                obj.fullIcon = 2;
                return;
            }

            if (sContentFinderCondition.Content.Key == 55003)
            {
                // Hidden Canals of Uznair
                obj.fullIcon = 3;
                return;
            }

            if (sContentFinderCondition.Image == null)
            {
                DatabaseBuilder.PrintLine($"Content {sContentFinderCondition.Content.Key} {sContentFinderCondition.Content} has no icon");
                return;
            }

            obj.fullIcon = IconDatabase.EnsureEntry("instance", sContentFinderCondition.Image);
        }

        public static string GetContentTypeNameOverride(ContentType sContentType)
        {
            switch (sContentType.Key)
            {
                case 20: return "初学者学堂";
                case 22: return "季节活动特殊迷宫";
                case 23: return "空岛探索";
                case 27: return "假面狂欢";
            }

            throw new InvalidOperationException($"Invalid missing ContentType override for {sContentType}.");
        }

        public static string GetCategoryDamageAttribute(SaintCoinach.Xiv.ItemUICategory category)
        {
            // This needs to be maintained when new ClassJobs are added, usually
            // in an expansion.

            switch (category.Key)
            {
                case 1: // Pugilist's Arm
                case 2: // Gladiator's Arm
                case 3: // Marauder's Arm
                case 4: // Archer's Arm
                case 5: // Lancer's Arm
                case 12: // Carpenter's Primary Tool
                case 14: // Blacksmith's Primary Tool
                case 16: // Armorer's Primary Tool
                case 18: // Goldsmith's Primary Tool
                case 20: // Leatherworker's Primary Tool
                case 22: // Weaver's Primary Tool
                case 24: // Alchemist's Primary Tool
                case 26: // Culinarian's Primary Tool
                case 28: // Miner's Primary Tool
                case 30: // Botanist's Primary Tool
                case 32: // Fisher's Primary Tool
                case 84: // Rogue's Arms
                case 87: // Dark Knight's Arm
                case 88: // Machinist's Arm
                case 96: // Samurai's Arm
                case 106: // Gunbreaker's Arm
                case 107: // Dancer's Arm
                    return "物理基本性能";

                case 6: // One–handed Thaumaturge's Arm
                case 7: // Two–handed Thaumaturge's Arm
                case 8: // One–handed Conjurer's Arm
                case 9: // Two–handed Conjurer's Arm
                case 10: // Arcanist's Grimoire
                case 89: // Astrologian's Arm
                case 97: // Red Mage's Arm
                case 98: // Scholar's Arm
                case 105: // Blue Mage's Arm
                    return "魔法基本性能";

                default:
                    return null;
            }
        }
    }
}
