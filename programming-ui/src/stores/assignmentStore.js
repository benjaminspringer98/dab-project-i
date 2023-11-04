import { writable } from 'svelte/store';

const nextAssignmentId = writable(1);

export { nextAssignmentId };