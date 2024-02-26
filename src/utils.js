'use strict'

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
        type = 'tag: ' + tagName
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

const findRelease = async (octokit, context, releaseId, tagName) => {
    if (!releaseId && !tagName) {
        return [null, new Error('No releaseId or tag_name provided.')]
    }

    const [releaseFn] = getReleaseFn(octokit, releaseId, tagName)
    try {
        return [(await releaseFn(context)).data]
    } catch (err) {
        return [null, new Error(err.message)]
    }
}

module.exports = {
    splitAssetsString,
    getReleaseFn,
    findRelease
}