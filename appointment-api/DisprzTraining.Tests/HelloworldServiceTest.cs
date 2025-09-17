using DisprzTraining.Business;
using DisprzTraining.Controllers;
using DisprzTraining.DataAccess;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DisprzTraining.Tests
{
    public class HelloworldServiceTest
    {
        [Fact]
        public async Task Helloworld_Returns_200_Success()
        {
            // Arrange
            IHelloWorldDAL helloWorldDAL = new HelloWorldDAL();
            IHelloWorldBL helloWorldBL = new HelloWorldBL(helloWorldDAL);
            HelloWorldController helloWorld = new(helloWorldBL);

            // Act
            var result = await helloWorld.Helloworld() as OkObjectResult;

            // Assert
            
            Assert.Equal(result?.StatusCode, 200);
            Assert.True(result?.Value.ToString() == "Hello .net API");
        }
    }
}
