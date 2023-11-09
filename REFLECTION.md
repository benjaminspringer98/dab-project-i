# Key design decisions

## Overview

- Application that allows users to practice Python assignments
- Upon submission, code gets tested and user receives feedback
- Users can collect points for providing the correct answer to assignments

## Basic functionality

- Users are tracked through an id saved in localstorage and this is accessed
  through a Svelte store
- user points only get increased on first successful completion of each
  assignment
- when successfully answering an assignment, users are shown a success message,
  and a button is shown to move to the next one
- users receive + 100 points for the **first** successful submission of an
  assignment
- users can only have one submission in grading at a time (you can test this
  e.g. by running the assignment submission tests with k6, then navigating to
  the app and trying to submit an assignment multiple times)
- note that spamming the submission button will not trigger this, as the
  timeframe when the submission state will go from writing the initial
  submission into the database, to the submission waiting for processing in the
  Redis queue (see next paragraph), is too small

## Message queue

- When user submits assignment, programming-api pushes submission into a Redis
  queue for grading
- grader-api continuously reads this queue, pops submissions out of it, and
  processes them
- through this approach, deploying multiple instances is no problem, as they
  won't access the same submission, and will each process the same number (you
  can check this for example by checking the logs of the grader-api deployments,
  where the count of processed submissions from the queue will be logged)

## Real time communication

- on submission, short polling is used to continuously check if the submission
  has been graded (every 2 seconds)
- while being in the grading queue, a status is shown in the frontend, which is
  continuously updated
- finally, when the submission was processed, user is shown feedback, and short
  polling stops
- when the user reloads or closes the page, while the assignment is still being
  graded, the real time connection is lost

## Dev vs. Prod config

Prod:

- containers restart on failure
- API: removed --watch flag from the Dockerfiles
- data in the db is persisted (locally)
- UI is built with astro build rather than astro dev, and served through Nginx
- requests to UI are cached (see next topic) and responses are sent in a
  compressed format

## Caching

- dev caches database queries, purges when new data is added/updated (add/update
  submission)
- prod uses this + NGINX caching for the frontend

## Future outlook: Improving performance

- Alluding to lecture 3: Instead of passing the complete test code into the
  message broker (Redis), a reference to the test code (field of db table
  programming_assignments) could be passed
- instead of short polling, which could spam the server with too many requests,
  if the interval is too small, websockets could be used
- some endpoints send unnecessary data, passing e.g. the user id. Reducing the
  amount of data passed would increase the performance. Here, e.g. a session
  could be used to track the user (which would be implemented together with a
  login system in a real use case)
- Note: in the current implementation, the API is not secured. So in theory,
  anyone could update their own submission data. As the goal of this project is
  to focus on technologies relevant to scalability, this is intentional. In
  practice, additional mechanisms for securing the API should be in place, such
  as API keys. This adds more overhead though, which in turn will reduce
  performance. Therefore, paying attention to the points on increasing
  performance mentioned above is especially important in a practical scenario.
