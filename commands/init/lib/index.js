function init (projectName, cmdObj) {
  console.log('projectName: ', projectName)
  console.log('cmdObj: ', cmdObj.force, process.env.CLI_TARGET_PATH)

}
module.exports = init;
