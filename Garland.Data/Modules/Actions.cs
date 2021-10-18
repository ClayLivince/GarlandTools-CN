using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Saint = SaintCoinach.Xiv;

namespace Garland.Data.Modules
{
    public class Actions : Module
    {
        dynamic[] _linkingActions;

        public override string Name => "Actions";

        public override void Start()
        {
            BuildActionCategories();

            BuildActions();
            BuildCraftingActions();
            BuildPetActions();

            BuildTraits();
            BuildCombos();
        }

        void BuildActions()
        {
            Dictionary<int, Saint.Action> iActionById = new Dictionary<int, Saint.Action>();
            foreach (var iAction in _builder.InterSheet<Saint.Action>())
                iActionById[iAction.Key] = iAction;

            foreach (var sAction in _builder.Sheet<Saint.Action>())
            {
                iActionById.TryGetValue(sAction.Key, out var iAction);
                BuildAction(sAction, iAction);
            }   

            _linkingActions = _builder.Db.Actions.ToArray();
        }

        dynamic BuildAction(Saint.Action sAction, Saint.Action iAction)
        {
            dynamic action = new JObject();
            action.id = sAction.Key;
            _builder.Localize.Strings((JObject)action, sAction, iAction, "Name");
            _builder.Localize.HtmlStrings((JObject)action, sAction.ActionTransient, iAction.ActionTransient, "Description");
            action.patch = PatchDatabase.Get("action", sAction.Key);
            action.category = sAction.ActionCategory.Key;

            if (sAction.Icon != null)
                action.icon = IconDatabase.EnsureEntry("action", sAction.Icon);

            if (sAction.ClassJobCategory.Key > 0)
                action.affinity = sAction.ClassJobCategory.Key;

            action.lvl = sAction.ClassJobLevel;
            action.range = sAction.Range; // -1 = melee, 0 = self
            action.cast = sAction.CastTime.TotalMilliseconds;
            action.recast = sAction.RecastTime.TotalMilliseconds;

            // This is needed for ninja and pet actions.
            var sClassJob = sAction.ClassJob;
            if (sClassJob == null || (sClassJob.Key == 0 && sAction.ClassJobCategory.ClassJobs.Count() == 1))
            {
                if (sAction.ClassJobCategory.Key > 0)
                    action.job = sAction.ClassJobCategory.ClassJobs.First().Key;
            }
            else
                action.job = sClassJob.Key;

            if (sAction.ComboFrom.Key > 0)
            {
                action.comboFrom = sAction.ComboFrom.Key;

                _builder.Db.AddReference(action, "action", sAction.ComboFrom.Key, false);
            }

            if (sAction.GainedStatus.Key != 0)
                action.gainedStatus = GetStatus(sAction.GainedStatus);

            if (sAction.EffectRange > 1)
                action.size = sAction.EffectRange;

            BuildActionCost(action,  sAction);

            var cooldownGroup = (byte)sAction["CooldownGroup"];
            if (cooldownGroup == 58)
                action.gcd = 1;

            // Not very useful.
            //if (gameData.CanTargetSelf)
            //    action.self = 1;
            //if (gameData.CanTargetParty)
            //    action.party = 1;
            //if (gameData.CanTargetFriendly)
            //    action.friendly = 1;
            //if (gameData.CanTargetHostile)
            //    action.hostile = 1;
            //if (gameData.TargetArea)
            //    action.aoe = 1;

            _builder.Db.Actions.Add(action);
            _builder.Db.ActionsById[sAction.Key] = action;

            return action;
        }

        void BuildActionCost(dynamic action, Saint.Action sAction)
        {
            if (sAction.Cost == 0)
                return;

            switch (sAction.CostType)
            {
                case Saint.ActionCostType.CP:
                    action.resource = "制作力";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.GP:
                    action.resource = "采集力";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.HPPercent:
                    action.resource = "体力";
                    action.cost = sAction.Cost + "%";
                    break;

                case Saint.ActionCostType.LimitBreakGauge:
                    action.resource = "极限槽";
                    break;

                case Saint.ActionCostType.MP:
                case Saint.ActionCostType.MP2:
                    action.resource = "魔力";
                    action.cost = sAction.GetMpCost(GarlandDatabase.LevelCap);
                    break;

                case Saint.ActionCostType.MPAll:
                    action.resource = "魔力";
                    action.cost = sAction.GetMpCost(GarlandDatabase.LevelCap) + "+";
                    break;

                case Saint.ActionCostType.NoCost:
                    break;

                case Saint.ActionCostType.StatusAll:
                    action.resource = "状态";
                    action.cost = GetStatus(sAction.SourceRow.Sheet.Collection.GetSheet<Saint.Status>("Status")[sAction.Cost]);
                    break;

                case Saint.ActionCostType.StatusAmount:
                    action.resource = "Stack";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.TP:
                    action.resource = "技力";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.TPAll:
                    action.resource = "技力";
                    action.cost = "全部";
                    break;

                case Saint.ActionCostType.BeastGauge:
                    action.resource = "兽魂";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.BloodGauge:
                    action.resource = "暗血";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.NinkiGauge:
                    action.resource = "忍气";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.Chakra:
                    action.resource = "斗气";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.Aetherflow:
                    action.resource = "以太超流";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.AethertrailAttunement:
                    action.resource = "龙神同调";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.KenkiGauge:
                case Saint.ActionCostType.KenkiGauge2:
                    action.resource = "剑气";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.OathGauge:
                    action.resource = "忠义";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.BalanceGauge:
                    action.resource = "魔元";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.FaerieGauge:
                    action.resource = "异想以太";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.LilyAll:
                    action.resource = "治疗百合";
                    action.cost = "全部";
                    break;

                case Saint.ActionCostType.Ceruleum:
                    action.resource = "青磷水能量";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.Polyglot:
                    action.resource = "通晓";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.FourfoldFeather:
                    action.resource = "幻扇";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.Espirit:
                    action.resource = "伶俐";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.Cartridge:
                    action.resource = "晶壤";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.BloodLily:
                    action.resource = "血百合";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.Lily:
                    action.resource = "治疗百合";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.SealsAll:
                    action.resource = "Seals";
                    action.cost = "All";
                    break;

                case Saint.ActionCostType.SoulVoice:
                    action.resource = "灵魂之声";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.Heat:
                    action.resource = "热度";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.Battery:
                    action.resource = "电能";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.Meditation:
                    action.resource = "剑压";
                    action.cost = sAction.Cost;
                    break;

                case Saint.ActionCostType.AstrologianCard:
                case Saint.ActionCostType.AstrologianCard2:
                case Saint.ActionCostType.AstrologianCard3:
                case Saint.ActionCostType.AstrologianCard4:
                case Saint.ActionCostType.AstrologianCard5:
                case Saint.ActionCostType.AstrologianCard6:
                case Saint.ActionCostType.GreasedLightning:
                case Saint.ActionCostType.Repertoire:
                case Saint.ActionCostType.DreadwyrmAether:
                case Saint.ActionCostType.DreadwyrmTrance:
                case Saint.ActionCostType.AstralFireOrUmbralIce:
                case Saint.ActionCostType.UnknownDragoon48:
                    break;

                case Saint.ActionCostType.Unknown20:
                    break;

                default:
                    throw new NotImplementedException($"Unknown action cost type {(byte)sAction.CostType} for action {sAction.Name} ({sAction.Key}).");
            }
        }

        void BuildCraftingActions()
        {
            Dictionary<int, Saint.CraftAction> iCraftActionById = new Dictionary<int, Saint.CraftAction>();
            foreach (var iCraftAction in _builder.InterSheet<Saint.CraftAction>())
                iCraftActionById[iCraftAction.Key] = iCraftAction;

            foreach (var sCraftAction in _builder.Sheet<Saint.CraftAction>())
            {
                if (sCraftAction.Name.ToString() == "")
                    continue;

                if (sCraftAction.ClassJob == null)
                    continue; // HWFIXME: This is for all DoH

                dynamic action = new JObject();
                action.id = sCraftAction.Key;
                iCraftActionById.TryGetValue(sCraftAction.Key, out var iCraftAction);
                _builder.Localize.HtmlStrings((JObject)action, sCraftAction, iCraftAction, "Name", "Description");
                action.category = 7; // DoH ability
                action.icon = IconDatabase.EnsureEntry("action", sCraftAction.Icon);
                action.job = sCraftAction.ClassJob.Key;
                action.affinity = sCraftAction.ClassJobCategory.Key;
                action.lvl = sCraftAction.ClassJobLevel;

                if (sCraftAction.Cost > 0)
                {
                    action.resource = "制作力";
                    action.cost = sCraftAction.Cost;
                }

                _builder.Db.Actions.Add(action);
            }
        }

        void BuildPetActions()
        {
            foreach (var sPetAction in _builder.Sheet<Saint.XivRow>("PetAction"))
            {
                var sAction = (Saint.Action)sPetAction["Action"];
                if (sAction == null || sAction.Key == 0)
                    continue;

                var sPet = (Saint.XivRow)sPetAction["Pet"];
                var name = sPet["Name"].ToString();
                if (string.IsNullOrEmpty(name))
                    continue;

                var action = _builder.Db.ActionsById[sAction.Key];
                action.pet = name;
                action.desc = HtmlStringFormatter.Convert((SaintCoinach.Text.XivString)sPetAction["Description"]);
            }
        }

        void BuildActionCategories()
        {
            foreach (var sActionCategory in _builder.Sheet<Saint.ActionCategory>())
            {
                if (sActionCategory.Key == 0)
                    continue;

                dynamic category = new JObject();
                category.id = sActionCategory.Key;
                category.name = sActionCategory.Name.ToString();
                _builder.Db.ActionCategories.Add(category);
            }
        }

        void BuildTraits()
        {
            dynamic traitCategory = new JObject();
            traitCategory.id = -1;
            traitCategory.name = "职业特性";
            _builder.Db.ActionCategories.Add(traitCategory);

            Dictionary<int, Saint.Trait> iTraitById = new Dictionary<int, Saint.Trait>();
            foreach (var iTrait in _builder.InterSheet<Saint.Trait>())
                iTraitById[iTrait.Key] = iTrait;

            foreach (var sTrait in _builder.Sheet<Saint.Trait>())
            {
                if (sTrait.ClassJob.Key == 0)
                    continue; // Skip adventurer traits atm.

                var sTraitTransient = _builder.Sheet("TraitTransient")[sTrait.Key];
                var iTraitTransient = _builder.InterSheet("TraitTransient")[sTrait.Key];

                dynamic trait = new JObject();
                trait.id = sTrait.Key + 50000; // Arbitrary!

                iTraitById.TryGetValue(sTrait.Key, out var iTrait);
                _builder.Localize.Strings((JObject)trait, sTrait, iTrait, "Name");
                _builder.Localize.HtmlStrings((JObject)trait, sTraitTransient, iTraitTransient, "Description");
                trait.category = (int)traitCategory.id;
                trait.icon = IconDatabase.EnsureEntry("action", sTrait.Icon);
                trait.job = sTrait.ClassJob.Key;
                trait.affinity = sTrait.ClassJobCategory.Key;
                trait.lvl = sTrait.Level;

                string desc = trait.chs.description;

                // Link traits if the action name appears somewhere in the trait description.
                foreach (var action in _linkingActions)
                {
                    if (action.job == null)
                        continue;

                    string name = action.chs.name;
                    if (name == null || !desc.Contains(name))
                        continue;

                    if ((int)action.job != (int)trait.job)
                        continue;

                    var actionId = (int)action.id;
                    var traitId = (int)trait.id;

                    if (actionId == 119 && traitId == 50065)
                        continue; // Graniteskin & Stone

                    if (actionId == 120 && traitId == 50063)
                        continue; // Overcure and Cure

                    if (trait.actions == null)
                        trait.actions = new JArray();
                    trait.actions.Add(actionId);
                    _builder.Db.AddReference(trait, "action", actionId, false);

                    if (action.traits == null)
                        action.traits = new JArray();
                    action.traits.Add(traitId);
                    _builder.Db.AddReference(action, "action", traitId, false);
                }

                _builder.Db.Actions.Add(trait);
            }
        }

        dynamic GetStatus(Saint.Status sStatus)
        {
            dynamic status = new JObject();
            status.id = sStatus.Key;
            status.name = sStatus.Name.ToString();
            status.desc = sStatus.Description.ToString();
            status.icon = IconDatabase.EnsureEntry("status", sStatus.Icon);
            return status;
        }

        void BuildCombos()
        {
            foreach (var action in _builder.Db.Actions)
            {
                if (action.comboFrom == null)
                    continue;

                var actionId = (int)action.id;
                int comboFromId = action.comboFrom;
                var comboFromAction = _builder.Db.ActionsById[comboFromId];

                if (comboFromAction.comboTo == null)
                    comboFromAction.comboTo = new JArray();
                comboFromAction.comboTo.Add(actionId);

                _builder.Db.AddReference(comboFromAction, "action", actionId, false);
            }
        }
    }
}
