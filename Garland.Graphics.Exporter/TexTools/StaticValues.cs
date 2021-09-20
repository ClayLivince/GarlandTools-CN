using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using xivModdingFramework.General.Enums;

namespace Garland.Graphics.Exporter.TexTools
{
    public static class XivStrings
    {
        public static string Character => "Character";
        public static string Tail => "Tail";
        public static string Hair => "Hair";
        public static string Face => "Face";
        public static string Body => "Body";
    }

    public static class XivStringRaces
    {
        public static string Aura_R => "Au Ra Raen";
        public static string Aura_X => "Au Ra Xaela";
        public static string Hyur_H => "Hyur Highlander";
        public static string Hyur_M => "Hyur Midlander";

        public static string ToRaceGenderName(XivRace race)
        {
            switch (race)
            {
                case XivRace.Hyur_Midlander_Male:
                    return "人族 中原之民 男性";

                case XivRace.Hyur_Midlander_Female:
                    return "人族 中原之民 女性";

                case XivRace.Hyur_Highlander_Male:
                    return "人族 高地之民 男性";

                case XivRace.Hyur_Highlander_Female:
                    return "人族 高地之民 女性";

                case XivRace.Elezen_Male:
                    return "精灵 男性";

                case XivRace.Elezen_Female:
                    return "精灵 女性";

                case XivRace.Miqote_Male:
                    return "猫魅 男性";

                case XivRace.Miqote_Female:
                    return "猫魅 女性";

                case XivRace.Roegadyn_Male:
                    return "鲁加 男性";

                case XivRace.Roegadyn_Female:
                    return "鲁加 女性";

                case XivRace.Lalafell_Male:
                    return "拉拉菲尔 男性";

                case XivRace.Lalafell_Female:
                    return "拉拉菲尔 女性";

                case XivRace.AuRa_Male:
                    return "敖龙 男性";

                case XivRace.AuRa_Female:
                    return "敖龙 女性";

                case XivRace.All_Races:
                    return "全部";

                case XivRace.Monster:
                    return "";

                case XivRace.Hrothgar:
                    return "硌狮";

                case XivRace.Viera:
                    return "维埃拉";

                case XivRace.DemiHuman:
                case XivRace.Hyur_Midlander_Male_NPC:
                case XivRace.Hyur_Midlander_Female_NPC:
                case XivRace.Hyur_Highlander_Male_NPC:
                case XivRace.Hyur_Highlander_Female_NPC:
                case XivRace.Elezen_Male_NPC:
                case XivRace.Elezen_Female_NPC:
                case XivRace.Miqote_Male_NPC:
                case XivRace.Miqote_Female_NPC:
                case XivRace.Lalafell_Male_NPC:
                case XivRace.Lalafell_Female_NPC:
                case XivRace.AuRa_Male_NPC:
                case XivRace.AuRa_Female_NPC:
                case XivRace.Roegadyn_Male_NPC:
                case XivRace.Roegadyn_Female_NPC:
                case XivRace.NPC_Male:
                case XivRace.NPC_Female:
                default:
                    Console.WriteLine(race.ToString());
                    throw new NotImplementedException();
            }
        }
    }

    public class Settings
    {
        public static Settings Default { get; } = new Settings();

        public string Skin_Color => "#FFFFFFFF";
        public string Hair_Color => "#FF603913";
        public string Iris_Color => "#FF603913";
        public string Etc_Color => "#FF603913";
        public string Default_Race => "Hyur Midlander";
        public string DX_Version = "11";
    }
}
