using Garland.Data.Modules;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceVenture : AllaganSource
    {
        public AllaganSourceVenture(DatabaseBuilder builder) : base(builder, "VENTURE")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            var ventureId = report["ventureId"].Value<int>();

            if (_builder.Db.VenturesById.TryGetValue(ventureId, out var venture))
            {
                if (item.ventures == null)
                    item.ventures = new JArray();
                item.ventures.Add(ventureId);
            }
            else
            {
                DatabaseBuilder.PrintLine($"Invalid Venture {ventureId}.");
            }
        }
    }
}
