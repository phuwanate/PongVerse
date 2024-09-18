const {By, Builder, Browser} = require('selenium-webdriver');
const assert = require("assert");

const testTitle = require "./src/testTitle"

// const Uri = "http://localhost:8000"

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  

(async function firstTest() {
  let driver;
  
  try {
    driver = await new Builder().forBrowser(Browser.CHROME).build();
    await driver.get("http://localhost:8000");

    testTitle(driver);
  
    // let title = await driver.getTitle();
    // assert.equal("Baby cadet", title);
    // await driver.manage().setTimeouts({implicit: 500});


    // let firstPage = await driver.findElement(By.id('firstPage'))
    // let shadowRoot = await driver.executeScript('return arguments[0].shadowRoot', firstPage);
    // let signInBtn = await shadowRoot.findElement(By.id('signIn-btn'))
    // if (signInBtn){
    //   await signInBtn.click()
    //   console.log("signInBtn found")
    // }
    // else {
    //   console.error('Element not found in shadow DOM')
    // }
    // await sleep(5000)
    // await driver.manage().setTimeouts({implicit: 5000});

    // const firstPage = await driver.findElement(By.id('firstPage'));
    // const shadowRoot = firstPage.shadowRoot
    // const signInBtn = shadowRoot.getElementById("signIn-btn")
    // signInBtn.click()

    // await driver.manage().setTimeouts({implicit: 1500});

  
    // let textBox = await driver.findElement(By.name('my-text'));
    // let submitButton = await driver.findElement(By.css('button'));
  
    // await textBox.sendKeys('Selenium');
    // await submitButton.click();
  
    // let message = await driver.findElement(By.id('message'));
    // let value = await message.getText();
    // assert.equal("Received!", value);
  } catch (e) {
    console.log(e)
  } finally {
    await driver.quit();
  }
}())

