'use sstrict'
const FS = require('fs')
const Core = require('@actions/core')
const Mime = require('mime-types')
const Path = require('path');
const {
    getReleaseFn, splitAssetsString
} = require('../utils')

const PWD = process.cwd()

const parseFilesStringIntoList = fileStr => splitAssetsString(fileStr).map(
    (str) => {
        const [filePath, mime] = str.split('|')
        const extension = Path.extname(filePath)
        const filename = Path.basename(filePath, extension)

        return {
            filename, extension,
            filePath: Path.join(PWD, filePath), 
            mime: mime || Mime.lookup(extension)
        }
    }
)

const fileValidation = ({ filePath, mime }) => new Promise(
    (resolve, reject) => {
        FS.access(filePath, FS.constants.R_OK, (err) => {
            if (err) {
                return reject(new Error(`Cannot read file '${filePath}' or file doesn't exists.`))
            }

            if (FS.lstatSync(filePath).isDirectory()) {
                return reject(new Error(`Directories not supported: '${filePath}' is a directory`))
            }

            if (!mime) {
                return reject(new Error(
                    `Cannot determine MIME type for '${filePath}'. Please specify one or add an extension associeted to a MIME type.`
                ))
            }

            resolve(filePath)
        });
    }
)

const getBufferFromFilePath = (filePath) => new Promise(
    (resolve, reject) => {
        FS.readFile(filePath, (err, data) => {
            if (err) {
                return reject(err)
            }
            resolve(data)
        })
    }
)

const uploadAssetToReleaseUrl = async (octokit, url, fileObj) => {
    const { filePath, filename, mime, extension } = fileObj
    const buffer = await getBufferFromFilePath(filePath)
    const fullFileName = extension ? `${filename}${extension}` : `${filename}`
    try {
        await octokit.repos.uploadReleaseAsset({
            url, file: buffer,
            name: fullFileName,
            headers: {
                "content-type": mime,
                "content-length": buffer.length
            },
        })
    } catch (err) {
        Core.error(`An error ocurred while trying to upload file '${filePath}' with name '${fullFileName}': ${err.message}`)
    
        throw new Error( err.message || err)
    }
    console.log(`File '${fullFileName}' uploaded successfully.`)
}


const editRelease = async (octokit, opts, releaseId, tagName) => {
    const [releaseFn] = getReleaseFn(octokit, releaseId, tagName)
    const { owner, repo } = opts

    let releaseObj
    try {
        releaseObj = (await releaseFn({ owner, repo })).data
    } catch (err) {
        throw new Error(`Cannot edit release: Release '${releaseId || tagName}' doesn't exist`)
    }

    try {
        releaseObj = await octokit.repos.updateRelease({...opts, release_id: releaseObj.id})
    } catch (err) {
        throw new Error(`An error ocurred while trying to update the release '${releaseId || tagName}': ${err}`)
    }

    return releaseObj.data 
}

module.exports = async (octokit, context) => {
    const tagName = Core.getInput('tag_name', { required: true })
    const releaseId = Core.getInput('releaseId')
    const isDraft = Core.getInput('isDraft')
    const isPrerelease = Core.getInput('isPrerelease')
    const assetsInput = Core.getInput('assets')


    let name = Core.getInput('release_name')
    if (!name) {
        name = tagName
    }

    let body = Core.getInput('body_mrkdwn')
    if (!body) {
        body = `Release based on tag **${tagName}**. Enjoy! 🎉`
    }

    let fileList
    if (assetsInput.length > 0) {
        fileList = parseFilesStringIntoList(assetsInput)
        try {
            await Promise.all( fileList.map( fileValidation ) )// Validate files
        } catch (err) {
            Core.warning('No release created nor assets uploaded. Check error for details.')

            return Core.setFailed(`Bad assets string provided: ${err}`)
        }
    }

    const opts = {
        ...context, body, name,
        tag_name: tagName,
        draft: isDraft === 'true',
        prerelease: isPrerelease === 'true',
    }

    let releaseObj
    try {
        if (releaseId || tagName) {
            releaseObj = await editRelease(octokit, opts, releaseId, tagName)
        } else {
            releaseObj = (await octokit.repos.createRelease(opts)).data
        }
    } catch (err) {

        return Core.setFailed(`Failed while updating/creating release: ${err}`)
    }
    console.log(`Release created with tag ${tagName}.`)
    
    if (fileList) {
        console.log(`Started the upload of assets: \n${fileList.map(o => o.filePath).join('\n')}`)
        try {
            await Promise.all(
                fileList.map(
                    (fileObj) => uploadAssetToReleaseUrl(octokit, releaseObj.upload_url, fileObj)
                )
            )
        } catch (err) {
            Core.warning('Release was created but some files were not uploaded succesfully. See error for details.')

            return Core.setFailed(`An error ocurred while uploading files: ${err}`)
        }
        console.log(`Finished uploading ${fileList.length} assets.`)
    }
}
