using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceReduction : AllaganSource
    {
        public AllaganSourceReduction(DatabaseBuilder builder) : base(builder, "REDUCTION")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            if (item.reducedFrom == null)
                item.reducedFrom = new JArray();

            var sourceItem = _builder.Db.ItemsById[report["itemId"].Value<int>()];
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
                        slot.reduce.item = item.en.name;
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
}
