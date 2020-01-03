const github = require('@actions/github')
const core = require('@actions/core')

const updateRelease = require('./update')
const downloadRelease = require('./download')
const deleteRelease = require('./delete')

async function main() {
    const githubToken = core.getInput('github_token', { required: true })
    const actionMode = core.getInput('mode', { required: true })

    // Ensure it is masked in logs, just in case we happen to log that somewhere
    core.setSecret(githubToken)

    console.log('Wow, such debugging repository object', github.context.payload.repository)

    const { name:repo, owner: { name:owner } } = github.context.payload.repository
    const octokit = new github.GitHub(githubToken)
    const context = {owner, repo}

    if (actionMode === 'download') {
        await downloadRelease(octokit, context, githubToken)
        return
    }

    if (actionMode === 'delete') {
        await deleteRelease(octokit, context)
        return
    }

    // Create/Update Release
    await updateRelease(octokit, context)
}

main()
