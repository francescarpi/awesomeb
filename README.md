# AwesomeB

Welcome! I’m really glad you found your way to the AwesomeB repository.

AwesomeB is a personal project that has been living in my head for a long time. For the longest time, I’ve dreamed of having a Chrome-based browser with true multi-container capabilities—the kind where you can use different profiles and workspaces all within one single window. While Firefox has had this solved for ages, Chrome still hasn't quite figured it out, often forcing you to juggle multiple separate windows just to keep things organized.

I eventually came across [Flow Browser](https://github.com/multiboxlabs/flow-browser) (and a huge thanks to **iamEvanYT** for sharing that project!), and it honestly opened up a whole new world of possibilities for me. It provided exactly the spark of inspiration I needed to finally start building this.

My goal wasn't to follow the crowd or stick to the usual browser standards; I wanted to be a bit more creative and build something that actually fits the way I work. Because of that, I’ve added several features that mean a lot to me, such as organizing tabs into "desktops" where you can keep them dormant and only wake them up when you need them. I also made sure that all configuration and session files are in JSON format, so you can easily save them right inside your own repositories. I’ll be launching a website soon to showcase all the different things this browser can do.

**Just a quick heads-up**: even though I use this every single day—both personally and for my professional work—please keep in mind that this is still an experimental personal project. It can be unstable, it might have bugs, and there could be security risks (for instance, extension support isn't fully implemented yet).

I’m sharing it publicly because I thought if the community finds the idea interesting, we might be able to work together to make it much more robust, stable, and scalable.

## Quick Start

If you are a developer and want to get the project running quickly, you will need:

- node >= 24
- pnpm >= 10

## Installation & Setup

Install dependencies and configure husky:

```bash
pnpm install
pnpm husky:install
```

Run the project in development mode:

```bash
pnpm dev
```

To build for Mac (the OS I currently use):

```bash
pnpm build:mac
```

_(Note: Windows and Linux builds are available but have not been tested yet.)_
