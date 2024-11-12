using Newtonsoft.Json.Linq;
using SaintCoinach.Xiv;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public class AllaganSourceQuest : AllaganSource
    {
        public AllaganSourceQuest(DatabaseBuilder builder) : base(builder, "Quest")
        {
        }

        public override void Import(JObject report, dynamic item)
        {
            dynamic quest = _builder.Db.QuestsById[report["questId"].Value<int>()];

            if (item.quests == null)
                item.quests = new JArray();
            JArray quests = item.quests;

            if (!quests.Any(id => ((int)id) == quest.id))
            {
                quests.Add(quest.id);
                _builder.Db.AddReference(item, "quest", quest.id, false);

                if (quest.rewards == null)
                    quest.rewards = new JObject();

                dynamic rewards = quest.rewards;
                if (rewards.items == null)
                    rewards.items = new JArray();

                dynamic o = new JObject();
                o.id = item.id;
                rewards.items.Add(o);

                _builder.Db.AddReference(quest, "item", item.id, false);
            }
        }
    }
}
