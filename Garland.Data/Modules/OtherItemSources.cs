using Garland.Data.Helpers.AllaganReport;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Garland.Data.Modules
{
    public class OtherItemSources : Module
    {
        public override string Name => "Other Item Sources";

        public override void Start()
        {
            var _sources = new AllaganSource[] {
                new AllaganSourceDesynth(_builder),
                new AllaganSourceFate(_builder),
                new AllaganSourceGardening(_builder),
                new AllaganSourceInstance(_builder),
                new AllaganSourceLoot(_builder),
                new AllaganSourceMogStation(_builder),
                new AllaganSourceQuest(_builder),
                new AllaganSourceReduction(_builder),
                new AllaganSourceVenture(_builder),
                new AllaganSourceVoyage(_builder),
                //new AllaganSourceDrop(_builder),
                //new AllaganSourceFishing(_builder),
                //new AllaganSourceSpearFishing(_builder),
            };

            foreach (var source in _sources)
            {
                source.QueryAndImport();
            }
        }

        void BuildOther(dynamic item, string[] sources)
        {
            // For unstructured source strings.
            if (item.other != null)
                throw new InvalidOperationException("item.other already exists.");

            if (sources.Length > 0)
                item.other = new JArray(sources);
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
    }
}