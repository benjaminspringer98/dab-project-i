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

- Application shows some basic info at `/` and user can press a button there to open the next assignment, that they haven't yet completed (opens `/assignments/[id]`)
- Users can open any assignment through a menu, accessing `/assignments/[id]`
- this decision was made to increase transparency, if in a real-life scenario, users want to have a peek at later assignments, to look how hard e.g. the course for which the assignments will become later
- if they have already successfully answered an assignment, a notification is shown on the page
- Points get evaluated on submission of assignment, and on opening the 
- when successfully answering an assignment, users are shown a success message, and a button is shown to move to the next one

## Message queue

-

## Real time communication

- short polling is used

## SSG

All assignments are fetched at build time, and the assignment pages are
prerendered. This is fine in our case, as there exists no functionality to add
new assignments during runtime (apart from directly creating new ones in the
database).

## Future outlook: Improving performance

- Alluding to lecture 3: Instead of passing the complete test code into the message broker (Redis), a reference to the test code (field of db table programming_assignments) could be passed
- instead of short polling
