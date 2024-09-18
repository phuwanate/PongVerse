const assert = require("assert");

testTitle = async (driver) => {
	const title = await driver.getTitle();
	assert.equal("Baby cadet first page", title);
	await driver.manage().setTimeouts({implicit: 500});
}

module.exports =testTitle