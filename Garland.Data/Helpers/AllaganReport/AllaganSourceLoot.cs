using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceLoot : AllaganSource
    {
        public AllaganSourceLoot(DatabaseBuilder builder) : base(builder, "LOOT")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            if (item.treasure == null)
                item.treasure = new JArray();

            var generator = _builder.Db.ItemsById[report["itemId"].Value<int>()];   
            if (generator.loot == null)
                generator.loot = new JArray();

            generator.loot.Add((int)item.id);
            _builder.Db.AddReference(generator, "item", (int)item.id, false);

            item.treasure.Add((int)generator.id);
            _builder.Db.AddReference(item, "item", (int)generator.id, true);
        }
    }
}
