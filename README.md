<h1 style="text-align: center">Carbon Discord Bot</h1>
This is a discord bot inspired by [Carbon](https://carbon.now.sh) that allows you to share beautiful code snippets on discord.

![demo](recordings/demo.gif)

## Project structure

Only the important files/directories are listed below (there are a bunch of misc other files)

```
.
|-- deploy-commands.js      // script to register carbon with discord (see below)
|-- index.js                // "main" file for the bot
|-- k8s/                    // kubernetes manifests used to deploy the bot
|-- package.json
|-- pnpm-lock.yaml
|-- src/                    // Source code for the bot
`-- website                 // Source for the documentation website (carbon-bot.com)
```

## Dev setup

### Prerequisites

- pnpm
- node 23+ (maybe it works on older versions :shrug:)

### Setup creds

```bash
cp .env.example .env
```

Then edit .env and fill in secrets from discord

### Bot dev setup

```bash
pnpm install
pnpm dev
```

### Website dev setup

```bash
cd website
pnpm install
pnpm dev
```

## Deploying

Github actions is used to build a docker image and push it to a [public ECR repo](https://gallery.ecr.aws/b9e2c7d9/carbon-discord).
The action also updates the kustomization.yaml file with the new image tag once the image is pushed. The k8s manifests are
monitored by ArgoCD in a k8s cluster, which then handles running the bot.

The website is built with astro and deployed to vercel, so it's pretty self explanatory on that front.

## Branching
I'm a solo dev with 0 users, so everything's just pushed & deployed directly from master right now ¯\_(ツ)_/¯

# TODO

### Bot

- [x] Fix delayed failure message that happens
- [x] Fix weird `node --watch` deadlock
- [x] Add additional customization options
- [x] Test/fix flow with multiple users
- [x] Move logging to its own file
- [x] Fix text wrapping
- [x] Set avatar
- [x] Get rid of clipboard icon
- [ ] Maybe change deleting the original message to making it non-ephemeral
- [ ] Improve UX on interaction timeout
- [x] Setup bot hosting
  - [x] Dockerfile
  - [x] Github actions
  - [x] Deployment
  - [x] Secrets
  - [x] Argo project

### Docs

- [x] Create vite app
- [x] Setup tailwind
- [x] Host (vercel)
- [x] Write content
- [x] Add basic styling
- [x] Add screenshots/gif
- [x] Setup DNS
- [x] Add discord install link
- [x] Make README presentable
- [x] Setup google indexing
- [ ] Figure out why the video looks so bad in the browser
