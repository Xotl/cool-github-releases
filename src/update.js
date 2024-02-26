'use strict'
const FS = require('fs')
const Core = require('@actions/core')
const Mime = require('mime-types')
const Path = require('path');
const {
    findRelease,
    splitAssetsString
} = require('./utils')

const PWD = process.cwd()

const parseFilesStringIntoList = fileStr => splitAssetsString(fileStr).map(
    (str) => {
        const [filePath, mime] = str.split('|')
        const extension = Path.extname(filePath)
        const filename = Path.basename(filePath, extension)

        return {
            filename, extension,
            fullFileName: extension ? `${filename}${extension}` : filename,
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
    const { filePath, fullFileName, mime } = fileObj
    const buffer = await getBufferFromFilePath(filePath)
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

const deleteAssets = async (octokit, context, assetsList) => Promise.all(
    assetsList.map(
        async ({id, name}) => {
            await octokit.repos.deleteReleaseAsset({
                ...context, asset_id: id
            })
            console.log(`Asset '${name}' with id '${id}' deleted successfully!`)
        }
    )
)


const editRelease = async (octokit, opts, release_id) => {
    try {
        releaseObj = await octokit.repos.updateRelease({...opts, release_id})
    } catch (err) {
        throw new Error(`An error ocurred while trying to edit the release '${release_id}': ${err.message}`)
    }

    return releaseObj.data 
}

module.exports = async (octokit, context) => {
    // If string is empty then we change value to 'undefined' so 
    // octokit won't pass those values as parameters 
    const tag_name = Core.getInput('tag_name') || undefined
    const releaseId = Core.getInput('releaseId') || undefined
    const draft = Core.getInput('isDraft') || undefined
    const prerelease = Core.getInput('isPrerelease') || undefined
    const assetsInput = Core.getInput('assets') || undefined
    const replaceAssets = Core.getInput('replace_assets') || undefined
    const name = Core.getInput('release_name') || undefined
    const body = Core.getInput('body_mrkdwn') || undefined
    const initialBody = Core.getInput('initial_mrkdwn') || undefined


    if (!releaseId && !tag_name) {
        return Core.setFailed(`Missing input: You need to provide either 'releaseId' or 'tag_name'.`)
    }
    

    // Validate files before trying anything with the Github Api
    let fileList
    if (typeof assetsInput === 'string') {
        fileList = parseFilesStringIntoList(assetsInput)
        try {
            await Promise.all( fileList.map( fileValidation ) )// Validate files
        } catch (err) {
            Core.warning('No release created nor assets uploaded. Check error for details.')

            return Core.setFailed(`Bad assets string provided: ${err}`)
        }
    }

    // Check if a release can be retrieved, if we found something means we will edit it
    const [foundRelease] = await findRelease(octokit, context, releaseId, tag_name)

    // Create/Update the release values
    const opts = { ...context, body, name, tag_name, draft, prerelease }
    let releaseObj
    try {
        if (foundRelease) {
            releaseObj = await editRelease(octokit, opts, foundRelease.id)
            console.log(`Release '${releaseId || tag_name}' edited succesfully!`)
        } else {
            if (!name) {
                opts.name = tag_name
            }

            // When creating we default to initialBody if available, otherwise body, or our fallback value.
            opts.body = initialBody || body || `Release based on tag **${tag_name}**. Enjoy! 🎉`
            opts.draft = draft === 'true'
            opts.prerelease = prerelease === 'true'

            releaseObj = (await octokit.repos.createRelease(opts)).data
            console.log(`Release created with tag ${tag_name}!`)
        }
    } catch (err) {
        return Core.setFailed(`Failed while updating/creating release: ${err.message}`)
    }

    // Sets the output of this action
    Core.setOutput('releaseId', releaseObj.id);

    if (!fileList) {
        console.log('Finishing without uploding any assets since no assets were specified.')
        return 
    }

    if (foundRelease && replaceAssets) {
        // Check if we need to update assets instead of just adding more
        const existantAssets = releaseObj.assets.filter(
            (asset) => fileList.find(
                ({fullFileName}) => fullFileName === asset.name
            )
        )

        if (existantAssets.length > 0) {
            console.log('Some of the specified asset names already exists in the release, those assets will be deleted so the new ones can be uploaded.')
            try {
                console.log(`Started the deletion of assets: \n${existantAssets.map(a => a.name).join('\n')}`)
                await deleteAssets(octokit, context, existantAssets)
                console.log(`Finished the deletion of ${existantAssets.length} existant asset(s) without any error!`)
            }
            catch (err) {
                console.error(err.message)
                Core.warning('Some of the assets were not deleted, so your assets will no be up to date or with missing assets.')
            }
        }
    }
    
    // Upload assets
    console.log(`Started the upload of assets: \n${fileList.map(o => o.filePath).join('\n')}`)
    try {
        await Promise.all(
            fileList.map(
                (fileObj) => uploadAssetToReleaseUrl(octokit, releaseObj.upload_url, fileObj)
            )
        )
    } catch (err) {
        Core.warning('Release was created/updated but some files were not uploaded succesfully. See error for details.')

        return Core.setFailed(`An error ocurred while uploading files: ${err}`)
    }
    console.log(`Finished uploading ${fileList.length} assets.`)
}
