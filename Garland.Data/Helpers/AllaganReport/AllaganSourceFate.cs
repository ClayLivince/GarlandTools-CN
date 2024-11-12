using Newtonsoft.Json.Linq;
using SaintCoinach.Xiv;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceFate : AllaganSource
    {
        public AllaganSourceFate(DatabaseBuilder builder) : base(builder, "FATE")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            var fateId = report["fateId"].Value<int>();

            if (item.fates == null)
                item.fates = new JArray();

            if (item.fates.Contains(fateId))
            {
                return;
            }
            item.fates.Add(fateId);

            var fate = _builder.Db.Fates.First(i => i.id == report["fateId"].Value<int>());

            if (fate.items == null)
                fate.items = new JArray();
            fate.items.Add((int)item.id);
            _builder.Db.AddReference(item, "fate", fate.id, false);
        }
    }
}
