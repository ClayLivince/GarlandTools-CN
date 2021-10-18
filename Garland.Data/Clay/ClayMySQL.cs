using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Garland.Data.Clay
{
    public class ClayMySQL
    {
        MySqlConnection conn;
        private readonly String connectionStr = Config.TranslationConnectionString;

        public ClayMySQL()
        {
            Init();
        }

        public void Init()
        {
            conn = new MySqlConnection(connectionStr);
            try
            {
                conn.Open();
            }
            catch (MySqlException e) {
                Console.WriteLine(e.Message);
                throw e;
            }
        }

        public List<dynamic> getAllBNpcs() {
            if (conn.State != System.Data.ConnectionState.Open)
                Init();

            String query = "Select * from bnpc;";
            MySqlDataReader reader = new MySqlCommand(query, conn).ExecuteReader();

            List<dynamic> list = new List<dynamic>();

            while (reader.Read()) {
                dynamic bnpc = new JObject();
                bnpc.baseid = reader.GetString(0);
                bnpc.nameid = reader.GetString(2);
                bnpc.lvl = reader.GetString(3);
                bnpc.maps = reader.GetString(4);
                bnpc.hp = reader.GetString(5);

                if (bnpc.nameid.Value != "")

                    list.Add(bnpc);
            }

            reader.Close();
            return list;
        }

        public string getWeatherChs(string weatherEng) {
            if (conn.State != System.Data.ConnectionState.Open)
                Init();


            String query = string.Format("SELECT Name_Chs from weather where Name=\"{0}\";", weatherEng);
            MySqlCommand cmd = new MySqlCommand(query, conn);
            Object result = cmd.ExecuteScalar();
            if (result != null)
            {
                String resultStr = result.ToString();
                return resultStr;
            }
            else
            {
                throw new NotSupportedException(string.Format("Weather name {0} not found in  database.", weatherEng));
            }

        }

        public string getInstanceChs(string instanceEng)
        {
            if (conn.State != System.Data.ConnectionState.Open)
                Init();


            String query = string.Format("SELECT Name_Chs from instance where Name=\"{0}\";", instanceEng);
            MySqlCommand cmd = new MySqlCommand(query, conn);
            Object result = cmd.ExecuteScalar();
            if (result != null)
            {
                String resultStr = result.ToString();
                return resultStr;
            }
            else
            {
                throw new NotSupportedException(string.Format("Instance name {0} not found in  database.", instanceEng));
            }

        }

        public string getRetainerTaskChs(string taskEng)
        {
            if (conn.State != System.Data.ConnectionState.Open)
                Init();


            String query = string.Format("SELECT Name_Chs from retainertaskrandom where Name=\"{0}\";", taskEng);
            MySqlCommand cmd = new MySqlCommand(query, conn);
            Object result = cmd.ExecuteScalar();
            if (result != null)
            {
                String resultStr = result.ToString();
                return resultStr;
            }
            else
            {
                throw new NotSupportedException(string.Format("Retainer Task name {0} not found in  database.", taskEng));
            }

        }

        public void Stop()
        {
            if (conn.State == System.Data.ConnectionState.Open)
            {
                try
                {
                    conn.Close();
                    conn.Dispose();
                }
                catch (MySqlException e)
                {
                    Console.WriteLine(e.Message);
                    throw e;
                }
            }
        }
    }

    
}
