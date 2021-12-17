using System;
using SaintCoinach;
using Saint = SaintCoinach.Xiv;
using Garland.Data;

using System.IO;
using Newtonsoft.Json;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace SmallDataExporter
{
    class Program
    {
        static Dictionary<int, Saint.Item> iItems = new Dictionary<int, Saint.Item>();
        
        static void Main(string[] args)
        {
            Config.Load();
            var libraPath = System.IO.Path.Combine(Config.SupplementalPath, "app_data.sqlite");
            var realm = new SaintCoinach.ARealmReversed(Config.GamePath, "SaintCoinachcn.History.zip", SaintCoinach.Ex.Language.ChineseSimplified, libraPath, "cn");
            var interRealm = new SaintCoinach.ARealmReversed(Config.InterGamePath, "SaintCoinach.History.zip", SaintCoinach.Ex.Language.English, libraPath);
            var libra = new SQLite.SQLiteConnection(libraPath, SQLite.SQLiteOpenFlags.ReadOnly);

            foreach (var item in realm.GameData.GetSheet<Saint.Item>())
            {
                iItems[item.Key] = item;
            }
            List<dynamic> output = new List<dynamic>();
            Localize localize = new Localize(realm, interRealm);
            foreach (var item in interRealm.GameData.GetSheet<Saint.Item>())
            {
                if (item.ItemUICategory.Key == 47)
                {
                    dynamic fish = new JObject();
                    fish.id = item.Key;
                    iItems.TryGetValue(item.Key, out var itemchs);
                    localize.Strings(fish, itemchs, item, "Name");
                    output.Add(fish);
                }
            }

            File.WriteAllText("fish.json", JsonConvert.SerializeObject(output, Formatting.Indented));
        }
    }
}
