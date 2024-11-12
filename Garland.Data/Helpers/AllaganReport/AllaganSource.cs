using Garland.Data.Web;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Helpers.AllaganReport
{
    public abstract class AllaganSource
    {
        internal DatabaseBuilder _builder;
        string _category;
        private JsonClient _client;

        internal AllaganSource(DatabaseBuilder builder, string category)
        {
            _builder = builder;
            _category = category;
            _client = builder.WebJsonClient;
        }
        
        public void QueryAndImport()
        {
            var reports = Query();
            foreach (var report in reports)
            {
                try
                {
                    if (_builder.Db.ItemsById.TryGetValue((int)report["itemId"].Value, out dynamic item)){
                        JObject dataFixture;
                        if (report["data"].Type == JTokenType.String)
                        {
                            dataFixture = (JObject)JsonConvert.DeserializeObject(report["data"].ToString());
                        }
                        else if (report["data"].Type == JTokenType.Object || report["data"] is JObject)
                        {
                            dataFixture = report["data"] as JObject;
                        }
                        else
                        {
                            throw new NotImplementedException($"Undetermined Desynth data. {report["data"]} for {report["itemId"]}");
                        }
                        Import(dataFixture, item);
                        IndexAllaganReport(_category, item);
                    }
                    else
                    {
                        DatabaseBuilder.PrintLine($"Item with id {report["itemId"]} is not found.");
                    }
                    
                }
                catch (Exception ex)
                {
                    DatabaseBuilder.PrintLine($"Failed to import Allagan report fixture type {_category} report {report}.");
                }
            }
        }

        public dynamic Query()
        {
            dynamic req = new JObject();
            req.operationName = "GarlandToolsCategoryImport";
            req.query = "query GarlandToolsCategoryImport($source: String!) { allagan_reports(where: {source: {_eq: $source}}) {source\ndata\ncreated_at\nupdated_at\nitemId\ngt}}";
            req.variables = new JObject();
            req.variables["source"] = _category;

            return _client.Post("https://gubal.ffxivteamcraft.com/graphql", req).data.allagan_reports;
        }

        public abstract void Import(JObject report, dynamic item);

        public void IndexAllaganReport(string source, dynamic item)
        {
            if (item.alla == null)
                item.alla = new JObject();

            if (item.alla["source"] == null)
                item.alla["source"] = new JArray();

            if (!item.alla["source"].Contains(source))
                item.alla["source"].Add(source);
        }
    }
}
