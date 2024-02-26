'use strict'
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

const getContext = () => {
    const repository = Core.getInput('repository') || process.env.GITHUB_REPOSITORY

    if (typeof repository !== 'string') {
        return null
    }

    const [owner, repo] = repository.trim().split('/');
    return {owner, repo}
}


async function main() {
    const context =  getContext()

    if (!context) {
        return Core.setFailed('Error: Cannot get repository string.')
    }

    const actionMode = Core.getInput('mode', { required: true })
    const modeFn = modeDict[actionMode]

    if (!modeFn) {
        return Core.setFailed(`Unknown mode '${modeFn}', valid values are: ${Object.keys(modeDict).join(', ')}`)
    }

    const githubToken = Core.getInput('github_token', { required: true })
    Core.setSecret(githubToken)// Ensure it is masked in logs, just in case we happen to log that

    const octokit = new github.GitHub(githubToken)
    await modeFn(octokit, context, githubToken)
}

main().catch(
    err => Core.setFailed(err)
)
