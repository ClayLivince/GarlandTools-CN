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
        private ARealmReversed _tcRealm;
        private readonly XivCollection _data;
        private readonly XivCollection _interData;
        private readonly XivCollection _tcData;
        private readonly Tuple<string, Language>[] _langs;
        public Tuple<string, Language>[] Langs => _langs;
        private readonly Tuple<string, Language>[] _interLangs;
        private readonly Tuple<string, Language>[] _tcLangs;

        public Localize(ARealmReversed realm, ARealmReversed interRealm, ARealmReversed tcRealm)
        {
            _realm = realm;
            _interRealm = interRealm;
            _tcRealm = tcRealm;

            _data = realm.GameData;
            _interData = interRealm.GameData;
            _tcData = tcRealm.GameData;

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
            _tcLangs = new Tuple<string, Language>[]
            {
                Tuple.Create(Language.TraditionalChinese.GetCode(), Language.TraditionalChinese)
            };
        }

        public void Strings(JObject obj, IXivRow row, bool doTry, Func<XivString, string> transform, params string[] cols)
        {
            var key = row.Key;
            var sheetName = row.Sheet.Name;

            IXivRow interRow = null;
            IXivRow tcRow = null;

            try
            {
                interRow = _interData.GetSheet(sheetName)[key];
            }
            catch (Exception ex) { }

            try
            {
                tcRow = _tcData.GetSheet(sheetName)[key];
            }
            catch (Exception ex) { }

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

            if (tcRow != null)
            {
                var tcCurrentLang = _tcData.ActiveLanguage;
                foreach (var langTuple in _tcLangs)
                {
                    var code = langTuple.Item1;
                    var lang = langTuple.Item2;
                    _tcData.ActiveLanguage = lang;

                    if (!obj.TryGetValue(code, out var strs))
                        obj[code] = strs = new JObject();

                    foreach (var col in cols)
                    {
                        var value = tcRow[col];
                        if (value is XivString && string.IsNullOrEmpty((XivString)value))
                            continue;

                        var sanitizedCol = col.ToLower().Replace("{", "").Replace("}", "");
                        strs[sanitizedCol] = transform == null ? (value.ToString().TrimEnd()) : transform((XivString)value);
                    }
                }
                _tcData.ActiveLanguage = tcCurrentLang;
            }

        }

        public void Strings(JObject obj, IXivRow row, Func<XivString, string> transform, params string[] cols) {
            Strings(obj, row, true, transform, cols);
        }

        public void Strings(JObject obj, IXivRow row, bool doTry, params string[] cols)
        {
            Strings(obj, row, doTry, null, cols);
        }

        public void Strings(JObject obj, IXivRow row, params string[] cols)
        {
            Strings(obj, row, false, null, cols);
        }

        public void HtmlStrings(JObject obj, IXivRow row, params string[] cols)
        {
            Strings(obj, row, HtmlStringFormatter.Convert, cols);
        }


        public void Column(JObject obj, IXivRow row, string fromColumn, string toColumn, Func<XivString, string> transform = null)
        {
            var key = row.Key;
            var sheetName = row.Sheet.Name;

            IXivRow interRow = null;
            IXivRow tcRow = null;

            try
            {
                interRow = _interData.GetSheet(sheetName)[key];
            }
            catch (Exception ex) { }

            try
            {
                tcRow = _tcData.GetSheet(sheetName)[key];
            }
            catch (Exception ex) { }

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

            if (tcRow != null && (tcRow.Key != 0 || !string.IsNullOrEmpty(tcRow.ToString())))
            {
                var currentLang = _tcData.ActiveLanguage;
                foreach (var langTuple in _tcLangs)
                {
                    var code = langTuple.Item1;
                    var lang = langTuple.Item2;
                    _tcData.ActiveLanguage = lang;

                    if (!obj.TryGetValue(code, out var strs))
                        obj[code] = strs = new JObject();

                    var value = tcRow[fromColumn];
                    var toValue = transform == null ? (value.ToString()) : transform((XivString)value);
                    if (string.IsNullOrEmpty(toValue))
                        continue;

                    strs[toColumn] = toValue;
                }
                _tcData.ActiveLanguage = currentLang;
            }
        }

        public Tuple<string, Language>[] AvailableLangs()
        {
            return _langs.Concat(_interLangs).ToArray();
        }
    }
}
