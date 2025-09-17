using DisprzTraining.Models;

namespace DisprzTraining.DataAccess
{
    public class HelloWorldDAL : IHelloWorldDAL
    {
        public async Task<HelloWorld> GetHelloWorldMessage()
        {
            return await Task.FromResult(new HelloWorld { Message = "Hello .net API" });
        }
    }
}
