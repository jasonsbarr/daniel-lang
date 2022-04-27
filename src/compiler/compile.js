import { read } from "../reader/reader.js";
import { emit } from "./emit.js";

export const compile = (code) => emit(read(code));
