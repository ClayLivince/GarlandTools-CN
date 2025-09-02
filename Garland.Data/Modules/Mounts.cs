using Newtonsoft.Json.Linq;
using SaintCoinach.Imaging;
using SaintCoinach.Text;
using SaintCoinach.Xiv;
using SaintCoinach.Xiv.ItemActions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Modules
{
    public class Mounts : Module
    {
        public override string Name => "Mounts";

        public override void Start()
        {
            foreach (var sItem in _builder.Sheet<Item>())
            {
                var unlock = sItem.ItemAction as MountUnlock;
                if (unlock == null)
                    continue;

                var sMount = unlock.Mount;
                if (string.IsNullOrEmpty(sMount.Singular.ToString()))
                    continue;

                var sMountTransient = _builder.Sheet("MountTransient")[sMount.Key];

                var item = _builder.Db.ItemsById[sItem.Key];
                item.mount = new JObject();
                _builder.Localize.Column((JObject)item, sMount, "Singular", "mount.name", Utils.CapitalizeWords);
                _builder.Localize.Column((JObject)item, sMountTransient, "Description", "mount.action");
                _builder.Localize.Column((JObject)item, sMountTransient, "Description{Enhanced}", "mount.description");
                _builder.Localize.Column((JObject)item, sMountTransient, "Tooltip", "mount.tooltip", HtmlStringFormatter.Convert);

                // Icons
                var iconIndex = (UInt16)sMount.SourceRow.GetRaw("Icon");
                var icon = IconHelper.GetIcon(_builder.Realm.Packs, iconIndex);
                item.mount.icon = IconDatabase.EnsureEntry("mount", icon);

                int guideIconIndex = 0;
                if (iconIndex < 8000)
                    guideIconIndex = iconIndex - 4000 + 68000;
                else if (iconIndex >= 8000) // For 4.1 SB mounts.
                    guideIconIndex = iconIndex - 8000 + 77000;

                var guideIcon = IconHelper.GetIcon(_builder.Realm.Packs, guideIconIndex);
                if (guideIcon == null)
                    DatabaseBuilder.PrintLine($"Mount {item.mount.name} #{sItem.Key} has invalid guide icon, skipping.");
                else
                    item.mount.guideIcon = IconDatabase.EnsureEntry("mount", guideIcon);

                item.models = new JArray(Utils.ModelCharaKey(sMount.ModelChara));
            }
        }
    }
}
