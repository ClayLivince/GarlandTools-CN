using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Garland.Data.Lodestone
{
    public class WebScraper
    {
        protected int _sleepMin = 10;
        protected int _sleepMax = 40;
        private Random _random = new Random();
        private HttpClient _httpClient = new HttpClient();

        protected string Request(string url)
        {
            var response = GetResponse(url);
            var reader = new StreamReader(response.Content.ReadAsStream());
            return reader.ReadToEnd();
        }

        protected byte[] RequestBytes(string url)
        {
            var response = GetResponse(url);

            var bytes = response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult();
            return bytes;
        }

        private HttpResponseMessage GetResponse(string url)
        {
            var sleep = _random.Next(_sleepMin, _sleepMax);
            Thread.Sleep(sleep);

            for (var i = 0; i < 5; i++)
            {
                try
                {
                    var request = new HttpRequestMessage()
                    {
                        Method = HttpMethod.Get,
                        RequestUri = new Uri(url)
                    };
                    request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
                    var res = _httpClient.Send(request);
                    if (res.IsSuccessStatusCode)
                    {
                        return res;
                    }
                    else
                    {
                        DatabaseBuilder.PrintLine($"{res.StatusCode} : {i} / 5 : {url}");
                    }
                }
                catch (WebException ex)
                {
                    System.Diagnostics.Debug.WriteLine(ex.Message);

                    if (ex.Message.Contains("Bad Gateway"))
                    {
                        Thread.Sleep(3000);
                        continue;
                    }
                    else
                        throw;
                }
            }

            throw new InvalidOperationException("Too many failures retrieving: " + url);
        }
    }
}
