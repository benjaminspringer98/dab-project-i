TODO: There is a brief description of the application in REFLECTION.md that
highlights the key design decisions for the application. The document also
contains a reflection of possible improvements that should be done to improve
the performance of the application.

# Key design decisions

## Overview

- Application that allows users to practice Python assignments
- Upon submission, code gets tested and user receives feedback
- Users can collect points for providing the correct answer to assignments

## Basic functionality

- Application shows some basic info at `/` and user can press a button there to
  open the next assignment, that they haven't yet completed (opens
  `/assignments/[id]`)
- Users are tracked through an id saved in localstorage and this is accessed
  through a Svelte store
- Users can open any assignment through a menu, accessing `/assignments/[id]`
- this decision was made to increase transparency, if in a real-life scenario,
  users want to have a peek at later assignments, to look how hard e.g. the
  course for which the assignments will become later
- when accessing an already successfully answered assignment, a notification is
  shown on the page
- user points only get increased on first successful completion of each
  assignment
- when successfully answering an assignment, users are shown a success message,
  and a button is shown to move to the next one
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
  won't access the same submission

## Real time communication

- on submission, short polling is used to continuously check if the submission
  has been graded (every 2 seconds)
- while being in the grading queue, a status is shown in the frontend, which is
  continuously updated
- finally, when the submission was processed, user is shown feedback, and short
  polling stops
- when the user reloads or closes the page, while the assignment is still being
  graded, the real time connection is lost

## SSG

- All assignments are fetched at build time, and the assignment pages are
  prerendered with information about the assignments
- This is fine in our case, as there exists no functionality to add new
  assignments during runtime (apart from directly creating new ones in the
  database).

## Caching

- Redis is also used as a cache for DB operations
- cache purging mechanism are in place, when data is updated or modified (i.e.
  assignments are submitted / submissions are updated)
- uses second Redis instance, to not delete data from message queue, when cache
  gets purged

## Future outlook: Improving performance

- Alluding to lecture 3: Instead of passing the complete test code into the
  message broker (Redis), a reference to the test code (field of db table
  programming_assignments) could be passed
- instead of short polling, websockets could be used
- some endpoints send unnecessary data, when e.g. only the assignment id would
  be needed. Reducing the amount of data passed would also increase the
  performance
