# Contributing

Welcome! It’s great to have you here. Any kind of help is truly welcome.

Contributing to this project is actually quite straightforward. There isn't much mystery to it: simply browse through the open issues and assign yourself whichever one interests you most.

However, there is one important rule to keep in mind: every **Pull Request must be linked to an existing issue**.

Regarding AI, feel free to use it, of course, but I suggest doing so in moderation. This project is a passion project for me; while I do use AI for certain parts, I also love the process of tackling challenges and solving problems on my own. I recommend you try to do the same!

I also want to be upfront about the scope of reviews: if I receive very large Pull Requests that are so complex that neither I nor an AI can easily understand them, I won't be able to accept them.

Please remember that I am a human with limited free time, so don't expect things to move at lightning speed. I will review your contributions as and when I am able to. My long-term hope is that if the project grows and eventually attracts enough support, I will be able to put together a stable team to help it evolve in a more solid and sustainable way.

That’s all for now. I hope you feel at home in this repository, and if you ever have any questions, please don't hesitate to reach out!

## Preparing a New Release

To release a new version, follow these steps:

1. Create a version branch

Create a new branch originating from _main_, using the version number as part of the name. For example:

```bash
git switch -c chore/v0.0.3-alpha
```

2. Update version and merge

On this new branch, update the version field in _package.json_. Once updated, create a Pull Request (PR) and merge it into _main_.

3. Tag the release (automatic)

Once the version-bump PR merges into `main`, the **tag on version change** workflow takes over. It compares the `version` field before and after the merge, validates it matches a semver-like pattern (`X.Y.Z` or `X.Y.Z-prerelease`), and creates a tag of the form `v{version}` (e.g. `v0.5.2-alpha`) pointing at the merge commit.

Once the tag is created, the same workflow dispatches the **build & release app** workflow with the new tag as input, so the build starts immediately. You no longer need to tag manually or push anything. If the tag already exists, the workflow fails loudly rather than overwriting it — this is intentional, to protect releases that may already have been built and published.

4. Wait for CI/CD completion

Wait for the **build & release app** workflow to finish running. The job matrix runs on Ubuntu, macOS and Windows. When it finishes successfully, a **draft** GitHub Release is created with all the platform artifacts already attached.

5. Finalize on GitHub

Once the build is complete:

- Navigate to the Releases section on GitHub.
- Edit the most recent release (which will be in a Draft state).
- Review the uploaded artifacts and the auto-detected tag.
- Click the **Generate release notes** button to populate the description with PR titles since the previous release.
- Click **Publish release** to make it public.

6. Deploy the documentation

Publishing the release automatically triggers the **Deploy Docs** workflow. It fetches the metadata of the newly published release, rebuilds the documentation site, and publishes it to GitHub Pages so the new version appears in the download links and changelog.

If the docs deploy fails (or you need to re-publish docs for an already-released version), you can re-run it manually from the Actions tab using the **Run workflow** button with the corresponding tag (e.g. `v0.5.2-alpha`).
