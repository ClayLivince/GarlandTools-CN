using Garland.Data.Modules;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceGardening : AllaganSource
    {
        public AllaganSourceGardening(DatabaseBuilder builder) : base(builder, "GARDENING")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            var seedItem = _builder.Db.ItemsById[report["itemId"].Value<int>()];
            try
            {
                Items.AddGardeningPlant(_builder, seedItem, item);
            } catch (InvalidOperationException ex)
            {
                if (!ex.Message.Contains("resultItem.seeds already exists"))
                {
                    throw ex;
                }
            }
            
        }
    }
}
