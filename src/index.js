const github = require('@actions/github')
const core = require('@actions/core')

const update = require('./update')
const download = require('./download')

async function main() {
    const githubToken = core.getInput('github_token', { required: true })
    const actionMode = core.getInput('mode', { required: true })
    
    const { name:repo, owner: { name:owner } } = github.context.payload.repository
    const octokit = new github.GitHub(githubToken)
    const context = {owner, repo}

    if (actionMode === 'download'){
        await download(octokit, context, githubToken)
        return
    }

    // Create/Update Release
    await update(octokit, context)
}

main()
