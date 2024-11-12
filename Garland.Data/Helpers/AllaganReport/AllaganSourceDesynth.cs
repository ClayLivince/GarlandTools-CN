using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceDesynth : AllaganSource
    {
        public AllaganSourceDesynth(DatabaseBuilder builder) : base(builder, "DESYNTH")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            if (item.desynthedFrom == null)
                item.desynthedFrom = new JArray();

            var desynthItem = _builder.Db.ItemsById[report["itemId"].Value<int>()];
            item.desynthedFrom.Add((int)desynthItem.id);
            _builder.Db.AddReference(item, "item", (int)desynthItem.id, false);

            if (desynthItem.desynthedTo == null)
                desynthItem.desynthedTo = new JArray();
            desynthItem.desynthedTo.Add((int)item.id);
            _builder.Db.AddReference(desynthItem, "item", (int)item.id, false);
        }
    }
}
