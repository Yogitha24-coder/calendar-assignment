using DisprzTraining.Models;

namespace DisprzTraining.DataAccess
{
    public interface IHelloWorldDAL
    {
        Task<HelloWorld> GetHelloWorldMessage();
    }
}
