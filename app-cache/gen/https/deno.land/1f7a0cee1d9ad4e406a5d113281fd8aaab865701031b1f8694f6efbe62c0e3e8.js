import { ArrayReplyCode, BulkReplyCode, ErrorReplyCode, IntegerReplyCode, SimpleStringCode } from "../shared/reply.ts";
import { EOFError, ErrorReplyError, InvalidStateError } from "../../errors.ts";
import { decoder } from "../../internal/encoding.ts";
export async function readReply(reader, returnUint8Arrays) {
    const res = await reader.peek(1);
    if (res == null) {
        throw new EOFError();
    }
    const code = res[0];
    if (code === ErrorReplyCode) {
        await tryReadErrorReply(reader);
    }
    switch(code){
        case IntegerReplyCode:
            return readIntegerReply(reader);
        case SimpleStringCode:
            return readSimpleStringReply(reader, returnUint8Arrays);
        case BulkReplyCode:
            return readBulkReply(reader, returnUint8Arrays);
        case ArrayReplyCode:
            return readArrayReply(reader, returnUint8Arrays);
        default:
            throw new InvalidStateError(`unknown code: '${String.fromCharCode(code)}' (${code})`);
    }
}
async function readIntegerReply(reader) {
    const line = await readLine(reader);
    if (line == null) {
        throw new InvalidStateError();
    }
    return Number.parseInt(decoder.decode(line.subarray(1, line.length)));
}
async function readBulkReply(reader, returnUint8Arrays) {
    const line = await readLine(reader);
    if (line == null) {
        throw new InvalidStateError();
    }
    if (line[0] !== BulkReplyCode) {
        tryParseErrorReply(line);
    }
    const size = parseSize(line);
    if (size < 0) {
        // nil bulk reply
        return null;
    }
    const dest = new Uint8Array(size + 2);
    await reader.readFull(dest);
    const body = dest.subarray(0, dest.length - 2); // Strip CR and LF
    return returnUint8Arrays ? body : decoder.decode(body);
}
async function readSimpleStringReply(reader, returnUint8Arrays) {
    const line = await readLine(reader);
    if (line == null) {
        throw new InvalidStateError();
    }
    if (line[0] !== SimpleStringCode) {
        tryParseErrorReply(line);
    }
    const body = line.subarray(1, line.length);
    return returnUint8Arrays ? body : decoder.decode(body);
}
export async function readArrayReply(reader, returnUint8Arrays) {
    const line = await readLine(reader);
    if (line == null) {
        throw new InvalidStateError();
    }
    const argCount = parseSize(line);
    if (argCount === -1) {
        // `-1` indicates a null array
        return null;
    }
    const array = [];
    for(let i = 0; i < argCount; i++){
        array.push(await readReply(reader, returnUint8Arrays));
    }
    return array;
}
function tryParseErrorReply(line) {
    const code = line[0];
    if (code === ErrorReplyCode) {
        throw new ErrorReplyError(decoder.decode(line));
    }
    throw new Error(`invalid line: ${line}`);
}
async function tryReadErrorReply(reader) {
    const line = await readLine(reader);
    if (line == null) {
        throw new InvalidStateError();
    }
    tryParseErrorReply(line);
}
async function readLine(reader) {
    const result = await reader.readLine();
    if (result == null) {
        throw new InvalidStateError();
    }
    const { line  } = result;
    return line;
}
function parseSize(line) {
    const sizeStr = line.subarray(1, line.length);
    const size = parseInt(decoder.decode(sizeStr));
    return size;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMzIuMC9wcm90b2NvbC9kZW5vX3N0cmVhbXMvcmVwbHkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQnVmUmVhZGVyIH0gZnJvbSBcIi4uLy4uL3ZlbmRvci9odHRwcy9kZW5vLmxhbmQvc3RkL2lvL2J1Zl9yZWFkZXIudHNcIjtcbmltcG9ydCB0eXBlICogYXMgdHlwZXMgZnJvbSBcIi4uL3NoYXJlZC90eXBlcy50c1wiO1xuaW1wb3J0IHtcbiAgQXJyYXlSZXBseUNvZGUsXG4gIEJ1bGtSZXBseUNvZGUsXG4gIEVycm9yUmVwbHlDb2RlLFxuICBJbnRlZ2VyUmVwbHlDb2RlLFxuICBTaW1wbGVTdHJpbmdDb2RlLFxufSBmcm9tIFwiLi4vc2hhcmVkL3JlcGx5LnRzXCI7XG5pbXBvcnQgeyBFT0ZFcnJvciwgRXJyb3JSZXBseUVycm9yLCBJbnZhbGlkU3RhdGVFcnJvciB9IGZyb20gXCIuLi8uLi9lcnJvcnMudHNcIjtcbmltcG9ydCB7IGRlY29kZXIgfSBmcm9tIFwiLi4vLi4vaW50ZXJuYWwvZW5jb2RpbmcudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRSZXBseShcbiAgcmVhZGVyOiBCdWZSZWFkZXIsXG4gIHJldHVyblVpbnQ4QXJyYXlzPzogYm9vbGVhbixcbik6IFByb21pc2U8dHlwZXMuUmVkaXNSZXBseT4ge1xuICBjb25zdCByZXMgPSBhd2FpdCByZWFkZXIucGVlaygxKTtcbiAgaWYgKHJlcyA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVPRkVycm9yKCk7XG4gIH1cblxuICBjb25zdCBjb2RlID0gcmVzWzBdO1xuICBpZiAoY29kZSA9PT0gRXJyb3JSZXBseUNvZGUpIHtcbiAgICBhd2FpdCB0cnlSZWFkRXJyb3JSZXBseShyZWFkZXIpO1xuICB9XG5cbiAgc3dpdGNoIChjb2RlKSB7XG4gICAgY2FzZSBJbnRlZ2VyUmVwbHlDb2RlOlxuICAgICAgcmV0dXJuIHJlYWRJbnRlZ2VyUmVwbHkocmVhZGVyKTtcbiAgICBjYXNlIFNpbXBsZVN0cmluZ0NvZGU6XG4gICAgICByZXR1cm4gcmVhZFNpbXBsZVN0cmluZ1JlcGx5KHJlYWRlciwgcmV0dXJuVWludDhBcnJheXMpO1xuICAgIGNhc2UgQnVsa1JlcGx5Q29kZTpcbiAgICAgIHJldHVybiByZWFkQnVsa1JlcGx5KHJlYWRlciwgcmV0dXJuVWludDhBcnJheXMpO1xuICAgIGNhc2UgQXJyYXlSZXBseUNvZGU6XG4gICAgICByZXR1cm4gcmVhZEFycmF5UmVwbHkocmVhZGVyLCByZXR1cm5VaW50OEFycmF5cyk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkU3RhdGVFcnJvcihcbiAgICAgICAgYHVua25vd24gY29kZTogJyR7U3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKX0nICgke2NvZGV9KWAsXG4gICAgICApO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRJbnRlZ2VyUmVwbHkoXG4gIHJlYWRlcjogQnVmUmVhZGVyLFxuKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgY29uc3QgbGluZSA9IGF3YWl0IHJlYWRMaW5lKHJlYWRlcik7XG4gIGlmIChsaW5lID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgSW52YWxpZFN0YXRlRXJyb3IoKTtcbiAgfVxuXG4gIHJldHVybiBOdW1iZXIucGFyc2VJbnQoZGVjb2Rlci5kZWNvZGUobGluZS5zdWJhcnJheSgxLCBsaW5lLmxlbmd0aCkpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZEJ1bGtSZXBseShcbiAgcmVhZGVyOiBCdWZSZWFkZXIsXG4gIHJldHVyblVpbnQ4QXJyYXlzPzogYm9vbGVhbixcbik6IFByb21pc2U8c3RyaW5nIHwgdHlwZXMuQmluYXJ5IHwgbnVsbD4ge1xuICBjb25zdCBsaW5lID0gYXdhaXQgcmVhZExpbmUocmVhZGVyKTtcbiAgaWYgKGxpbmUgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBJbnZhbGlkU3RhdGVFcnJvcigpO1xuICB9XG5cbiAgaWYgKGxpbmVbMF0gIT09IEJ1bGtSZXBseUNvZGUpIHtcbiAgICB0cnlQYXJzZUVycm9yUmVwbHkobGluZSk7XG4gIH1cblxuICBjb25zdCBzaXplID0gcGFyc2VTaXplKGxpbmUpO1xuICBpZiAoc2l6ZSA8IDApIHtcbiAgICAvLyBuaWwgYnVsayByZXBseVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgZGVzdCA9IG5ldyBVaW50OEFycmF5KHNpemUgKyAyKTtcbiAgYXdhaXQgcmVhZGVyLnJlYWRGdWxsKGRlc3QpO1xuICBjb25zdCBib2R5ID0gZGVzdC5zdWJhcnJheSgwLCBkZXN0Lmxlbmd0aCAtIDIpOyAvLyBTdHJpcCBDUiBhbmQgTEZcbiAgcmV0dXJuIHJldHVyblVpbnQ4QXJyYXlzID8gYm9keSA6IGRlY29kZXIuZGVjb2RlKGJvZHkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkU2ltcGxlU3RyaW5nUmVwbHkoXG4gIHJlYWRlcjogQnVmUmVhZGVyLFxuICByZXR1cm5VaW50OEFycmF5cz86IGJvb2xlYW4sXG4pOiBQcm9taXNlPHN0cmluZyB8IHR5cGVzLkJpbmFyeT4ge1xuICBjb25zdCBsaW5lID0gYXdhaXQgcmVhZExpbmUocmVhZGVyKTtcbiAgaWYgKGxpbmUgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBJbnZhbGlkU3RhdGVFcnJvcigpO1xuICB9XG5cbiAgaWYgKGxpbmVbMF0gIT09IFNpbXBsZVN0cmluZ0NvZGUpIHtcbiAgICB0cnlQYXJzZUVycm9yUmVwbHkobGluZSk7XG4gIH1cbiAgY29uc3QgYm9keSA9IGxpbmUuc3ViYXJyYXkoMSwgbGluZS5sZW5ndGgpO1xuICByZXR1cm4gcmV0dXJuVWludDhBcnJheXMgPyBib2R5IDogZGVjb2Rlci5kZWNvZGUoYm9keSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkQXJyYXlSZXBseShcbiAgcmVhZGVyOiBCdWZSZWFkZXIsXG4gIHJldHVyblVpbnQ4QXJyYXlzPzogYm9vbGVhbixcbik6IFByb21pc2U8QXJyYXk8dHlwZXMuUmVkaXNSZXBseT4gfCBudWxsPiB7XG4gIGNvbnN0IGxpbmUgPSBhd2FpdCByZWFkTGluZShyZWFkZXIpO1xuICBpZiAobGluZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEludmFsaWRTdGF0ZUVycm9yKCk7XG4gIH1cblxuICBjb25zdCBhcmdDb3VudCA9IHBhcnNlU2l6ZShsaW5lKTtcbiAgaWYgKGFyZ0NvdW50ID09PSAtMSkge1xuICAgIC8vIGAtMWAgaW5kaWNhdGVzIGEgbnVsbCBhcnJheVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgYXJyYXk6IEFycmF5PHR5cGVzLlJlZGlzUmVwbHk+ID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJnQ291bnQ7IGkrKykge1xuICAgIGFycmF5LnB1c2goYXdhaXQgcmVhZFJlcGx5KHJlYWRlciwgcmV0dXJuVWludDhBcnJheXMpKTtcbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIHRyeVBhcnNlRXJyb3JSZXBseShsaW5lOiBVaW50OEFycmF5KTogbmV2ZXIge1xuICBjb25zdCBjb2RlID0gbGluZVswXTtcbiAgaWYgKGNvZGUgPT09IEVycm9yUmVwbHlDb2RlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yUmVwbHlFcnJvcihkZWNvZGVyLmRlY29kZShsaW5lKSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGxpbmU6ICR7bGluZX1gKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdHJ5UmVhZEVycm9yUmVwbHkocmVhZGVyOiBCdWZSZWFkZXIpOiBQcm9taXNlPG5ldmVyPiB7XG4gIGNvbnN0IGxpbmUgPSBhd2FpdCByZWFkTGluZShyZWFkZXIpO1xuICBpZiAobGluZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEludmFsaWRTdGF0ZUVycm9yKCk7XG4gIH1cbiAgdHJ5UGFyc2VFcnJvclJlcGx5KGxpbmUpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkTGluZShyZWFkZXI6IEJ1ZlJlYWRlcik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCByZWFkZXIucmVhZExpbmUoKTtcbiAgaWYgKHJlc3VsdCA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEludmFsaWRTdGF0ZUVycm9yKCk7XG4gIH1cblxuICBjb25zdCB7IGxpbmUgfSA9IHJlc3VsdDtcbiAgcmV0dXJuIGxpbmU7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU2l6ZShsaW5lOiBVaW50OEFycmF5KTogbnVtYmVyIHtcbiAgY29uc3Qgc2l6ZVN0ciA9IGxpbmUuc3ViYXJyYXkoMSwgbGluZS5sZW5ndGgpO1xuICBjb25zdCBzaXplID0gcGFyc2VJbnQoZGVjb2Rlci5kZWNvZGUoc2l6ZVN0cikpO1xuICByZXR1cm4gc2l6ZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxTQUNFLGNBQWMsRUFDZCxhQUFhLEVBQ2IsY0FBYyxFQUNkLGdCQUFnQixFQUNoQixnQkFBZ0IsUUFDWCxxQkFBcUI7QUFDNUIsU0FBUyxRQUFRLEVBQUUsZUFBZSxFQUFFLGlCQUFpQixRQUFRLGtCQUFrQjtBQUMvRSxTQUFTLE9BQU8sUUFBUSw2QkFBNkI7QUFFckQsT0FBTyxlQUFlLFVBQ3BCLE1BQWlCLEVBQ2pCLGlCQUEyQixFQUNBO0lBQzNCLE1BQU0sTUFBTSxNQUFNLE9BQU8sSUFBSSxDQUFDO0lBQzlCLElBQUksT0FBTyxJQUFJLEVBQUU7UUFDZixNQUFNLElBQUksV0FBVztJQUN2QixDQUFDO0lBRUQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxFQUFFO0lBQ25CLElBQUksU0FBUyxnQkFBZ0I7UUFDM0IsTUFBTSxrQkFBa0I7SUFDMUIsQ0FBQztJQUVELE9BQVE7UUFDTixLQUFLO1lBQ0gsT0FBTyxpQkFBaUI7UUFDMUIsS0FBSztZQUNILE9BQU8sc0JBQXNCLFFBQVE7UUFDdkMsS0FBSztZQUNILE9BQU8sY0FBYyxRQUFRO1FBQy9C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