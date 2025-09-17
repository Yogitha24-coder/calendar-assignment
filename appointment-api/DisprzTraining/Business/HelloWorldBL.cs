using DisprzTraining.DataAccess;
using DisprzTraining.Models;

namespace DisprzTraining.Business
{
    public class HelloWorldBL : IHelloWorldBL
    {
        private readonly IHelloWorldDAL _helloWorldDAL;
        public HelloWorldBL(IHelloWorldDAL helloWorldDAL)
        {
            _helloWorldDAL = helloWorldDAL;
        }

        public async Task<HelloWorld> SayHelloWorld()
        {
            return await _helloWorldDAL.GetHelloWorldMessage();
        }
    }
}
