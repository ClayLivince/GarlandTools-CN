using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Saint = SaintCoinach.Xiv;

namespace Garland.Data.Modules
{
    public class Orchestrion : Module
    {
        string _resultMusicPath;
        string _resultMusicPathFull;

        public override string Name => "Orchestrion";

        public override void Start()
        {
            _resultMusicPath = Path.Combine(Config.FilesPath, "orchestrion");
            _resultMusicPathFull = Path.Combine(Config.SupplementalPath, "orchestrion");
            Directory.CreateDirectory(_resultMusicPath);
            Directory.CreateDirectory(_resultMusicPathFull);
            Directory.CreateDirectory("output");

            //var sOrchestrions = _builder.Sheet("Orchestrion");
            var sOrchestrionUiparams = _builder.Sheet("OrchestrionUiparam");

            foreach (var sItem in _builder.Sheet<Saint.Item>())
            {
                var unlock = sItem.ItemAction as Saint.ItemActions.OrchestrionRollUnlock;
                if (unlock == null)
                    continue;

                var sOrchestrion = sItem.AdditionalData as Saint.XivRow;
                if (sOrchestrion == null)
                    continue;

                var sOrchestrionUiparam = sOrchestrionUiparams[sOrchestrion.Key];

                var item = _builder.Db.ItemsById[sItem.Key];
                item.orchestrion = new JObject();
                item.orchestrion.id = sOrchestrion.Key;
                item.orchestrion.name = sOrchestrion.AsString("Name").ToString();
                item.orchestrion.description = HtmlStringFormatter.Convert(sOrchestrion.AsString("Description"));
                item.orchestrion.category = sOrchestrionUiparam["OrchestrionCategory"].ToString();
                item.orchestrion.order = sOrchestrionUiparam.AsInt32("Order");

                ExportOrchestrionMusic(sOrchestrion.Key, item.orchestrion);
            }
        }

        void ExportOrchestrionMusic(int orchestrionId, dynamic orchestrion)
        {
            // Skip if the file is already exported.
            var targetFileName = Path.Combine(_resultMusicPath, orchestrionId + ".ogg");
            var targetFileNameFull = Path.Combine(_resultMusicPathFull, Utils.SanitizeFileName($"{orchestrionId}_{orchestrion.name}.ogg"));

            if (File.Exists(targetFileName))
                return;

            var sOrchestrionPaths = _builder.Sheet("OrchestrionPath");
            var sPath = sOrchestrionPaths[orchestrionId];
            var filePath = sPath.AsString("File").ToString();
            if (!_builder.Realm.Packs.TryGetFile(filePath, out var sFile))
                return;

            var sScdFile = new SaintCoinach.Sound.ScdFile(sFile);
            if (!ExportClip(sScdFile, targetFileName, targetFileNameFull))
                DatabaseBuilder.PrintLine($"No SCD headers for orchestrion #{orchestrionId} {orchestrion.name}");
        }

        bool ExportClip(SaintCoinach.Sound.ScdFile sScdFile, string targetFileName, string targetFullFileName)
        {
            for (var i = 0; i < sScdFile.ScdHeader.EntryCount; i++)
            {
                var sEntry = sScdFile.Entries[i];
                if (sEntry == null)
                    continue;

                var baseFileName = Path.Combine("output\\input.ogg");
                File.WriteAllBytes(baseFileName, sEntry.GetDecoded());

                var ffmpeg = new Process();
                ffmpeg.StartInfo = new ProcessStartInfo(Config.FfmpegPath, "-ss 00:00:10.0 -t 00:00:25.0 -i output\\input.ogg -acodec libvorbis -b:a 32k output\\output.ogg");
                //ffmpeg.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
                ffmpeg.Start();
                ffmpeg.WaitForExit();

                File.Move("output\\output.ogg", targetFileName);

                File.Move("output\\input.ogg", targetFullFileName, true);

                return true;
            }

            return false;
        }
    }
}
