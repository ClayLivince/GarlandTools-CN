using ImageMagick;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using xivModdingFramework.General;
using xivModdingFramework.General.Enums;
using xivModdingFramework.Items.Categories;
using xivModdingFramework.Items.DataContainers;
using xivModdingFramework.Items.Interfaces;
using xivModdingFramework.Materials.FileTypes;
using xivModdingFramework.Models.DataContainers;
using xivModdingFramework.Models.FileTypes;
using xivModdingFramework.Models.ModelTextures;
using xivModdingFramework.Cache;

namespace Garland.Graphics.Exporter
{
    class Program
    {
        const string ConfigPath = @"..\\..\\..\\Config.json";

        static string _repoPath;
        static string _gamePath;

        static DirectoryInfo _gameDir;
        static Obj _ttObj;
        static Gear _gear;
        static Companions _companions;
        static Housing _housing;
        static ExportRepository _repo;

        static void Main(string[] args)
        {
            ReadConfig();

            var lang = XivLanguage.Chinese;

            _gameDir = new DirectoryInfo(_gamePath);
            XivCache.SetGameInfo(_gameDir, XivLanguage.Chinese);

            _ttObj = new Obj(_gameDir);
            _gear = new Gear(_gameDir, lang);
            _companions = new Companions(_gameDir, lang);
            _housing = new Housing(_gameDir, lang);

            BatchExport();

            Console.WriteLine("Done");
            Console.ReadKey();
        }

        static void ReadConfig()
        {
            var text = File.ReadAllText(ConfigPath);
            dynamic values = JsonConvert.DeserializeObject(text);
            _repoPath = Path.Combine((string)values.files, "models");
            _gamePath = Path.Combine((string)values.gamePath, @"game\sqpack\ffxiv");
        }

        static void BatchExport()
        {
            _repo = new ExportRepository(Path.Combine(_repoPath, "repo"));

            // Gear
            var badGear = new HashSet<string>(new[]
            {
                "Doman Iron Hatchet", "Doman Iron Pickaxe",
                "Mammon Lucis", "Kurdalegon Lucis", "Rauni Lucis",
                "Kurdalegon Supra", "Rauni Supra",
                "SmallClothes Body", "SmallClothes Feet", "SmallClothes Legs", "SmallClothes Body (NPC)",  "SmallClothes Feet (NPC)", "SmallClothes Feet 2 (NPC)", "SmallClothes Legs (NPC)"
            });

            var gearList = _gear.GetUnCachedGearList().Result.Where(g => !badGear.Contains(g.Name));

            
            foreach (var item in gearList)
            {
                if (item.Name.StartsWith("过期"))
                {
                    WriteLine($"Jumped Outdated Item {item.GetType().Name} {item.Name}");
                    continue;
                }
                    
                var primaryPath = EnsurePath(item.EquipSlotCategory.ToString(), item.ModelInfo);
                BatchExportItem(primaryPath, item, null, () => _gear.GetRacesForModels(item, item.DataFile).Result);

                // Seconday Model has been deprecated. then just comment here for future changes,
                /*
                if (item.ModelInfo == null) {
                    Console.WriteLine("Error exporting " + item.Name);
                    continue;
                }
                if (item.ModelInfo.SecondaryID != 0)
                {
                    var secondaryPath = EnsurePath(item.EquipSlotCategory.ToString(), item.ModelInfo);
                    BatchExportItem(secondaryPath, item, item.ModelInfo, () => _gear.GetRacesForModels(item, item.DataFile).Result);
                }
                */
            }

            var monsters = new XivRace[] { XivRace.Monster };

            // Minions
            /*
            var minionList = _companions.GetUncachedMinionList().Result;
            foreach (var minion in minionList)
            {
                var modelKey = $"{minion.ModelInfo.PrimaryID}-{minion.ModelInfo.SecondaryID}-{minion.ModelInfo.ImcSubsetID}";
                var path = EnsurePath("minion", modelKey);
                try
                {
                    BatchExportItem(path, minion, null, () => monsters);
                }
                catch (Exception ex) {
                    Console.WriteLine("Error Exporting " + minion.Name);
                }
                
            }
            

            // Mounts
            var mountList = _companions.GetUncachedMountList().Result;
            foreach (var mount in mountList)
            {
                var modelKey = $"{mount.ModelInfo.PrimaryID}-{mount.ModelInfo.SecondaryID}-{mount.ModelInfo.ImcSubsetID}";
                var path = EnsurePath("mount", modelKey);
                BatchExportItem(path, mount, null, () => monsters);
            }
            */

            // Housing
            var furnitureList = _housing.GetUncachedFurnitureList().Result;
            foreach (var furniture in furnitureList)
            {
                var modelKey = $"{furniture.ModelInfo.PrimaryID}";
                var path = EnsurePath("furniture", modelKey);

                try
                {
                    BatchExportItem(path, furniture, null, () => monsters);
                }
                catch (Exception ex)
                {
                    WriteLine($"Unable to export {furniture.Name}: {ex.Message}");
                }
            }
        }

        static void BatchExportItem(string path, IItemModel item, XivModelInfo secondaryModelInfo, Func<IEnumerable<XivRace>> getRaces)
        {
            if (File.Exists(path))
                return;

            //WriteLine($"Exporting {item.GetType().Name} {item.Name}: {Path.GetFileNameWithoutExtension(path)}");

            var metadata = new ExportMetadata();
            metadata.Name = item.Name;

            var mdl = new Mdl(_gameDir, item.DataFile);
            var races = getRaces();
            foreach (var race in races)
            {
                    var mdlData = mdl.GetRawMdlData(item, race).Result;

                    var textures = TexTools.MaterialsHelper.GetMaterials(_gameDir, item, mdlData, race);

                    try
                    {
                        var set = BatchExportSet(mdlData, textures);
                        set.Name = TexTools.XivStringRaces.ToRaceGenderName(race);
                        metadata.Sets.Add(set);
                    }
                    catch (NotImplementedException e)
                    {

                    }
               
                
                
                
                
            }

            var metadataJson = JsonConvert.SerializeObject(metadata);
            File.WriteAllText(path, metadataJson);

            WriteLine($"Exported {item.GetType().Name} {item.Name}: {Path.GetFileNameWithoutExtension(path)}");
        }

        static ExportSetMetadata BatchExportSet(XivMdl mdlData, Dictionary<int, ModelTextureData> textures)
        {
            var set = new ExportSetMetadata();

            TTModel model = TTModel.FromRaw(mdlData);
            foreach (var meshData in model.MeshGroups)
            {
                var modelMetadata = new ExportModelMetadata();

                // Obj
                var objString = _ttObj.ExportObj(meshData);
                var objBytes = System.Text.Encoding.ASCII.GetBytes(objString);
                modelMetadata.Obj = _repo.Write(".obj", objBytes);

                // Textures
                try
                {
                    var textureData = textures[model.Materials.IndexOf(meshData.Material)];
                    var pixelSettings = new PixelReadSettings(textureData.Width, textureData.Height, StorageType.Char, PixelMapping.RGBA);
                    modelMetadata.Alpha = _repo.Write(textureData.Alpha, pixelSettings, false);
                    modelMetadata.Diffuse = _repo.Write(textureData.Diffuse, pixelSettings, true);
                    modelMetadata.Emissive = _repo.Write(textureData.Emissive, pixelSettings, false);
                    modelMetadata.Normal = _repo.Write(textureData.Normal, pixelSettings, true);
                    modelMetadata.Specular = _repo.Write(textureData.Specular, pixelSettings, false);

                    set.Models.Add(modelMetadata);
                }
                catch (Exception e) {
                    Console.WriteLine(e.Message);
                    continue;
                }
                
            }

            return set;
        }

        static string EnsurePath(string category, XivModelInfo modelInfo)
        {
            var modelKey = modelInfo.ModelKey.ToString().Replace(", ", "-");
            return EnsurePath(category, modelKey);
        }

        static string EnsurePath(string category, string modelKey)
        {
            var categoryPath = Path.Combine(_repoPath, category);
            Directory.CreateDirectory(categoryPath);
            return Path.Combine(categoryPath, modelKey) + ".json";

        }

        static void WriteLine(string str)
        {
            Console.WriteLine(str);
            Debug.WriteLine(str);
        }
    }
}
