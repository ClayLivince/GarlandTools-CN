using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SaintCoinach.Xiv.ItemActions;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Policy;
using System.Text;
using System.Threading.Tasks;

namespace Garland.Data.Web
{
    public class JsonClient
    {
        private HttpClient _client = new HttpClient();

        public JsonClient()
        {
            _client.DefaultRequestHeaders.Add("User-Agent", $"GarlandTools-Client/{GarlandDatabase.NextPatch}");
        }

        private HttpResponseMessage Request(HttpRequestMessage request)
        {
            for (int i = 0; i < 5; i++)
            {
                try
                {
                    var res = _client.Send(request);
                    if (res.IsSuccessStatusCode)
                    {
                        return res;
                    }
                    DatabaseBuilder.PrintLine($"JsonWeb: {res.StatusCode} : {i} / {5} : {request.RequestUri}");
                } catch (Exception e)
                {
                    DatabaseBuilder.PrintLine($"JsonWeb: Failed {e} : {i} / {5} : {request.RequestUri}");
                }
            }
            throw new InvalidOperationException("Too many failures retrieving: " + request.RequestUri);
        }

        public dynamic Get(string url, Dictionary<string, string>? param)
        {
            HttpRequestMessage message = new HttpRequestMessage();
            message.Method = HttpMethod.Get;
            message.RequestUri = new Uri(url);

            var res = Request(message);

            var reader = new StreamReader(res.Content.ReadAsStream());
            var strres = reader.ReadToEnd();
            return JsonConvert.DeserializeObject(strres);
        }

        public dynamic Post(string url, JObject? data)
        {
            HttpContent content = new StringContent(JsonConvert.SerializeObject(data));
            HttpRequestMessage message = new HttpRequestMessage();
            message.Method = HttpMethod.Post;
            message.RequestUri = new Uri(url);
            message.Content = content;
            message.Content.Headers.ContentType = MediaTypeHeaderValue.Parse("application/json");
            
            var res = Request(message);

            var reader = new StreamReader(res.Content.ReadAsStream());
            var strres = reader.ReadToEnd();
            return JsonConvert.DeserializeObject(strres);
        }
    }
}
    
