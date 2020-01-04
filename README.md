![Test status badge](https://github.com/Xotl/cool-github-releases/workflows/Test%20action%20modes/badge.svg?branch=master)

# The Cool GH Releases action
> Download/Upload release Assets - A more complete action for Github releases

Content
* [Usage](#Usage)
  * [Download assets from a release](#Download-assets-from-a-release)
  * [Create a release and upload assets](#Create-a-release-and-upload-assets)
* [Reference](#Reference)
  * [Download mode](#Mode:-`download`)
  * [Update mode](#Mode:-`update`)
  * [Delete mode](#Mode:-`delete`)

## Usage
This action supports 3 modes: `download`, `update`, `delete`.
A common use is to create releases or to get assets from a release, here are some examples:

### Download assets from a release
```yaml
      - name: Download asset README.md from release with tag v3.0.0 
        uses: Xotl/cool-github-releases@1.0
        with:
          mode: download
          tag_name: v3.0.0
          assets: README.md
          github_token: ${{ github.token }}
```

Let's see what the options means:
> **mode** - Indicates that we want to download assets. If no mode is specified, default value is `download`.  
> **tag_name** - Indicates that we want to download from a release with the tag `v3.0.0`.  
> **assets** - Indicates that we want the asset with the name `README.md` to be downloaded at the current working directory.  
> **github_token** - A valid github token. For releases you can use the one created for the workflow.  

Here's another example:
```yaml
      - name: Download assets README.md & LICENCE from release with tag A-fancy-tag 
        uses: Xotl/cool-github-releases@1.0
        with:
          assets: README.md;LICENSE|myFolder/myLicense.txt
          github_token: ${{ github.token }}
```
> **mode** - Since the default value is `download` we don't need pass any mode if we want to dowload assets.  
> **tag_name** - If we don't specify a tag then the latest release will be used to download assets.  
> **assets** - Indicates that we want to download the assets with name `README.md` & `LICENSE` in that release, but the asset `LICENSE` will be downloaded at `myFolder/myLicense.txt`.  
> **github_token** - A valid github token. For releases you can use the one created for the workflow.  

### Create a release and upload assets
```yaml
      - name: It should create a release with assets README.md and LICENCE 
        uses: Xotl/cool-github-releases@1.0
        with:
          mode: update
          tag_name: v3.0.0
          body_mrkdwn: "### It works!\n Wow, it worked like a charm 🎉"
          assets: myFolder/README.md
          github_token: ${{ github.token }}
```

Let's see what the options means:
> **mode** - Indicates that we want to create or edit a release. If a release with that tag already exists it will be updated.  
> **tag_name** - Indicates that we want to create a release with the tag `v3.0.0`. If a release with that tag already exists it will be updated instead.  
> **body_mrkdwn** - The description of the release will be a nice formated markdown: `### It works!\n Wow, it worked like a charm 🎉`.  
> **assets** - The file at `myFolder/README.md` will be uploaded to that release.  
> **github_token** - A valid github token. For releases you can use the one created for the workflow.  

Here's another example:
```yaml
      - name: It should create a release with assets README.md and LICENCE 
        uses: Xotl/cool-github-releases@1.0
        with:
          mode: update
          isPrerelease: true
          tag_name: v3.0.0
          release_name: "My Release"
          body_mrkdwn: "### It works!\n Wow, it worked like a charm 🎉"
          assets: myFolder/README.md;LICENSE|text/plain;
          github_token: ${{ github.token }}
```

> **mode** - Indicates that we want to create or edit a release. If a release with that tag already exists it will be updated.  
> **isPrerelease** - Our release will be flagged as a prerelease.  
> **tag_name** - Indicates that we want to create a release with the tag `v3.0.0`. If a release with that tag already exists it will be updated instead.  
> **release_name** - The release will have the name `My Release` instead of the tag.  
> **body_mrkdwn** - The description of the release will be a nice formated markdown: `### It works!\n Wow, it worked like a charm 🎉`.  
> **assets** - Will upload files `myFolder/README.md` & `LICENSE` to the release, but since the `LICENSE` file doesn't have an extension associated to a MIME type we need to specify it, in this case the MIME type is `text/plain`.  
> **github_token** - A valid github token. For releases you can use the one created for the workflow.  



## Reference
The required inputs will vary depending on the selected `mode`. There are only 3 valid values: `download`, `update`, `delete`.

All modes require a valid `github_token`, commonly you will can use the [one provided in the environment for your workflow](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token). In case you get some permissions erro message you will need to provide a token with a more elevated privilages.

### Mode: `download`
Use this mode to download assets from an existant release.
#### `assets` _(required)_
> <asset_expresion>[;<asset_expresion>...;<asset_expresion>]  
>  
> <asset_expresion> := <asset_name>  
> <asset_expresion> := <asset_name>|<file_path>  

* **asset_name** - Name of the asset in the release. The that you will see under asset section in a release a Github page.  
* **file_path** - A valid path where the asset will be downloaded.  

A string indicating the assets that you want to download. You can get one asset, multiple assets or even specify a download path.

The character `;` is the separator for different asset names and a `|` character after an asset name indicates the path in which the asset will be downloaded.


Check some examples:
##### Single asset
```yaml
assets: README.md # Will download asset README.md at the current working directory
```
##### Single asset with different path
```yaml
assets: README.md|myFolder/README.md # Will download asset README.md at myFolder/README.md 
```
```yaml
assets: README.md|myFolder/another_name.md # Will download asset README.md at myFolder/another_name.md 
```
##### Multiple assets
```yaml
# Will download assets README.md, myfile.zip and cat.png at the current working directory 
assets: README.md;myfile.zip;cat.png
```
##### Multiple assets with different path/name
```yaml
# Will download 3 assets:
#     - Asset with name myfile.zip will be downloaded at myFolder/myfile.zip
#     - Asset with name cat.png will be downloaded at the current working directory
#     - Asset with name logo.svg will be downloaded at myFolder/something.svg
assets: myfile.zip|myFolder/myfile.zip;cat.png;logo.svg|myFolder/something.svg
```
#### `releaseId`
You can provide a release id instead of a tag. If you pass `releaseId` the input `tag_name` will be ignored.
**Note:** If no `releaseId` nor `tag_name` is specified then it will use the latest release.

#### `tag_name`
The tag of a release. If `releaseId` is provided then this value will be ignored.
**Note:** If no `releaseId` nor `tag_name` is specified then it will use the latest release.

### Mode: `update`
Use this mode to create/edit releases. Also this mode allows you to upload assets to the release.

#### `assets`
> <file_expresion>[;<file_expresion>...;<file_expresion>]  
>  
> <file_expresion> := <file_path>  
> <file_expresion> := <file_path>|<mime_type>

* **file_path** - Path where the file is located.  
* **mime_type** - A valid MIME type of the file that will be uploaded.  

A string indicating the path of the file(s) that you want to upload. You can upload one or multiple files by using the character `;` as separator.

Since the Github Api requires to indicate the MIME type of each file you want to upload, the action will try to infer the MIME type based on the extension (it uses [mime-types](https://www.npmjs.com/package/mime-types)'s lookup method). If the file has no extension or the extension cannot be associated to just one MIME type then you need to speficy the MIME type.

To specify a MIME type you need to use the character `|` after the a file path. 

Check some examples:
##### Single file
```yaml
# Will upload file README.md that is located at the current working directory.
# The MIME type type will be inferred.
assets: README.md
```
##### Single file with MIME type
```yaml
# Will upload file LICENSE but since it has no extension we specify the MIME type as 'text/plain'
assets: LICENSE|text/plain
```
##### Multiple files
```yaml
# Will upload assets README.md, myfile.zip and cat.png that are located at
# the current working directory 
assets: README.md;myfile.zip;cat.png
```
##### Multiple files with different MIME types
```yaml
# Will upload 3 files:
#     - File LICENSE inside 'myFolder/' folder using the MIME type 'text/plain'
#     - File myfile.zip at the current working directory with MIME type inferred
#     - File myBinaryFile inside 'anotherFolder/' folder using the MIME type 'application/octet-stream'
assets: myFolder/LICENSE|text/plain;myfile.zip;anotherFolder/myBinaryFile|application/octet-stream
```
#### `releaseId`
⚠ _This value is required if no `tag_name` is provided._
Id of the release that you want to edit. If `releaseId` then `tag_name` will be ignored.

#### `tag_name`
⚠  _This value is required if no `releaseId` is provided._

Tag that will be used to edit/create the release. If a release with the tag name provided already exists then the release will be edited otherwise it will create a release associated to that tag.

While creating a release, if the provided tag doesn't exists then it will create the tag too.
#### `release_name`
Indicates the name of the release. If this value is not provided then the value of `tag_name` will be used instead.

#### `body_mrkdwn`
Description that you want for your release. This can be mardown syntax. Defualt value is `Release based on tag **${tag_name}**. Enjoy! 🎉`

#### `isDraft`
Set this value to `true` if you want this release to be flagged as a draft.
**Note:** _a draft release won't generate any tags._

#### `isPrerelease`
Set this value to `true` if you want this release to be flagged as a prerelease.


#### Outputs
This is the only mode that outputs something outside the action. It will expose the id of the created/edited release using the name `releaseId`.

Example:
```yaml
      - name: It should create a release with assets README.md and LICENCE
        id: hello
        uses: Xotl/cool-github-releases@1.0
        with:
          mode: update
          tag_name: v3.2.1
          github_token: ${{ github.token }}
        
        # Use the output from the `hello` step
        - name: Get the output releaseId
          run: echo "The releaseId is ${{ steps.test_create.outputs.releaseId }}"
```

### Mode: `delete`
Deletes a release by tag or id.

#### `releaseId`
_This value is required if no `tag_name` is provided._
Id of the release that you want to delete. If `releaseId` then `tag_name` will be ignored.

#### `tag_name`
_This value is required if no `releaseId` is provided._
Tag associated to the release that you want to delete.


### Thanks fo using it! 😊
Find something odd or not working properly?, please create an issue with the details. 