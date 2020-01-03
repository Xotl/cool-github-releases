![Test status badge](https://github.com/Xotl/cool-github-releases/workflows/Test%20action%20modes/badge.svg?branch=master)

# The Cool GH Releases action

> Download/Uploads Releases Assets - A more complete action for Github releases Assets

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

## Inputs reference

The required inputs will vary depending on the selected `mode`. There are only 3 valid values: `download`, `update`, `delete`.

All modes require a valid `github_token`, commonly you will be to use the [one provided in the environment for your workflow](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token). In case you get some permissions erro message you will need to provide a token with a more elevated privilages.

### `download` mode
#### `assets` _(required)_
A string indicating the asset names that you want to download. You can get one asset, multiple assets or even specify a download path.

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

### `update` mode
#### `assets`
#### `releaseId`
#### `tag_name`
#### `release_name`
#### `body_mrkdwn`
#### `isDraft`
#### `isPrerelease`


### `delete` mode
#### `assets`
#### `releaseId`
#### `tag_name`
#### `release_name`
#### `body_mrkdwn`
#### `isDraft`
#### `isPrerelease`
