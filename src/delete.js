'use sstrict'
const Core = require('@actions/core')

module.exports = async (octokit, context) => {
    let release_id = Core.getInput('releaseId')
    const tag = Core.getInput('tag_name')

    if (!release_id && !tag) {
        return Core.setFailed(`Missing input: You need to provide 'releaseId' or release 'tag_name'.`)
    }

    if (!release_id) {// Tag provided
        try {
            const { data:releaseObj } = await octokit.repos.getReleaseByTag({...context, tag })
            release_id = releaseObj.id
        } catch (err) {
            return Core.setFailed(`Error while fetching release with tag '${tag}': ${err.message}`)
        }
    }

    try {
        await octokit.repos.deleteRelease({...context, release_id })
    } catch (err) {
        return Core.setFailed(`Error while deleting release with id '${release_id}': ${err.message}`)
    }

    console.log(`Release with id '${release_id}' deleted succesfully!`)
}