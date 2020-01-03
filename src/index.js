const github = require('@actions/github')
const Core = require('@actions/core')

const updateRelease = require('./update')
const downloadRelease = require('./download')
const deleteRelease = require('./delete')

const modeDict = {
    update: updateRelease,
    download: downloadRelease,
    delete: deleteRelease,
}

async function main() {
    const actionMode = Core.getInput('mode', { required: true })
    const modeFn = modeDict[actionMode]

    if (!modeFn) {
        return Core.setFailed(`Unknown mode '${modeFn}', valid values are: ${Object.keys(modeDict).join(', ')}`)
    }

    const githubToken = Core.getInput('github_token', { required: true })
    Core.setSecret(githubToken)// Ensure it is masked in logs, just in case we happen to log that

    const { name:repo, owner: { name, login } } = github.context.payload.repository
    const octokit = new github.GitHub(githubToken)
    const context = {repo, owner: name || login}

    await modeFn(octokit, context, githubToken)
}

main()
