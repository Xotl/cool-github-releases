'use sstrict'
const Core = require('@actions/core')
const FS = require('fs');
const Path = require('path');
const Fetch = require('node-fetch');
const {
    getReleaseFn, splitAssetsString
} = require('./utils')

const PWD = process.cwd()

const parseFilesStringIntoList = fileStr => splitAssetsString(fileStr).map(
    (str) => {
        const [fileName, output] = str.split('|')
        return { fileName, output: Path.join(PWD, output || fileName) }
    }
)

const downloadFile = (assetId, output, githubToken, context) => new Promise(
    (resolve, reject) => {
        const { owner, repo } = context
        const file = FS.createWriteStream(output)
        const failFn = (err) => {
            file.destroy()
            FS.unlink(output)// Delete the file async.
            reject(err)
        }

        file.on('finish', resolve)
        file.on('error', failFn)
        Fetch(
            `https://api.github.com/repos/${owner}/${repo}/releases/assets/${assetId}?access_token=${githubToken}`,
            { headers: { 'Accept' : 'application/octet-stream' } }
        ).then(res => res.body.pipe( file )).catch( failFn )
    }
)

module.exports = async (octokit, context, githubToken) => {
    const releaseId = Core.getInput('releaseId')
    const tagName = Core.getInput('tag_name')
    const assetsInput = Core.getInput('assets', { required: true })

    if (!assetsInput) {
        return Core.setFailed('Missing input: You need to provide the assets string.')
    }

    if (!releaseId && !tagName) {
        return Core.setFailed('Missing input: You need to provide either "releaseId" or "tag_name".')
    }

    const [releaseFn, type] = getReleaseFn(octokit, releaseId, tagName)

    let releaseObj
    try {
        const response = await releaseFn(context)
        releaseObj = response.data
    } catch(err) {
        return Core.setFailed(`Couldn't retrieve '${type}' release: ${err.message}`)
    }

    const assetList = parseFilesStringIntoList(assetsInput)


    let errOnAssets = false 
    await Promise.all(
        assetList.map(assetReq => {
            const assetInfo = releaseObj.assets.find(a => a.name === assetReq.fileName)
            if (!assetInfo) {
                Core.warning(`Skipping download of file: No asset with name '${assetReq.fileName}' found in '${type}' release.`)
                return
            }
    
            console.log(`Starting the download of asset ${assetReq.fileName}...`)
            const downloadPromise = downloadFile(
                assetInfo.id, assetReq.output,
                githubToken, context
            )

            downloadPromise.then(
                () => console.log(`Asset '${assetReq.fileName}' downloaded successfully at '${assetReq.output}'!`)
            ).catch(
                (err) => {
                    errOnAssets = true
                    Core.error(`An error occurred while downloading asset '${assetReq.fileName}': ${err}`)
                }
            )

            return downloadFile
        })
    )

    console.log(`Download of assets finished ${errOnAssets ? 'with errors' : 'successfully'}.`)
}
