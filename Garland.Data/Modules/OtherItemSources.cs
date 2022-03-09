using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Modules
{
    public class OtherItemSources : Module
    {
        Dictionary<string, dynamic> _venturesByName;

        public override string Name => "Other Item Sources";

        public override void Start()
        {
            _venturesByName = _builder.Db.Ventures.Where(v => v.name != null).ToDictionary(v => (string)v.name);

            var lines = Utils.Tsv(Path.Combine(Config.SupplementalPath, "FFXIV Data - Items.tsv"));
            Clay.ClayMySQL clayManager = new Clay.ClayMySQL();
            foreach (var line in lines.Skip(1))
            {
                var type = line[1];
                var args = line.Skip(2).Where(c => c != "").ToArray();
                var itemName = line[0];

                // Jump over comments
                if (itemName.StartsWith("#"))
                    continue;

                try
                {
                    var item = _builder.Db.ItemsByEnName[itemName];

                    switch (type)
                    {
                        case "Desynth":
                            BuildDesynth(item,  args);
                            break;

                        case "Reduce":
                            BuildReduce(item,  args);
                            break;

                        case "Loot":
                            BuildLoot(item,  args);
                            break;

                        case "Venture":
                            BuildVentures(clayManager, item,  args);
                            break;

                        case "Node":
                            BuildNodes(item, args);
                            break;

                        case "FishingSpot":
                            BuildFishingSpots(item, args);
                            break;

                        case "Instance":
                            BuildInstances(clayManager, item, args);
                            break;

                        case "Voyage":
                            BuildVoyages(item, args);
                            break;

                        case "Gardening":
                            BuildGardening(item,  args);
                            break;

                        case "Other":
                            BuildOther(item, args);
                            break;

                        default:
                            {
                                var joinedArgs = string.Join(", ", args);
                                DatabaseBuilder.PrintLine($"Error importing supplemental source '{itemName}' with args '{joinedArgs}': Unsupported type '{type}'");
                                break;
                            }
                    }
                }
                catch (Exception ex)
                {
                    var joinedArgs = string.Join(", ", args);
                    DatabaseBuilder.PrintLine($"Error importing supplemental source '{itemName}' with args '{joinedArgs}': {ex.Message}");
                    //if (System.Diagnostics.Debugger.IsAttached)
                        //System.Diagnostics.Debugger.Break();
                }
            }
            clayManager.Stop();
        }

        void BuildOther(dynamic item, string[] sources)
        {
            // For unstructured source strings.
            if (item.other != null)
                throw new InvalidOperationException("item.other already exists.");

            item.other = new JArray(sources);
        }

        void BuildGardening(dynamic item,  string[] sources)
        {
            foreach (string seedItemName in sources)
            {
                var seedItem = _builder.Db.ItemsByEnName[seedItemName];
                Items.AddGardeningPlant(_builder, seedItem, item);
            }
        }

        void BuildDesynth(dynamic item, string[] sources)
        {
            if (item.desynthedFrom == null)
                item.desynthedFrom = new JArray();

            foreach (string itemName in sources)
            {
                var desynthItem = _builder.Db.ItemsByEnName[itemName];
                item.desynthedFrom.Add((int)desynthItem.id);
                _builder.Db.AddReference(item, "item", (int)desynthItem.id, false);

                if (desynthItem.desynthedTo == null)
                    desynthItem.desynthedTo = new JArray();
                desynthItem.desynthedTo.Add((int)item.id);
                _builder.Db.AddReference(desynthItem, "item", (int)item.id, false);
            }
        }

        void BuildReduce(dynamic item, string[] sources)
        {
            if (item.reducedFrom == null)
                item.reducedFrom = new JArray();

            foreach (string sourceItemName in sources)
            {
                if (!_builder.Db.ItemsByEnName.TryGetValue(sourceItemName, out var sourceItem))
                {
                    DatabaseBuilder.PrintLine($"Item name '{sourceItemName}' not found in database. Maybe there is a typo? Or not release in Chinese?");
                    return;
                }

                if (sourceItem.reducesTo == null)
                    sourceItem.reducesTo = new JArray();

                sourceItem.reducesTo.Add((int)item.id);
                item.reducedFrom.Add((int)sourceItem.id);

                _builder.Db.AddReference(sourceItem, "item", (int)item.id, false);
                _builder.Db.AddReference(item, "item", (int)sourceItem.id, true);

                // Set aetherial reduction info on the gathering node views.
                // Bell views
                foreach (var nodeView in _builder.Db.NodeViews)
                {
                    foreach (var slot in nodeView.items)
                    {
                        if (slot.id == sourceItem.id && slot.reduce == null)
                        {
                            slot.reduce = new JObject();
                            slot.reduce.item = item.chs.name;
                            slot.reduce.icon = item.icon;
                        }
                    }
                }

                // Database views
                foreach (var node in _builder.Db.Nodes)
                {
                    foreach (var slot in node.items)
                    {
                        if (slot.id == sourceItem.id && slot.reduceId == null)
                        {
                            slot.reduceId = (int)item.id;
                            _builder.Db.AddReference(node, "item", (int)item.id, false);
                        }
                    }
                }
            }
        }

        void BuildLoot(dynamic item,  string[] sources)
        {
            if (item.treasure == null)
                item.treasure = new JArray();

            //var generators = sources.Select(j => _builder.Db.ItemsByName[j]).ToArray();
            List<dynamic> generators = new List<dynamic>();
            foreach (string source in sources)
            {
                if (_builder.Db.ItemsByEnName.TryGetValue(source, out var sourceItem))
                {
                    generators.Add(sourceItem);
                }
                else {
                    DatabaseBuilder.PrintLine($"Item name '{source}' not found in database. Maybe there is a typo? Or not release in Chinese?");
                }
            }
            
            foreach (var generator in generators)
            {
                if (generator.loot == null)
                    generator.loot = new JArray();

                generator.loot.Add((int)item.id);
                _builder.Db.AddReference(generator, "item", (int)item.id, false);

                item.treasure.Add((int)generator.id);
                _builder.Db.AddReference(item, "item", (int)generator.id, true);
            }
        }

        void BuildVentures(Clay.ClayMySQL clayManager, dynamic item,string[] sources)
        {
            if (item.ventures != null)
                throw new InvalidOperationException("item.ventures already exists.");
            var ventureIds = sources.Select(j => (int)_venturesByName[clayManager.getRetainerTaskChs(j)].id);
            item.ventures = new JArray(ventureIds);
        }

        void BuildVoyages(dynamic item, string[] sources)
        {
            if (item.voyages != null)
                throw new InvalidOperationException("item.voyages already exists.");
            item.voyages = new JArray(sources);
        }

        void BuildNodes(dynamic item, string[] sources)
        {
            if (item.nodes == null)
                item.nodes = new JArray();

            foreach (var id in sources.Select(int.Parse))
            {
                item.nodes.Add(id);

                int itemId = item.id;

                var node = _builder.Db.Nodes.First(n => n.id == id);
                dynamic w = new JObject();
                w.id = itemId;
                w.slot = "?"; // Only hidden items here
                node.items.Add(w);

                _builder.Db.AddReference(node, "item", itemId, false);
                _builder.Db.AddReference(item, "node", id, true);
            }
        }

        void BuildFishingSpots(dynamic item, string[] sources)
        {
            if (item.fishingSpots == null)
                item.fishingSpots = new JArray();

            foreach (var name in sources)
            {
                dynamic w = new JObject();
                w.id = (int)item.id;
                w.lvl = (int)item.ilvl;

                var spot = _builder.Db.FishingSpots.First(f => f.name == name);
                item.fishingSpots.Add((int)spot.id);
                spot.items.Add(w);

                _builder.Db.AddReference(spot, "item", (int)item.id, false);
            }
        }

        void BuildInstances(Clay.ClayMySQL clayManager, dynamic item,  string[] sources)
        {
            if (item.instances == null)
                item.instances = new JArray();

            int itemId = item.id;
            

            foreach (var name in sources)
            {
                var instance = _builder.Db.Instances.First(i => i.en.name.ToString().ToUpper() == name.ToUpper());
                int instanceId = instance.id;
                if (instance.rewards == null)
                    instance.rewards = new JArray();
                instance.rewards.Add(itemId);
                item.instances.Add(instanceId);

                _builder.Db.AddReference(instance, "item", itemId, false);
                _builder.Db.AddReference(item, "instance", instanceId, true);
            }
        }
    }
}