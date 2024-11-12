using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceInstance : AllaganSource
    {
        public AllaganSourceInstance(DatabaseBuilder builder) : base(builder, "INSTANCE")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            var instanceId = report["instanceId"].Value<int>();
            if (instanceId < 0)
            {
                DatabaseBuilder.PrintLine($"We have negative instanceId here {instanceId}");
                return;
            }
            if (item.instances == null)
                item.instances = new JArray();

            if (item.instances.Contains(instanceId))
            {
                return;
            }

            int itemId = item.id;

            var instance = _builder.Db.InstancesById[instanceId];
            if (instance.rewards == null)
                instance.rewards = new JArray();
            instance.rewards.Add(itemId);
            item.instances.Add(instanceId);

            _builder.Db.AddReference(instance, "item", itemId, false);
            _builder.Db.AddReference(item, "instance", instanceId, true);
        }
    }
}
