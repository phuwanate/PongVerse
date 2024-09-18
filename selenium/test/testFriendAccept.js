const { By } = require('selenium-webdriver');
const { login, logout, friendRequest, sleep, profileNavigate, elementDisappear } = require('./utils');
const configs = require('./configs')

friendAccept = async (driver, user) => {
	const notificationEL = await profileNavigate(driver, 
		"notificationLink", "Baby cadet notification", "notificationComponent")
	const notificationShadowRoot = await driver
		.executeScript('return arguments[0].shadowRoot', notificationEL)
	const acceptBtn = await notificationShadowRoot
		.findElement(By.id(`${user.username}FriendAccept`))
	await acceptBtn.click()

	await sleep(configs.timeWait)
	await elementDisappear(notificationShadowRoot, `${user.username}FriendAccept`)

	// expect found friend in friend
	const dashBoard = await driver.findElement(By.id('dashBoardComponent'))
	const dashBoardShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', dashBoard)
	const friends = await dashBoardShadowRoot.findElement(By.id('friendsComponent'))
	const friendsShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', friends)
	await friendsShadowRoot.findElement(By.id(`${user.username}`))
}

testFriendAccept = async (driver) => {

	nUser = configs.users.length

	for (let i = 0; i < nUser; i++) {
		await login(driver, configs.users[i])
		await friendRequest(driver, configs.users[(i + 1) % nUser])
		await logout(driver)

		//accept
		await login(driver, configs.users[(i + 1) % nUser])
		await friendAccept(driver, configs.users[i])
		await logout(driver)
	}
}

module.exports = testFriendAccept
