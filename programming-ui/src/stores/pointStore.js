import { writable } from 'svelte/store';

const points = writable(0);

export { points }