using Garland.Data.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using Saint = SaintCoinach.Xiv;
using System.Diagnostics;
using System.IO;
using System.Text.RegularExpressions;

namespace Garland.Data.Modules
{
    public class QuestLores : Module
    {
        Dictionary<Tuple<string, string>, Dictionary<string, string>> _cutTextByLangExCode = new Dictionary<Tuple<string, string>, Dictionary<string, string>>();
        private static Dictionary<int, string> _EXPANSIONCODEINDEX = new Dictionary<int, string>() {
            { 0, "ffxiv" },
            { 1, "ex1" },
            { 2, "ex2" },
            { 3, "ex3" },
            { 4, "ex4" },
            { 5, "ex5" },
        };

        Regex textRegex = new Regex("TEXT_VOICEMAN_(\\d{5})_(\\d{6})_(.*?)\u0000");
        Dictionary<int, Saint.XivRow> cutsceneById = new Dictionary<int, Saint.XivRow>();

        HashSet<string> IgnoredLines = new HashSet<string>()
        {
            "dummy", "Dummy", "deleted",  "placeholder", "Marked for deletion",
            "（★未使用／削除予定★）"
        };
                
        public override string Name => "Quests";

        public override void Start()
        {
            foreach (var row in _builder.Sheet("Cutscene"))
            {
                cutsceneById[row.Key] = row;
            }
            int iter = 0;
            int totalQuestsCount = _builder.Sheet<Saint.Quest>().Count();
            foreach (var sQuest in _builder.Sheet<Saint.Quest>())
            {
                DatabaseBuilder.PrintLine($"{iter} - {totalQuestsCount}");
                if (sQuest.Key == 65536 || sQuest.Name == "")
                    continue; // Test quests
                ImportQuestLore(sQuest);
                iter += 1;
            }
        }

        string GetQuestExpansionCode(Saint.Quest sQuest)
        {
            return _EXPANSIONCODEINDEX[sQuest.As<Saint.XivRow>("Expansion").Key];
        }

        void ImportQuestLore(Saint.Quest sQuest)
        {
            var idParts = sQuest.Id.ToString().Split('_');
            var idPath = new string(idParts[1].Take(3).ToArray());
            var textSheetId = string.Format("quest/{0}/{1}", idPath, sQuest.Id);

            dynamic lore = new JObject();
            lore.id = sQuest.Key;
            

            foreach (var langTuple in _builder.Localize.Langs)
            {
                var langCode = langTuple.Item1;
                var lang = langTuple.Item2;
                _builder.Realm.GameData.ActiveLanguage = lang;

                dynamic localizedLore = new JObject();
                lore[langCode] = localizedLore;

                var textSheet = _builder.Sheet(textSheetId)
                .Select(r => new { r.Key, Tokens = r[0].ToString().Split('_'), XivString = (SaintCoinach.Text.XivString)r[1] });

                localizedLore.journal = new JArray();
                localizedLore.objectives = new JArray();
                localizedLore.dialogue = new JArray();

                string lastLine = null;

                foreach (var row in textSheet)
                {
                    var rawString = row.XivString.ToString();
                    if (IgnoredLines.Contains(rawString) || string.IsNullOrWhiteSpace(rawString))
                        continue;

                    var str = HtmlStringFormatter.Convert(row.XivString);
                    //if (str.Contains("Aye, an anima weapon")) // Has IntegerParameter(1) [Error] - need to pass proper eval parameters in.
                    //    System.Diagnostics.Debugger.Break();

                    if (row.Tokens.Contains("SEQ"))
                        localizedLore.journal.Add(str);
                    else if (row.Tokens.Contains("TODO"))
                    {
                        if (lastLine == str)
                        {
                            //System.Diagnostics.Debug.WriteLine("Skipping duplicate quest {0} objective: {1}", gameData.Key, lastLine);
                            continue;
                        }
                        localizedLore.objectives.Add(str);
                    }
                    else
                    {
                        dynamic obj = new JObject();

                        if (row.Tokens[3].All(char.IsDigit))
                            obj.name = row.Tokens[4];
                        else
                            obj.name = row.Tokens[3];

                        obj.text = str;
                        localizedLore.dialogue.Add(obj);
                    }

                    lastLine = str;
                }

                // Script instructions
                //if (instructions.Length > 0)
                //{
                //    quest.script = new JArray();
                //    foreach (var instruction in instructions)
                //    {
                //        if (string.IsNullOrEmpty(instruction.Instruction))
                //            continue;

                //        quest.script.Add(ImportInstruction(_builder, instruction));
                //    }
                //}
            }

            ImportCutsceneLore(sQuest, lore);
            _builder.Db.QuestLores.Add(lore);
        }

        void ImportCutsceneLore(Saint.Quest sQuest, dynamic lore)
        {
            // read instructions to identify Cutscene 
            var instructions = ScriptInstruction.Read(sQuest, 50);

            if (sQuest.JournalGenre?.Key != 0)
            {
                dynamic localizedCutscenes = new JObject();
                foreach (var langTuple in _builder.Localize.Langs)
                {
                    var langCode = langTuple.Item1;
                    localizedCutscenes[langCode] = new JArray();
                }

                foreach (var instruction in instructions)
                {
                    if (instruction.Label.StartsWith("NCUT") || instruction.Label.StartsWith("CUTSCENE") || instruction.Label.StartsWith("CUT_SCENE"))
                    {
                        dynamic localizedCutscene = new JObject();
                        foreach (var langTuple in _builder.Localize.Langs)
                        {
                            var langCode = langTuple.Item1;
                            localizedCutscene[langCode] = new JArray();
                        }

                        try
                        {
                            string label = instruction.Label;
                            int cutsceneId = (int)instruction.Argument;
                            string path;
                            if (cutsceneById.TryGetValue(cutsceneId, out var cutsceneRow))
                            {
                                path = "cut/" + cutsceneRow["Path"] + ".cutb";
                            }
                            else
                            {
                                string code = label.Substring(11);
                                string questCode = sQuest.Id.ToString().Substring(0, 6).ToLower();
                                path = "cut/" + GetQuestExpansionCode(sQuest) + "/" + questCode + "/" + questCode + code + "/" + questCode + code + ".cutb";
                            }
                            if (!_builder.Realm.Packs.TryGetFile(path, out var cutb))
                            {
                                DatabaseBuilder.PrintLine($"cutb file {path} not found.");
                                continue;
                            }

                            StreamReader reader = new StreamReader(cutb.GetStream());
                            string cutbFileText = reader.ReadToEnd();

                            MatchCollection matchCol = textRegex.Matches(cutbFileText);
                            foreach (Match match in matchCol)
                            {
                                string textIndex = match.Value.Substring(0, match.Value.Length - 1);
                                string exCode = match.Groups[1].Value.Trim();
                                string voiceIndex = match.Groups[2].Value.Trim();
                                string speaker = match.Groups[3].Value.Trim();

                                string voicePath = "notfound";
                                try
                                {
                                    voicePath = EnsureVoiceLine(GetQuestExpansionCode(sQuest), exCode, voiceIndex);
                                }
                                catch (Exception e)
                                {
                                    if (Debugger.IsAttached)
                                        Debugger.Break();
                                }

                                foreach (var langTuple in _builder.Localize.Langs)
                                {
                                    var langCode = langTuple.Item1;
                                    var lang = langTuple.Item2;
                                    _builder.Realm.GameData.ActiveLanguage = lang;

                                    dynamic obj = new JObject();
                                    string text = GetCutsceneText(langCode, exCode, textIndex);

                                    obj.name = speaker;
                                    obj.text = text;
                                    if (voicePath != "notfound")
                                        obj.voice = voicePath;

                                    localizedCutscene[langCode].Add(obj);
                                }
                            }
                            foreach (var langTuple in _builder.Localize.Langs)
                            {
                                var langCode = langTuple.Item1;
                                if (localizedCutscene[langCode].Count > 0)
                                {
                                    localizedCutscenes[langCode].Add(localizedCutscene[langCode]);
                                }
                            }
                        }
                        catch (Exception e)
                        {
                            if (Debugger.IsAttached)
                                Debugger.Break();
                        }
                    }
                }
                foreach (var langTuple in _builder.Localize.Langs)
                {
                    var langCode = langTuple.Item1;
                
                    if (localizedCutscenes[langCode].Count > 0)
                    {
                        lore[langCode].cutscenes = localizedCutscenes[langCode];
                    }
                }
            }
        }

        string GetCutsceneText(string lang, string ex, string code)
        {
            if (_cutTextByLangExCode.TryGetValue(new Tuple<string, string>(lang, ex), out var textByCode))
            {
                return textByCode[code];
            }
            else
            {
                var textSheetId = string.Format("cut_scene/{0}/VoiceMan_{1}", ex.Substring(0, 3), ex);
                var textSheet = _builder.Sheet(textSheetId);

                Dictionary<string, string> textByCodeN = new Dictionary<string, string>();
                foreach (var row in textSheet)
                {
                    textByCodeN[row[0].ToString()] = row[1].ToString();
                }

                _cutTextByLangExCode[new Tuple<string, string>(lang, ex)] = textByCodeN;
                return textByCodeN[code];
            }
        }

        string EnsureVoiceLine(string expansionCode, string ex, string voiceIndex)
        {
            // cut/ex3/sound/VOICEM/VOICEMAN_05300/vo_VOICEMAN_05300_002300_m_ja.scd
            var returnVoicePath = ex + "/" + voiceIndex;
            foreach (var langTuple in _builder.Localize.Langs)
            {
                var langCode = langTuple.Item1;
                var voiceDirectory = Path.Combine(Config.VoicePath, langCode, ex);
                
                try
                {
                    // var voicePath = ex + "/" + voiceIndex + ".ogg";
                    var fullPath = Path.Combine(voiceDirectory, voiceIndex + $".ogg");
                    if (File.Exists(fullPath))
                        continue;

                    // Write voices that don't yet exist.
                    Directory.CreateDirectory(voiceDirectory);

                    string path = string.Format("cut/{0}/sound/VOICEM/VOICEMAN_{1}/vo_VOICEMAN_{1}_{2}_m_{3}.scd", expansionCode, ex, voiceIndex, langCode);
                    _builder.Realm.Packs.TryGetFile(path, out var scdRaw);
                    if (scdRaw == null)
                    {
                        DatabaseBuilder.PrintLine($"Failed to get voice file of {path}.");
                        return "notfound";
                    }
                    DatabaseBuilder.PrintLine($"Extracting {path}");
                    var sScdFile = new SaintCoinach.Sound.ScdFile(scdRaw);
                    var sEntry = sScdFile.Entries[0];
                    if (sEntry == null)
                        return "notfound";

                    // File.WriteAllBytes(fullPath, sEntry.GetDecoded());

                    var baseFileName = Path.Combine(Config.TempPath, "input.ogg");
                    var outFileName = Path.Combine(Config.TempPath, "output.ogg");
                    File.WriteAllBytes(baseFileName, sEntry.GetDecoded());


                    var ffmpeg = new Process();
                    ffmpeg.StartInfo = new ProcessStartInfo(Config.FfmpegPath, $"-i {baseFileName} -acodec libvorbis -b:a 128k {outFileName}");
                    ffmpeg.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
                    ffmpeg.StartInfo.CreateNoWindow = true;
                    ffmpeg.Start();
                    ffmpeg.WaitForExit();


                    File.Move(outFileName, fullPath);
                }
                catch (Exception e)
                {
                    DatabaseBuilder.PrintLine($"Some error happened while handling voice line.");
                    if (Debugger.IsAttached)
                        Debugger.Break();
                }
            }
            return returnVoicePath;
        }
    }
}
