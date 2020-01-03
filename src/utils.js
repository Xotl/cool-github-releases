'use sstrict'

const splitAssetsString = assetStr => assetStr.split(';').filter(a => a)

const getReleaseFn = (octokit, releaseId, tagName) => {
    const params = {}
    let octokitFn
    let type

    if (releaseId) {// By id
        type = 'release_id: ' + releaseId
        params.release_id = releaseId
        octokitFn = octokit.repos.getRelease
    } else if (tagName) {// By tag
        type = 'tag: ' + releaseId
        params.tag = tagName
        octokitFn = octokit.repos.getReleaseByTag
    } else {// Latest release
        type = 'latest'
        octokitFn = octokit.repos.getLatestRelease
    }

    return [
        (context) => octokitFn({ ...context, ...params }),
        type
    ]
}

module.exports = {
    splitAssetsString,
    getReleaseFn
}