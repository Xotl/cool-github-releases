const github = require('@actions/github')
const core = require('@actions/core')

const update = require('./update')
const download = require('./download')

async function main() {
    const githubToken = core.getInput('github_token', { required: true })
    const actionMode = core.getInput('mode', { required: true })

    const owner = 'Xotl'
    const repo = 'cool-github-releases'
    // const { name:repo, owner: { name:owner } } = github.context.payload.repository
    
    const octokit = new github.GitHub(githubToken)
    
    if (actionMode === 'download'){
        await download(octokit, {owner, repo})
        return
    }

    // Create/Update Release
    await update(octokit, {owner, repo})
}

main()