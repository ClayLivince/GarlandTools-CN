using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Output
{
    public class QuestLoreOutput
    {
        GarlandDatabase _db;
        UpdatePackage _update;
        readonly static JsonConverter[] _converters = new[] { new WrapperConverter() };
        readonly static string[] _languagesCodes = new[] { "chs" };

        public QuestLoreOutput(UpdatePackage update)
        {
            _db = GarlandDatabase.Instance;
            _update = update;
        }

        public void Write()
        {
            foreach (var lang in _languagesCodes)
            {
                WriteQuestLores(lang);
            }
        }

        void WriteQuestLores(string lang)
        {
            Parallel.ForEach(_db.QuestLores, lore =>
            {
                var wrapper = new JsWrapper(lang, "questlore", lore);
                _update.IncludeDocument((string)lore.id, "questlore", lang, 1, Wrapper(wrapper));
            });
        }

        static string Wrapper(object value)
        {
            return JsonConvert.SerializeObject(value, _converters);
        }

        static string Json(object value, Formatting formatting = Formatting.None)
        {
            return JsonConvert.SerializeObject(value, formatting);
        }
    }
}
