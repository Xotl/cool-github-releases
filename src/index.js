const github = require('@actions/github');
const core = require('@actions/core');

async function main() {
    const githubToken = core.getInput('github_token', { required: true });

    console.log('It runs!!!!!', githubToken)
    const octokit = new github.GitHub(githubToken);

    const releaseResponse = await octokit.repos.getLatestRelease({
        owner,
        repo
    })

    console.log(releaseResponse);
}

main()