using Garland.Data.Modules;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceFishing : AllaganSource
    {
        public AllaganSourceFishing(DatabaseBuilder builder) : base(builder, "FISHING")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            throw new NotImplementedException();
        }
    }
}
