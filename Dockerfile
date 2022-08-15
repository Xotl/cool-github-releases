# -------------------------
#       Development
# -------------------------
FROM node:16.14.2-slim as development

ENV APP_FOLDER="/usr/src/app" 
WORKDIR ${APP_FOLDER}

# Due to a bug with NPM we need to update it manually.
RUN npm install -g npm@8.17.0

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install
COPY . ${APP_FOLDER}

CMD ["npm", "start"]



# -------------------------
#         Builder
# -------------------------
FROM development as builder
RUN npm i -g @vercel/ncc
CMD ["npm", "run", "build"]
