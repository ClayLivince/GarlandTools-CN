using Newtonsoft.Json.Linq;
using SaintCoinach;
using SaintCoinach.Ex;
using SaintCoinach.Text;
using SaintCoinach.Xiv;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data
{
    public class Localize
    {
        private ARealmReversed _realm;
        private ARealmReversed _interRealm;
        private readonly XivCollection _data;
        private readonly XivCollection _interData;
        private readonly Tuple<string, Language>[] _langs;
        public Tuple<string, Language>[] Langs => _langs;
        private readonly Tuple<string, Language>[] _interLangs;

        public Localize(ARealmReversed realm, ARealmReversed interRealm)
        {
            _realm = realm;
            _interRealm = interRealm;
            _data = realm.GameData;
            _interData = interRealm.GameData;
            _langs = new Tuple<string, Language>[]
            {
                Tuple.Create(Language.ChineseSimplified.GetCode(), Language.ChineseSimplified)
            };
            _interLangs = new Tuple<string, Language>[]
            {
                Tuple.Create(Language.English.GetCode(), Language.English),
                Tuple.Create(Language.Japanese.GetCode(), Language.Japanese),
                Tuple.Create(Language.French.GetCode(), Language.French),
                Tuple.Create(Language.German.GetCode(), Language.German)
            };
        }

        public void Strings(JObject obj, IXivRow row, IXivRow interRow, bool doTry, Func<XivString, string> transform, params string[] cols)
        {
            if (row != null) {
                var currentLang = _data.ActiveLanguage;
                foreach (var langTuple in _langs)
                {
                    var code = langTuple.Item1;
                    var lang = langTuple.Item2;
                    _data.ActiveLanguage = lang;

                    if (!obj.TryGetValue(code, out var strs))
                        obj[code] = strs = new JObject();

                    foreach (var col in cols)
                    {
                        object value;

                        if (doTry)
                        {
                            try
                            {
                                if ("Name".Equals(col) && code.Equals("chs"))
                                    value = row["Singular"];
                                else value = row[col];
                            }
                            catch (KeyNotFoundException)
                            {
                                value = row[col];
                            }
                        }
                        else { 
                            value = row[col];
                        }

                        if (value is XivString && string.IsNullOrEmpty((XivString)value))
                            continue;

                        var sanitizedCol = col.ToLower().Replace("{", "").Replace("}", "");
                        strs[sanitizedCol] = transform == null ? (value.ToString().TrimEnd()) : transform((XivString)value);
                    }
                }
                _data.ActiveLanguage = currentLang;
            }
            
            if (interRow != null && (interRow.Key != 0 || !string.IsNullOrEmpty(interRow.ToString())))
            {
                var iCurrentLang = _interData.ActiveLanguage;
                foreach (var langTuple in _interLangs)
                {
                    var code = langTuple.Item1;
                    var lang = langTuple.Item2;
                    _interData.ActiveLanguage = lang;
                    if (!obj.TryGetValue(code, out var strs))
                        obj[code] = strs = new JObject();

                    foreach (var col in cols)
                    {
                        var value = interRow[col];
                        if (value is XivString && string.IsNullOrEmpty((XivString)value))
                            continue;

                        var sanitizedCol = col.ToLower().Replace("{", "").Replace("}", "");
                        strs[sanitizedCol] = transform == null ? (value.ToString().TrimEnd()) : transform((XivString)value);
                    }
                }
                _interData.ActiveLanguage = iCurrentLang;
            }    
        }

        public void Strings(JObject obj, IXivRow row, IXivRow interRow, Func<XivString, string> transform, params string[] cols) {
            Strings(obj, row, interRow, true, transform, cols);
        }

        public void Strings(JObject obj, IXivRow row, IXivRow interRow, params string[] cols)
        {
            Strings(obj, row, interRow, null, cols);
        }

        public void Strings(JObject obj, IXivRow row, IXivRow interRow, bool doTry, params string[] cols)
        {
            Strings(obj, row, interRow, doTry, null, cols);
        }

        public void Strings(JObject obj, IXivRow row, params string[] cols)
        {
            Strings(obj, row, null, null, cols);
        }

        public void HtmlStrings(JObject obj, IXivRow row, IXivRow interRow, params string[] cols)
        {
            Strings(obj, row, interRow, HtmlStringFormatter.Convert, cols);
        }

        public void HtmlStrings(JObject obj, IXivRow row, params string[] cols)
        {
            Strings(obj, row, null, HtmlStringFormatter.Convert, cols);
        }

        public void Column(JObject obj, IXivRow row, IXivRow interRow, string fromColumn, string toColumn, Func<XivString, string> transform = null)
        {
            if (row != null)
            {
                var currentLang = _data.ActiveLanguage;

                foreach (var langTuple in _langs)
                {
                    var code = langTuple.Item1;
                    var lang = langTuple.Item2;
                    _data.ActiveLanguage = lang;

                    if (!obj.TryGetValue(code, out var strs))
                        obj[code] = strs = new JObject();

                    var value = row[fromColumn];
                    var toValue = transform == null ? (value.ToString()) : transform((XivString)value);
                    if (string.IsNullOrEmpty(toValue))
                        continue;

                    strs[toColumn] = toValue;
                }

                _data.ActiveLanguage = currentLang;
            }

            if (interRow != null && (interRow.Key != 0 || !string.IsNullOrEmpty(interRow.ToString())))
            {
                var currentLang = _interData.ActiveLanguage;
                foreach (var langTuple in _interLangs)
                {
                    var code = langTuple.Item1;
                    var lang = langTuple.Item2;
                    _interData.ActiveLanguage = lang;

                    if (!obj.TryGetValue(code, out var strs))
                        obj[code] = strs = new JObject();

                    var value = interRow[fromColumn];
                    var toValue = transform == null ? (value.ToString()) : transform((XivString)value);
                    if (string.IsNullOrEmpty(toValue))
                        continue;

                    strs[toColumn] = toValue;
                }
                _interData.ActiveLanguage = currentLang;
            }
        }

        public void Column(JObject obj, IXivRow row, string fromColumn, string toColumn, Func<XivString, string> transform = null) {
            Column(obj, row, null, fromColumn, toColumn, transform);
        }

        public Tuple<string, Language>[] AvailableLangs()
        {
            return _langs.Concat(_interLangs).ToArray();
        }
    }
}
