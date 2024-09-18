const configs = require("./configs");
const {signup, logout} = require("./utils")

testSignUp = async(driver) => {
	for (const user of configs.users) {
		await signup(driver, user)
		await logout(driver)
	}
}

module.exports = testSignUp
