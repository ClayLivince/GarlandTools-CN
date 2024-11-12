using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceSpearFishing : AllaganSource
    {
        public AllaganSourceSpearFishing(DatabaseBuilder builder) : base(builder, "SPEARFISHING")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            throw new NotImplementedException();
        }
    }
}
