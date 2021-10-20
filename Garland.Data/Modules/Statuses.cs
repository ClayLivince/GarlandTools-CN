using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Saint = SaintCoinach.Xiv;

namespace Garland.Data.Modules
{
    public class Statuses : Module
    {
        public override string Name => "Statuses";

        // Statuses of International client.
        // For extracting localization datas.
        private Dictionary<int, Saint.Status> iStatusById = new Dictionary<int, Saint.Status>();

        public override void Start()
        {
            IndexLocalize();
            BuildStatuses();
        }

        void IndexLocalize() 
        {
            foreach (var iStatus in _builder.InterSheet<Saint.Status>())
                iStatusById[iStatus.Key] = iStatus;
        }

        void BuildStatuses()
        {
            foreach (var sStatus in _builder.Sheet<Saint.Status>())
                BuildStatus(sStatus);
        }

        dynamic BuildStatus(Saint.Status sStatus)
        {
            dynamic status = new JObject();
            status.id = sStatus.Key;

            iStatusById.TryGetValue(sStatus.Key, out var iStatus);

            _builder.Localize.Strings((JObject)status, sStatus, iStatus, false, "Name");
            _builder.Localize.HtmlStrings((JObject)status, sStatus, iStatus, "Description");
            status.patch = PatchDatabase.Get("status", sStatus.Key);
            status.category = sStatus.Category;

            status.canDispel = sStatus.CanDispel;

            // If the status doesn't have an icon, we probably don't want it in our data
            if (sStatus.Icon != null && !sStatus.Icon.Path.EndsWith("000000.tex"))
                status.icon = IconDatabase.EnsureEntry("status", sStatus.Icon);
            else
                return null;

            _builder.Db.Statuses.Add(status);
            _builder.Db.StatusesById[sStatus.Key] = status;

            return status;
        }
    }
}
