// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { fromFileUrl } from "../path.ts";
import { Buffer } from "../buffer.ts";
import { writeAllSync } from "../../streams/conversion.ts";
import { checkEncoding, getEncoding, getOpenOptions, isFileOptions } from "./_fs_common.ts";
import { isWindows } from "../../_util/os.ts";
import { AbortError, denoErrorToNodeError } from "../internal/errors.ts";
import { validateStringAfterArrayBufferView } from "../internal/fs/utils.mjs";
export function writeFile(pathOrRid, // deno-lint-ignore ban-types
data, optOrCallback, callback) {
    const callbackFn = optOrCallback instanceof Function ? optOrCallback : callback;
    const options = optOrCallback instanceof Function ? undefined : optOrCallback;
    if (!callbackFn) {
        throw new TypeError("Callback must be a function.");
    }
    pathOrRid = pathOrRid instanceof URL ? fromFileUrl(pathOrRid) : pathOrRid;
    const flag = isFileOptions(options) ? options.flag : undefined;
    const mode = isFileOptions(options) ? options.mode : undefined;
    const encoding = checkEncoding(getEncoding(options)) || "utf8";
    const openOptions = getOpenOptions(flag || "w");
    if (!ArrayBuffer.isView(data)) {
        validateStringAfterArrayBufferView(data, "data");
        data = Buffer.from(String(data), encoding);
    }
    const isRid = typeof pathOrRid === "number";
    let file;
    let error = null;
    (async ()=>{
        try {
            file = isRid ? new Deno.FsFile(pathOrRid) : await Deno.open(pathOrRid, openOptions);
            // ignore mode because it's not supported on windows
            // TODO: remove `!isWindows` when `Deno.chmod` is supported
            if (!isRid && mode && !isWindows) {
                await Deno.chmod(pathOrRid, mode);
            }
            const signal = isFileOptions(options) ? options.signal : undefined;
            await writeAll(file, data, {
                signal
            });
        } catch (e) {
            error = e instanceof Error ? denoErrorToNodeError(e, {
                syscall: "write"
            }) : new Error("[non-error thrown]");
        } finally{
            // Make sure to close resource
            if (!isRid && file) file.close();
            callbackFn(error);
        }
    })();
}
export function writeFileSync(pathOrRid, // deno-lint-ignore ban-types
data, options) {
    pathOrRid = pathOrRid instanceof URL ? fromFileUrl(pathOrRid) : pathOrRid;
    const flag = isFileOptions(options) ? options.flag : undefined;
    const mode = isFileOptions(options) ? options.mode : undefined;
    const encoding = checkEncoding(getEncoding(options)) || "utf8";
    const openOptions = getOpenOptions(flag || "w");
    if (!ArrayBuffer.isView(data)) {
        validateStringAfterArrayBufferView(data, "data");
        data = Buffer.from(String(data), encoding);
    }
    const isRid = typeof pathOrRid === "number";
    let file;
    let error = null;
    try {
        file = isRid ? new Deno.FsFile(pathOrRid) : Deno.openSync(pathOrRid, openOptions);
        // ignore mode because it's not supported on windows
        // TODO: remove `!isWindows` when `Deno.chmod` is supported
        if (!isRid && mode && !isWindows) {
            Deno.chmodSync(pathOrRid, mode);
        }
        writeAllSync(file, data);
    } catch (e) {
        error = e instanceof Error ? denoErrorToNodeError(e, {
            syscall: "write"
        }) : new Error("[non-error thrown]");
    } finally{
        // Make sure to close resource
        if (!isRid && file) file.close();
    }
    if (error) throw error;
}
async function writeAll(w, arr, options = {}) {
    const { offset =0 , length =arr.byteLength , signal  } = options;
    checkAborted(signal);
    const written = await w.write(arr.subarray(offset, offset + length));
    if (written === length) {
        return;
    }
    await writeAll(w, arr, {
        offset: offset + written,
        length: length - written,
        signal
    });
}
function checkAborted(signal) {
    if (signal?.aborted) {
        throw new AbortError();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL25vZGUvX2ZzL19mc193cml0ZUZpbGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IEVuY29kaW5ncyB9IGZyb20gXCIuLi9fdXRpbHMudHNcIjtcbmltcG9ydCB7IGZyb21GaWxlVXJsIH0gZnJvbSBcIi4uL3BhdGgudHNcIjtcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCIuLi9idWZmZXIudHNcIjtcbmltcG9ydCB7IHdyaXRlQWxsU3luYyB9IGZyb20gXCIuLi8uLi9zdHJlYW1zL2NvbnZlcnNpb24udHNcIjtcbmltcG9ydCB7XG4gIENhbGxiYWNrV2l0aEVycm9yLFxuICBjaGVja0VuY29kaW5nLFxuICBnZXRFbmNvZGluZyxcbiAgZ2V0T3Blbk9wdGlvbnMsXG4gIGlzRmlsZU9wdGlvbnMsXG4gIFdyaXRlRmlsZU9wdGlvbnMsXG59IGZyb20gXCIuL19mc19jb21tb24udHNcIjtcbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuLi8uLi9fdXRpbC9vcy50c1wiO1xuaW1wb3J0IHsgQWJvcnRFcnJvciwgZGVub0Vycm9yVG9Ob2RlRXJyb3IgfSBmcm9tIFwiLi4vaW50ZXJuYWwvZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZVN0cmluZ0FmdGVyQXJyYXlCdWZmZXJWaWV3IH0gZnJvbSBcIi4uL2ludGVybmFsL2ZzL3V0aWxzLm1qc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVGaWxlKFxuICBwYXRoT3JSaWQ6IHN0cmluZyB8IG51bWJlciB8IFVSTCxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBiYW4tdHlwZXNcbiAgZGF0YTogc3RyaW5nIHwgVWludDhBcnJheSB8IE9iamVjdCxcbiAgb3B0T3JDYWxsYmFjazogRW5jb2RpbmdzIHwgQ2FsbGJhY2tXaXRoRXJyb3IgfCBXcml0ZUZpbGVPcHRpb25zIHwgdW5kZWZpbmVkLFxuICBjYWxsYmFjaz86IENhbGxiYWNrV2l0aEVycm9yLFxuKTogdm9pZCB7XG4gIGNvbnN0IGNhbGxiYWNrRm46IENhbGxiYWNrV2l0aEVycm9yIHwgdW5kZWZpbmVkID1cbiAgICBvcHRPckNhbGxiYWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gPyBvcHRPckNhbGxiYWNrIDogY2FsbGJhY2s7XG4gIGNvbnN0IG9wdGlvbnM6IEVuY29kaW5ncyB8IFdyaXRlRmlsZU9wdGlvbnMgfCB1bmRlZmluZWQgPVxuICAgIG9wdE9yQ2FsbGJhY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiA/IHVuZGVmaW5lZCA6IG9wdE9yQ2FsbGJhY2s7XG5cbiAgaWYgKCFjYWxsYmFja0ZuKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbi5cIik7XG4gIH1cblxuICBwYXRoT3JSaWQgPSBwYXRoT3JSaWQgaW5zdGFuY2VvZiBVUkwgPyBmcm9tRmlsZVVybChwYXRoT3JSaWQpIDogcGF0aE9yUmlkO1xuXG4gIGNvbnN0IGZsYWc6IHN0cmluZyB8IHVuZGVmaW5lZCA9IGlzRmlsZU9wdGlvbnMob3B0aW9ucylcbiAgICA/IG9wdGlvbnMuZmxhZ1xuICAgIDogdW5kZWZpbmVkO1xuXG4gIGNvbnN0IG1vZGU6IG51bWJlciB8IHVuZGVmaW5lZCA9IGlzRmlsZU9wdGlvbnMob3B0aW9ucylcbiAgICA/IG9wdGlvbnMubW9kZVxuICAgIDogdW5kZWZpbmVkO1xuXG4gIGNvbnN0IGVuY29kaW5nID0gY2hlY2tFbmNvZGluZyhnZXRFbmNvZGluZyhvcHRpb25zKSkgfHwgXCJ1dGY4XCI7XG4gIGNvbnN0IG9wZW5PcHRpb25zID0gZ2V0T3Blbk9wdGlvbnMoZmxhZyB8fCBcIndcIik7XG5cbiAgaWYgKCFBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkpIHtcbiAgICB2YWxpZGF0ZVN0cmluZ0FmdGVyQXJyYXlCdWZmZXJWaWV3KGRhdGEsIFwiZGF0YVwiKTtcbiAgICBkYXRhID0gQnVmZmVyLmZyb20oU3RyaW5nKGRhdGEpLCBlbmNvZGluZyk7XG4gIH1cblxuICBjb25zdCBpc1JpZCA9IHR5cGVvZiBwYXRoT3JSaWQgPT09IFwibnVtYmVyXCI7XG4gIGxldCBmaWxlO1xuXG4gIGxldCBlcnJvcjogRXJyb3IgfCBudWxsID0gbnVsbDtcbiAgKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgZmlsZSA9IGlzUmlkXG4gICAgICAgID8gbmV3IERlbm8uRnNGaWxlKHBhdGhPclJpZCBhcyBudW1iZXIpXG4gICAgICAgIDogYXdhaXQgRGVuby5vcGVuKHBhdGhPclJpZCBhcyBzdHJpbmcsIG9wZW5PcHRpb25zKTtcblxuICAgICAgLy8gaWdub3JlIG1vZGUgYmVjYXVzZSBpdCdzIG5vdCBzdXBwb3J0ZWQgb24gd2luZG93c1xuICAgICAgLy8gVE9ETzogcmVtb3ZlIGAhaXNXaW5kb3dzYCB3aGVuIGBEZW5vLmNobW9kYCBpcyBzdXBwb3J0ZWRcbiAgICAgIGlmICghaXNSaWQgJiYgbW9kZSAmJiAhaXNXaW5kb3dzKSB7XG4gICAgICAgIGF3YWl0IERlbm8uY2htb2QocGF0aE9yUmlkIGFzIHN0cmluZywgbW9kZSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNpZ25hbDogQWJvcnRTaWduYWwgfCB1bmRlZmluZWQgPSBpc0ZpbGVPcHRpb25zKG9wdGlvbnMpXG4gICAgICAgID8gb3B0aW9ucy5zaWduYWxcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICBhd2FpdCB3cml0ZUFsbChmaWxlLCBkYXRhIGFzIFVpbnQ4QXJyYXksIHsgc2lnbmFsIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGVycm9yID0gZSBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgID8gZGVub0Vycm9yVG9Ob2RlRXJyb3IoZSwgeyBzeXNjYWxsOiBcIndyaXRlXCIgfSlcbiAgICAgICAgOiBuZXcgRXJyb3IoXCJbbm9uLWVycm9yIHRocm93bl1cIik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIE1ha2Ugc3VyZSB0byBjbG9zZSByZXNvdXJjZVxuICAgICAgaWYgKCFpc1JpZCAmJiBmaWxlKSBmaWxlLmNsb3NlKCk7XG4gICAgICBjYWxsYmFja0ZuKGVycm9yKTtcbiAgICB9XG4gIH0pKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZpbGVTeW5jKFxuICBwYXRoT3JSaWQ6IHN0cmluZyB8IG51bWJlciB8IFVSTCxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBiYW4tdHlwZXNcbiAgZGF0YTogc3RyaW5nIHwgVWludDhBcnJheSB8IE9iamVjdCxcbiAgb3B0aW9ucz86IEVuY29kaW5ncyB8IFdyaXRlRmlsZU9wdGlvbnMsXG4pOiB2b2lkIHtcbiAgcGF0aE9yUmlkID0gcGF0aE9yUmlkIGluc3RhbmNlb2YgVVJMID8gZnJvbUZpbGVVcmwocGF0aE9yUmlkKSA6IHBhdGhPclJpZDtcblxuICBjb25zdCBmbGFnOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBpc0ZpbGVPcHRpb25zKG9wdGlvbnMpXG4gICAgPyBvcHRpb25zLmZsYWdcbiAgICA6IHVuZGVmaW5lZDtcblxuICBjb25zdCBtb2RlOiBudW1iZXIgfCB1bmRlZmluZWQgPSBpc0ZpbGVPcHRpb25zKG9wdGlvbnMpXG4gICAgPyBvcHRpb25zLm1vZGVcbiAgICA6IHVuZGVmaW5lZDtcblxuICBjb25zdCBlbmNvZGluZyA9IGNoZWNrRW5jb2RpbmcoZ2V0RW5jb2Rpbmcob3B0aW9ucykpIHx8IFwidXRmOFwiO1xuICBjb25zdCBvcGVuT3B0aW9ucyA9IGdldE9wZW5PcHRpb25zKGZsYWcgfHwgXCJ3XCIpO1xuXG4gIGlmICghQXJyYXlCdWZmZXIuaXNWaWV3KGRhdGEpKSB7XG4gICAgdmFsaWRhdGVTdHJpbmdBZnRlckFycmF5QnVmZmVyVmlldyhkYXRhLCBcImRhdGFcIik7XG4gICAgZGF0YSA9IEJ1ZmZlci5mcm9tKFN0cmluZyhkYXRhKSwgZW5jb2RpbmcpO1xuICB9XG5cbiAgY29uc3QgaXNSaWQgPSB0eXBlb2YgcGF0aE9yUmlkID09PSBcIm51bWJlclwiO1xuICBsZXQgZmlsZTtcblxuICBsZXQgZXJyb3I6IEVycm9yIHwgbnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgZmlsZSA9IGlzUmlkXG4gICAgICA/IG5ldyBEZW5vLkZzRmlsZShwYXRoT3JSaWQgYXMgbnVtYmVyKVxuICAgICAgOiBEZW5vLm9wZW5TeW5jKHBhdGhPclJpZCBhcyBzdHJpbmcsIG9wZW5PcHRpb25zKTtcblxuICAgIC8vIGlnbm9yZSBtb2RlIGJlY2F1c2UgaXQncyBub3Qgc3VwcG9ydGVkIG9uIHdpbmRvd3NcbiAgICAvLyBUT0RPOiByZW1vdmUgYCFpc1dpbmRvd3NgIHdoZW4gYERlbm8uY2htb2RgIGlzIHN1cHBvcnRlZFxuICAgIGlmICghaXNSaWQgJiYgbW9kZSAmJiAhaXNXaW5kb3dzKSB7XG4gICAgICBEZW5vLmNobW9kU3luYyhwYXRoT3JSaWQgYXMgc3RyaW5nLCBtb2RlKTtcbiAgICB9XG5cbiAgICB3cml0ZUFsbFN5bmMoZmlsZSwgZGF0YSBhcyBVaW50OEFycmF5KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9yID0gZSBpbnN0YW5jZW9mIEVycm9yXG4gICAgICA/IGRlbm9FcnJvclRvTm9kZUVycm9yKGUsIHsgc3lzY2FsbDogXCJ3cml0ZVwiIH0pXG4gICAgICA6IG5ldyBFcnJvcihcIltub24tZXJyb3IgdGhyb3duXVwiKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBNYWtlIHN1cmUgdG8gY2xvc2UgcmVzb3VyY2VcbiAgICBpZiAoIWlzUmlkICYmIGZpbGUpIGZpbGUuY2xvc2UoKTtcbiAgfVxuXG4gIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XG59XG5cbmludGVyZmFjZSBXcml0ZUFsbE9wdGlvbnMge1xuICBvZmZzZXQ/OiBudW1iZXI7XG4gIGxlbmd0aD86IG51bWJlcjtcbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG59XG5hc3luYyBmdW5jdGlvbiB3cml0ZUFsbChcbiAgdzogRGVuby5Xcml0ZXIsXG4gIGFycjogVWludDhBcnJheSxcbiAgb3B0aW9uczogV3JpdGVBbGxPcHRpb25zID0ge30sXG4pIHtcbiAgY29uc3QgeyBvZmZzZXQgPSAwLCBsZW5ndGggPSBhcnIuYnl0ZUxlbmd0aCwgc2lnbmFsIH0gPSBvcHRpb25zO1xuICBjaGVja0Fib3J0ZWQoc2lnbmFsKTtcblxuICBjb25zdCB3cml0dGVuID0gYXdhaXQgdy53cml0ZShhcnIuc3ViYXJyYXkob2Zmc2V0LCBvZmZzZXQgKyBsZW5ndGgpKTtcblxuICBpZiAod3JpdHRlbiA9PT0gbGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgYXdhaXQgd3JpdGVBbGwodywgYXJyLCB7XG4gICAgb2Zmc2V0OiBvZmZzZXQgKyB3cml0dGVuLFxuICAgIGxlbmd0aDogbGVuZ3RoIC0gd3JpdHRlbixcbiAgICBzaWduYWwsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjaGVja0Fib3J0ZWQoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgaWYgKHNpZ25hbD8uYWJvcnRlZCkge1xuICAgIHRocm93IG5ldyBBYm9ydEVycm9yKCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUUsU0FBUyxXQUFXLFFBQVEsYUFBYTtBQUN6QyxTQUFTLE1BQU0sUUFBUSxlQUFlO0FBQ3RDLFNBQVMsWUFBWSxRQUFRLDhCQUE4QjtBQUMzRCxTQUVFLGFBQWEsRUFDYixXQUFXLEVBQ1gsY0FBYyxFQUNkLGFBQWEsUUFFUixrQkFBa0I7QUFDekIsU0FBUyxTQUFTLFFBQVEsb0JBQW9CO0FBQzlDLFNBQVMsVUFBVSxFQUFFLG9CQUFvQixRQUFRLHdCQUF3QjtBQUN6RSxTQUFTLGtDQUFrQyxRQUFRLDJCQUEyQjtBQUU5RSxPQUFPLFNBQVMsVUFDZCxTQUFnQyxFQUNoQyw2QkFBNkI7QUFDN0IsSUFBa0MsRUFDbEMsYUFBMkUsRUFDM0UsUUFBNEIsRUFDdEI7SUFDTixN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