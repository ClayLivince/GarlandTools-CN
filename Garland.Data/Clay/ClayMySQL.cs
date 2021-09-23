using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;

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

        public int getItemID(String itemNameEnglish) 
        {
            if (conn.State != System.Data.ConnectionState.Open)
                Init();

            
            String query = string.Format("SELECT Id from item_en where Name=\"{0}\";", itemNameEnglish);
            MySqlCommand cmd = new MySqlCommand(query, conn);
            Object result = cmd.ExecuteScalar();
            if (result != null)
            {
                int id = int.Parse(result.ToString());
                return id;
            }
            else
            {
                throw new NotSupportedException(string.Format("Item name {0} not found in database.", itemNameEnglish));
            }
        }

        public int getItemIDChs(String itemNameChs)
        {
            if (conn.State != System.Data.ConnectionState.Open)
                Init();


            String query = string.Format("SELECT Id from item_chs where Singular=\"{0}\";", itemNameChs);
            MySqlCommand cmd = new MySqlCommand(query, conn);
            Object result = cmd.ExecuteScalar();
            if (result != null)
            {
                int id = int.Parse(result.ToString());
                return id;
            }
            else
            {
                throw new NotSupportedException(string.Format("Item name {0} not found in database.", itemNameChs));
            }
        }


        public string getItemNameChs(string itemNameEnglish)
        {
            int id = getItemID(itemNameEnglish);

            String query = string.Format("SELECT Singular from item_chs where Id=\"{0}\";", id);
            MySqlCommand cmd = new MySqlCommand(query, conn);
            Object result = cmd.ExecuteScalar();
            if (result != null)
            {
                string name = result.ToString();
                return name;
            }
            else
            {
                throw new NotSupportedException(string.Format("Item name {0} not found in  database.", itemNameEnglish));
            }
        }

        public string getItemNameEn(string itemNameChs)
        {
            int id = getItemID(itemNameChs);

            String query = string.Format("SELECT Name from item_en where Id=\"{0}\";", id);
            MySqlCommand cmd = new MySqlCommand(query, conn);
            Object result = cmd.ExecuteScalar();
            if (result != null)
            {
                string name = result.ToString();
                return name;
            }
            else
            {
                throw new NotSupportedException(string.Format("Item name {0} not found in  database.", itemNameChs));
            }
        }

        public int getPlaceNameID(String placeNameEnglish)
        {
            if (conn.State != System.Data.ConnectionState.Open)
                Init();

            
            String query = string.Format("SELECT Id from placename_en where Name=\"{0}\";", placeNameEnglish);
            MySqlCommand cmd = new MySqlCommand(query, conn);
            Object result = cmd.ExecuteScalar();
            if (result != null)
            {
                int id = int.Parse(result.ToString());
                return id;
            }
            else
            {
                throw new NotSupportedException(string.Format("Place name {0} not found in database.", placeNameEnglish));
            }
        }

        public string getPlaceNameChs(string placeNameEnglish) 
        {
            if (conn.State != System.Data.ConnectionState.Open)
                Init();


            String query = string.Format("SELECT Name_Chs from placename where Name=\"{0}\";", placeNameEnglish);
            MySqlCommand cmd = new MySqlCommand(query, conn);
            Object result = cmd.ExecuteScalar();
            if (result != null)
            {
                string resultStr = result.ToString();
                return resultStr;
            }
            else
            {
                throw new NotSupportedException(string.Format("Place name {0} not found in database.", placeNameEnglish));
            }
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
