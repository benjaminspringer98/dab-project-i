FROM mcr.microsoft.com/playwright:v1.39.0-focal-arm64

COPY . /e2e-playwright

WORKDIR /e2e-playwright

RUN npm install

RUN npx playwright install 

CMD [ "npx", "playwright", "test", "--reporter=list" ]