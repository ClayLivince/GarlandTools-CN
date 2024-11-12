using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceMogStation : AllaganSource
    {
        public AllaganSourceMogStation(DatabaseBuilder builder) : base(builder, "MOGSTATION")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            if (item.mog == null)
            {
                item.mog = new JObject();
            }

            item.mog["price"] = report["price"];
            item.mog["id"] = report["productId"];
        }
    }
}
