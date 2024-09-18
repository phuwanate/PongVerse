const {until, By} = require ('selenium-webdriver')
const configs = require ('./configs')
const assert = require("assert");

async function login(driver, user) {
	const firstPage = await driver.findElement(By.id('firstPage'))
	const shadowRoot = await driver.executeScript('return arguments[0].shadowRoot', firstPage);
	
	const signInBtn = await shadowRoot.findElement(By.id('signInBtn'))
	await signInBtn.click()

	const modalSignIn = await shadowRoot.findElement(By.id('modalLoginComponent'))
	const signInShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', modalSignIn)

	const username = await signInShadowRoot.findElement(By.id('username'))
	await username.sendKeys(user.username)
	
	const password = await signInShadowRoot.findElement(By.id('password'))
	await password.sendKeys(user.password)

	const submitBtn = await signInShadowRoot.findElement(By.css('button[type="submit"]'))
	await submitBtn.click()
	await driver.wait(until.titleIs(`Baby cadet ${user.username}`), 10000);
}

async function logout(driver){
	const dashBoard = await driver.findElement(By.id('dashBoardComponent'))
	const dashBoardShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', dashBoard)
	const profile = await dashBoardShadowRoot.findElement(By.id('profileComponent'))
	const profileShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', profile)
	const logOutBtn = await profileShadowRoot.findElement(By.id('logOut'))
	await logOutBtn.click()
	await driver.wait(until.titleIs("Baby cadet first page"), 10000)
}

async function signup(driver, user) {
	const firstPage = await driver.findElement(By.id('firstPage'))
	const shadowRoot = await driver.executeScript('return arguments[0].shadowRoot', firstPage);
	
	const signUpBtn = await shadowRoot.findElement(By.id('signUpBtn'))
	await signUpBtn.click()
			
	const modalSignUp = await shadowRoot.findElement(By.id('modalSignUpComponent'))
	const signUpShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', modalSignUp);
	
	const username = await signUpShadowRoot.findElement(By.id('usernameSignUp'))
	await username.sendKeys(user.username)
	
	const password = await signUpShadowRoot.findElement(By.id('passwordSignUp'))
	await password.sendKeys(user.password)

	const avatar = await signUpShadowRoot.findElement(By.id('avatarSignUp'))
	await avatar.sendKeys(user.avatar)
	
	const submit = await signUpShadowRoot.findElement(By.css('button[type="submit"]'))
	await submit.click()
	
	await driver.wait(until.urlContains('dashboard'), 10000);
}

/*
** @login required 
*/
async function profileNavigate(driver, target, title, mainFrame) {
	const dashBoard = await driver.findElement(By.id('dashBoardComponent'))
	const dashBoardShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', dashBoard)
	const profile = await dashBoardShadowRoot.findElement(By.id('profileComponent'))
	const profileShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', profile)
	const targetEl = await profileShadowRoot.findElement(By.id(target))
	await targetEl.click()
	await driver.wait(until.titleIs(title), 10000)
	const el = await dashBoardShadowRoot.findElement(By.id(mainFrame))
	return el
}

/*
** @login required 
*/
async function friendRecommendNavigate(driver){
	const dashBoard = await driver.findElement(By.id('dashBoardComponent'))
	const dashBoardShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', dashBoard)
	const friends = await dashBoardShadowRoot.findElement(By.id('friendsComponent'))
	const friendsShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', friends)
	const friendRecommendBtn = await friendsShadowRoot.findElement(By.id('friendRecommendBtn'))
	await friendRecommendBtn.click()
	await sleep(configs.timeWait)
	await driver.wait(until.titleIs("Baby cadet friend recommend"), 10000)
	const el = await dashBoardShadowRoot.findElement(By.id("recommendFriendComponent"))
	return el
}

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/*
** @login required 
** @user witch user to set request friend
*/
async function friendRequest (driver, user) {
	const friendRecommendComponent = friendRecommendNavigate(driver)
	const shadowRoot = await driver.executeScript('return arguments[0].shadowRoot', friendRecommendComponent)
	const friendRequestBtn = await shadowRoot.findElement(By.id(`${user.username}FriendRequest`))
	await driver.executeScript("arguments[0].click();", friendRequestBtn);
	await sleep (configs.timeWait)
	await elementDisappear(shadowRoot, `${user.username}FriendRequest`)
}

async function elementDisappear (parentEl, targetId) {
	let targetAbsent = false;
	try {
		await parentEl.findElement(By.id(targetId))
	}
	catch (error) {
		if (error.name === 'StaleElementReferenceError' || error.name == "NoSuchElementError") {
			buttonAbsent = true;
		} else {
			throw error;
		}
		targetAbsent = true;
	}
	assert.equal(targetAbsent, true, `The ${targetId} should be absent`);
}

async function findShadowRoot(driver, parent, componentId){
	const component = await parent.findElement(By.id(componentId))
	return await driver.executeScript('return arguments[0].shadowRoot', component)
}

module.exports = {
	login,
	logout,
	signup,
	profileNavigate,
	friendRecommendNavigate,
	sleep,
	friendRequest,
	elementDisappear,
	findShadowRoot
}