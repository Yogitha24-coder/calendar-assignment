using DisprzTraining.Business;
using DisprzTraining.Models;
using Microsoft.AspNetCore.Mvc;

namespace DisprzTraining.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HelloWorldController : ControllerBase
    {
        private readonly IHelloWorldBL _helloWorldBL;
        public HelloWorldController(IHelloWorldBL helloWorldBL)
        {
            _helloWorldBL= helloWorldBL;
        }

        [HttpGet]
        [ProducesResponseType(typeof(HelloWorld), 200)]
        public async Task<IActionResult> Helloworld()
        {
            return Ok(await _helloWorldBL.SayHelloWorld());
        }
    }
}
