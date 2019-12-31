const github = require('@actions/github');
const core = require('@actions/core');

async function main() {
    const githubToken = core.getInput('github_token', { required: true });

    const { payload: { repository: { full_name:repository } } } = github.context

    // const octokit = new github.GitHub(githubToken);

    // const releaseResponse = await octokit.repos.getLatestRelease({
    //     owner,
    //     repo
    // })

    console.log('Wow, such context', repository)
    console.log('Wow, such stringified', JSON.stringify(github.context))
}

main()