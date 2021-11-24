using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Garland.Data.Lodestone;

namespace Garland.Data.Scraper
{
    public class ChoreScraper : WebScraper
    {
        public void EnsureAllFiles(bool refresh)
        {
            EnsureFile("Mappy.csv",
                "https://xivapi.com/download?data=map_data", refresh);
            
            EnsureFile("Duties.json",
                "https://github.com/ClayLivince/FFXIV-Lodestone-Duty-Scraper/raw/main/FFXIV%20Data%20-%20Duties.json",
                refresh);

            // TODO: grab google doc
            EnsureFile("Nodes.tsv",
                "https://docs.google.com/spreadsheets/d/1hEj9KCDv0TT1NiGJ0S7afS4hfGMPb6tetqXQetYETUE/export?format=tsv&id=1hEj9KCDv0TT1NiGJ0S7afS4hfGMPb6tetqXQetYETUE&gid=1571190523",
                refresh);

            EnsureFile("Fates.tsv",
                "https://docs.google.com/spreadsheets/d/1hEj9KCDv0TT1NiGJ0S7afS4hfGMPb6tetqXQetYETUE/export?format=tsv&id=1hEj9KCDv0TT1NiGJ0S7afS4hfGMPb6tetqXQetYETUE&gid=367355868",
                refresh);

            EnsureFile("Fishing.tsv",
                "https://docs.google.com/spreadsheets/d/1hEj9KCDv0TT1NiGJ0S7afS4hfGMPb6tetqXQetYETUE/export?format=tsv&id=1hEj9KCDv0TT1NiGJ0S7afS4hfGMPb6tetqXQetYETUE&gid=953424709",
                refresh);

            EnsureFile("Mobs.tsv",
                "https://docs.google.com/spreadsheets/d/1hEj9KCDv0TT1NiGJ0S7afS4hfGMPb6tetqXQetYETUE/export?format=tsv&id=1hEj9KCDv0TT1NiGJ0S7afS4hfGMPb6tetqXQetYETUE&gid=1237632318",
                refresh);

            EnsureFile("Items.tsv",
                "https://docs.google.com/spreadsheets/d/1hEj9KCDv0TT1NiGJ0S7afS4hfGMPb6tetqXQetYETUE/export?format=tsv&id=1hEj9KCDv0TT1NiGJ0S7afS4hfGMPb6tetqXQetYETUE&gid=557462166",
                refresh);
        }

        private void EnsureFile(string filename, string url, bool refresh)
        {
            string path = Config.SupplementalPath + $"FFXIV Data - {filename}";

            if (File.Exists(path))
            {
                if (!refresh)
                    return;
            }

            File.WriteAllText(path, Request(url));
        }
    }
}
