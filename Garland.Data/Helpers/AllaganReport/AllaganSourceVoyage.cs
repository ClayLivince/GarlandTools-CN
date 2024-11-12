using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceVoyage : AllaganSource
    {
        public AllaganSourceVoyage(DatabaseBuilder builder) : base(builder, "VOYAGE")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            if (item.voyages == null)
                item.voyages = new JArray();

            dynamic voyage = new JObject();
            voyage.id = report["voyageId"];
            voyage.type = report["voyageType"];

            item.voyages.Add(voyage);
        }
    }
}
