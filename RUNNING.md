## Prerequisities

- having docker and docker compose installed
- build base grader image:
  - can be built using either the `build.sh` command or the
    `docker build -t grader-image .` command in the `grader-image` folder.
    Having the base grader image, i.e. `grader-image` is needed for
    programmatically building subsequent grading images.

## Running the actual application

### Dev

- run `docker compose up`
- sometimes flyway won't start on the first run, leading to undefined values
  being shown in the frontend, as the database tables to not exist
- in this case stop the containers with `ctrl + c` and re-run them
- sometimes this can happen multiple times (at least on my pc), I have no idea
  why though

### Prod

- run `docker compose -f docker-compose.prod.yml up -d`
- to stop, run `docker compose down`

## Tests

### End-to-End Tests

- first run `docker compose up` in one terminal
- then run E2E tests with Playwright in another terminal:
  `docker-compose run --entrypoint=npx e2e-playwright playwright test && docker-compose rm -sf`
- notes:
  - I had to add the line `RUN npx playwright install` to the Playwright
    Dockerfile, because it just stopped working randomly at some point
  - if you are interested, the error was
    `Error: browserType.launch: Executable doesn't exist at /ms-playwright/chromium-1080/chrome-linux/chrome`
  - if you run into any problems, try removing the above mentioned line and
    building the image again

### Performance tests

1. run `docker compose up` in one terminal
2. another terminal: cd into k6 folder and run `k6 run <test-file>`

### General notes

- I'm on Mac M2, so I had to change some base images
- if you run into any errors with these, please change the base images back
  (e.g. to the ones from the project template)
