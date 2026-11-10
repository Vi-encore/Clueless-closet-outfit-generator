import { SCALE_MAX, SCALE_MIN } from '@closet/core';

export const SCALE = Array.from({ length: SCALE_MAX - SCALE_MIN + 1 }, (_, at) => SCALE_MIN + at);
