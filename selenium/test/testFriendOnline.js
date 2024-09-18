const { Builder, By } = require('selenium-webdriver');
const configs = require('./configs');
const { login, logout, findShadowRoot, sleep } = require('./utils');
const assert = require("assert");

findFriends = async (driver) => {
	dashBoardShadowRoot = await findShadowRoot(driver, driver, "dashBoardComponent")
	friendsShadowRoot = await findShadowRoot(driver, dashBoardShadowRoot, "friendsComponent")
	friends = await friendsShadowRoot.findElements(By.css("friend-component"))
	return friends
}

testFriendStatus = async (driver, friendName, status) => {
	const friends = await findFriends(driver)
	for (const friend of friends) {
		const name = await friend.getAttribute("id")
		if (name == friendName) {
			const friendShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', friend)
			const friendStatus = await friendShadowRoot.findElement(By.id("status"))
			const statusText = await friendStatus.getText()
			assert.equal(statusText, status, `${friendName} should ${status}`)
		}
	}
}

testFriendOnline = async (driver) => {
	const otherUsers = []
	const firstUser = configs.users[0]

	await login(driver, firstUser)
	const firstUserfriends = await findFriends(driver)
	for (const friend of firstUserfriends) {
		const friendName = await friend.getAttribute("id")
		otherUsers.push(friendName)
		const friendShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', friend)
		const friendStatus = await friendShadowRoot.findElement(By.id("status"))
		const statusText = await friendStatus.getText()
		assert.equal(statusText, "Offline", `${friendName} should offline`)
	}

	const driver2 = await new Builder().forBrowser('chrome').build();
	await driver2.get(configs.url);

	for (const otherUser of otherUsers) {
		const user = configs.users.find(user => user.username == otherUser)
		await login(driver2, user)
		await sleep(configs.timeWait)
		await testFriendStatus(driver2, firstUser.username, "Online")
		await testFriendStatus(driver, user.username, "Online")
		await logout(driver2)
		await testFriendStatus(driver, user.username, "Offline")
	}

	await logout(driver)

	await driver2.quit();

}

module.exports = testFriendOnline