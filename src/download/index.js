'use sstrict'
module.exports = async (octokit, context) => {
    const { data:releaseResponse } = await octokit.repos.listTags(context)
    // const releaseResponse = await octokit.repos.getLatestRelease({
    //     owner, repo
    // })
    console.log('Wow, such release', releaseResponse)

}