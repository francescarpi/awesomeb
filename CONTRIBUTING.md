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

3. Tag the release

After merging, ensure your local main branch is up to date with the remote. Then, create and push the release tag:

```bash
git tag v0.0.3-alpha
git push origin v0.0.3-alpha
```

4. Wait for CI/CD completion

Wait for the **build & release app** workflow to finish running.

5. Finalize on GitHub

Once the workflow is complete:

- Navigate to the Releases section on GitHub.
- Edit the most recent release (which will be in a Draft state).
- Click the **Generate release notes** button and then click **Publish release**.
