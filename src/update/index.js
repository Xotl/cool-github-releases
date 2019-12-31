'use sstrict'
const FS = require('fs')
const Core = require('@actions/core')
const Mime = require('mime-types')

const FILE_REGEXP = /(.*[\/\\])?(?<filename>.+?)\.?(?<extension>(?<=\.).+)?$/

const parseFilesStringIntoList = fileStr => fileStr.split(';').map(
    (str) => {
        const [filePath, mime] = str.split('|')
        const { groups: { filename, extension } } = filePath.match(FILE_REGEXP)

        return {
            filePath, filename, extension,
            mime: mime || Mime.lookup(extension)
        }
    }
)

const fileValidation = ({ filePath, mime }) => new Promise(
    (resolve, reject) => {
        if (!mime) {
            return reject(new Error(
                `Cannot determine MIME type for '${filePath}'. Please specify one or add an extension associeted to a MIME type.`
            ))
        }
        FS.access(filePath, FS.constants.R_OK, (err) => {
            if (err) {
                return reject(new Error(`Cannot read file '${filePath}' or file doesn't exists.`))
            }
            resolve(filePath)
        });
    }
)

const validateFiles = (fileList) => Promise.all(
    fileList.map( fileValidation )
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
    const fullFileName = extension ? `${filename}.${extension}` : `${filename}`
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
        Core.error(`An error ocurred while trying to upload file '${filePath}'.`)
        throw new Error(err)
    }
    console.log(`File '${fullFileName}' uploaded successfully.`)
}


module.exports = async (octokit, context) => {
    const tag_name = Core.getInput('tag_name', { required: true })
    const isDraft = Core.getInput('isDraft')
    const isPrerelease = Core.getInput('isPrerelease')
    const assetsInput = Core.getInput('assets')

    let name = Core.getInput('release_name')
    if (!name) {
        name = tag_name
    }

    let body = Core.getInput('body_mrkdwn')
    if (!body) {
        body = `Release based on tag ${tag_name}. Enjoy! 🎉`
    }

    let fileList
    if (assetsInput.length > 0) {
        fileList = parseFilesStringIntoList(assetsInput)
        try {
            await validateFiles(fileList)
        } catch (err) {
            Core.warning('No release created nor assets uploaded. Check error for details.')

            return Core.setFailed(`Cannot read file '${err}' or file doesn't exists.`)
        }
    }

    const opts = {
        ...context, tag_name, body, name,
        draft: isDraft === 'true',
        prerelease: isPrerelease === 'true',
    }

    const { data:releaseResponse } = await octokit.repos.createRelease(opts)
    console.log(`Release created with tag ${tag_name}.`)
    
    if (fileList) {
        console.log(`Started the upload of assets: \n${fileList.map(o => o.filePath).join('\n')}`)
        try {
            await Promise.all(
                fileList.map(
                    (fileObj) => uploadAssetToReleaseUrl(octokit, releaseResponse.upload_url, fileObj)
                )
            )
        } catch (err) {
            Core.warning('Release was created but some files were not uploaded succesfully.')

            return Core.setFailed(`Cannot read file '${err}' or file doesn't exists.`)
        }
        console.log(`Finished uploading ${fileList.length} assets.`)
    }
}
