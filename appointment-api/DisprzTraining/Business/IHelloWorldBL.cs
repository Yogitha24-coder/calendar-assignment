using DisprzTraining.Models;

namespace DisprzTraining.Business
{
    public interface IHelloWorldBL
    {
        Task<HelloWorld> SayHelloWorld();
    }
}