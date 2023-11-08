import { writable } from 'svelte/store';

const nextAssignmentId = writable(1);
const assignments = writable([]);
const assignmentsCount = writable(0);
const assignment = writable({});

export { assignment, assignments, assignmentsCount };