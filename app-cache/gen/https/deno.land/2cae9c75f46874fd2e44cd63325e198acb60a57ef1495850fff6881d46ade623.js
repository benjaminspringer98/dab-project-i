import { Protocol as DenoStreamsProtocol } from "./protocol/deno_streams/mod.ts";
import { exponentialBackoff } from "./backoff.ts";
import { ErrorReplyError, isRetriableError } from "./errors.ts";
import { kUnstableCreateProtocol, kUnstablePipeline, kUnstableReadReply } from "./internal/symbols.ts";
import { deferred } from "./vendor/https/deno.land/std/async/deferred.ts";
import { delay } from "./vendor/https/deno.land/std/async/delay.ts";
export const kEmptyRedisArgs = [];
export class RedisConnection {
    options;
    name;
    maxRetryCount;
    hostname;
    port;
    _isClosed;
    _isConnected;
    backoff;
    commandQueue;
    #conn;
    #protocol;
    get isClosed() {
        return this._isClosed;
    }
    get isConnected() {
        return this._isConnected;
    }
    get isRetriable() {
        return this.maxRetryCount > 0;
    }
    constructor(hostname, port, options){
        this.options = options;
        this.name = null;
        this.maxRetryCount = 10;
        this._isClosed = false;
        this._isConnected = false;
        this.commandQueue = [];
        this.hostname = hostname;
        this.port = port;
        if (options.name) {
            this.name = options.name;
        }
        if (options.maxRetryCount != null) {
            this.maxRetryCount = options.maxRetryCount;
        }
        this.backoff = options.backoff ?? exponentialBackoff();
    }
    async authenticate(username, password) {
        try {
            password && username ? await this.sendCommand("AUTH", [
                username,
                password
            ]) : await this.sendCommand("AUTH", [
                password
            ]);
        } catch (error) {
            if (error instanceof ErrorReplyError) {
                throw new AuthenticationError("Authentication failed", {
                    cause: error
                });
            } else {
                throw error;
            }
        }
    }
    async selectDb(db = this.options.db) {
        if (!db) throw new Error("The database index is undefined.");
        await this.sendCommand("SELECT", [
            db
        ]);
    }
    sendCommand(command, args, options) {
        const promise = deferred();
        this.commandQueue.push({
            name: command,
            args: args ?? kEmptyRedisArgs,
            promise,
            returnUint8Arrays: options?.returnUint8Arrays
        });
        if (this.commandQueue.length === 1) {
            this.processCommandQueue();
        }
        return promise;
    }
    [kUnstableReadReply](returnsUint8Arrays) {
        return this.#protocol.readReply(returnsUint8Arrays);
    }
    [kUnstablePipeline](commands) {
        return this.#protocol.pipeline(commands);
    }
    /**
   * Connect to Redis server
   */ async connect() {
        await this.#connect(0);
    }
    async #connect(retryCount) {
        try {
            const dialOpts = {
                hostname: this.hostname,
                port: parsePortLike(this.port)
            };
            const conn = this.options?.tls ? await Deno.connectTls(dialOpts) : await Deno.connect(dialOpts);
            this.#conn = conn;
            this.#protocol = this.options?.[kUnstableCreateProtocol]?.(conn) ?? new DenoStreamsProtocol(conn);
            this._isClosed = false;
            this._isConnected = true;
            try {
                if (this.options.password != null) {
                    await this.authenticate(this.options.username, this.options.password);
                }
                if (this.options.db) {
                    await this.selectDb(this.options.db);
                }
            } catch (error) {
                this.close();
                throw error;
            }
            this.#enableHealthCheckIfNeeded();
        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error.cause ?? error;
            }
            const backoff = this.backoff(retryCount);
            retryCount++;
            if (retryCount >= this.maxRetryCount) {
                throw error;
            }
            await delay(backoff);
            await this.#connect(retryCount);
        }
    }
    close() {
        this._isClosed = true;
        this._isConnected = false;
        try {
            this.#conn.close();
        } catch (error) {
            if (!(error instanceof Deno.errors.BadResource)) throw error;
        }
    }
    async reconnect() {
        try {
            await this.sendCommand("PING");
            this._isConnected = true;
        } catch (_error) {
            this.close();
            await this.connect();
            await this.sendCommand("PING");
        }
    }
    async processCommandQueue() {
        const [command] = this.commandQueue;
        if (!command) return;
        try {
            const reply = await this.#protocol.sendCommand(command.name, command.args, command.returnUint8Arrays);
            command.promise.resolve(reply);
        } catch (error) {
            if (!isRetriableError(error) || this.isManuallyClosedByUser()) {
                return command.promise.reject(error);
            }
            for(let i = 0; i < this.maxRetryCount; i++){
                // Try to reconnect to the server and retry the command
                this.close();
                try {
                    await this.connect();
                    const reply = await this.#protocol.sendCommand(command.name, command.args, command.returnUint8Arrays);
                    return command.promise.resolve(reply);
                } catch  {
                    const backoff = this.backoff(i);
                    await delay(backoff);
                }
            }
            command.promise.reject(error);
        } finally{
            this.commandQueue.shift();
            this.processCommandQueue();
        }
    }
    isManuallyClosedByUser() {
        return this._isClosed && !this._isConnected;
    }
    #enableHealthCheckIfNeeded() {
        const { healthCheckInterval  } = this.options;
        if (healthCheckInterval == null) {
            return;
        }
        const ping = async ()=>{
            if (this.isManuallyClosedByUser()) {
                return;
            }
            try {
                await this.sendCommand("PING");
                this._isConnected = true;
            } catch  {
                // TODO: notify the user of an error
                this._isConnected = false;
            } finally{
                setTimeout(ping, healthCheckInterval);
            }
        };
        setTimeout(ping, healthCheckInterval);
    }
}
class AuthenticationError extends Error {
}
function parsePortLike(port) {
    let parsedPort;
    if (typeof port === "string") {
        parsedPort = parseInt(port);
    } else if (typeof port === "number") {
        parsedPort = port;
    } else {
        parsedPort = 6379;
    }
    if (!Number.isSafeInteger(parsedPort)) {
        throw new Error("Port is invalid");
    }
    return parsedPort;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMzIuMC9jb25uZWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb3RvY29sIGFzIERlbm9TdHJlYW1zUHJvdG9jb2wgfSBmcm9tIFwiLi9wcm90b2NvbC9kZW5vX3N0cmVhbXMvbW9kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFJlZGlzUmVwbHksIFJlZGlzVmFsdWUgfSBmcm9tIFwiLi9wcm90b2NvbC9zaGFyZWQvdHlwZXMudHNcIjtcbmltcG9ydCB0eXBlIHsgQ29tbWFuZCwgUHJvdG9jb2wgfSBmcm9tIFwiLi9wcm90b2NvbC9zaGFyZWQvcHJvdG9jb2wudHNcIjtcbmltcG9ydCB0eXBlIHsgQmFja29mZiB9IGZyb20gXCIuL2JhY2tvZmYudHNcIjtcbmltcG9ydCB7IGV4cG9uZW50aWFsQmFja29mZiB9IGZyb20gXCIuL2JhY2tvZmYudHNcIjtcbmltcG9ydCB7IEVycm9yUmVwbHlFcnJvciwgaXNSZXRyaWFibGVFcnJvciB9IGZyb20gXCIuL2Vycm9ycy50c1wiO1xuaW1wb3J0IHtcbiAga1Vuc3RhYmxlQ3JlYXRlUHJvdG9jb2wsXG4gIGtVbnN0YWJsZVBpcGVsaW5lLFxuICBrVW5zdGFibGVSZWFkUmVwbHksXG59IGZyb20gXCIuL2ludGVybmFsL3N5bWJvbHMudHNcIjtcbmltcG9ydCB7XG4gIERlZmVycmVkLFxuICBkZWZlcnJlZCxcbn0gZnJvbSBcIi4vdmVuZG9yL2h0dHBzL2Rlbm8ubGFuZC9zdGQvYXN5bmMvZGVmZXJyZWQudHNcIjtcbmltcG9ydCB7IGRlbGF5IH0gZnJvbSBcIi4vdmVuZG9yL2h0dHBzL2Rlbm8ubGFuZC9zdGQvYXN5bmMvZGVsYXkudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTZW5kQ29tbWFuZE9wdGlvbnMge1xuICAvKipcbiAgICogV2hlbiB0aGlzIG9wdGlvbiBpcyBzZXQsIHNpbXBsZSBvciBidWxrIHN0cmluZyByZXBsaWVzIGFyZSByZXR1cm5lZCBhcyBgVWludDhBcnJheWAgdHlwZS5cbiAgICpcbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHJldHVyblVpbnQ4QXJyYXlzPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0aW9uIHtcbiAgaXNDbG9zZWQ6IGJvb2xlYW47XG4gIGlzQ29ubmVjdGVkOiBib29sZWFuO1xuICBjbG9zZSgpOiB2b2lkO1xuICBjb25uZWN0KCk6IFByb21pc2U8dm9pZD47XG4gIHJlY29ubmVjdCgpOiBQcm9taXNlPHZvaWQ+O1xuICBzZW5kQ29tbWFuZChcbiAgICBjb21tYW5kOiBzdHJpbmcsXG4gICAgYXJncz86IEFycmF5PFJlZGlzVmFsdWU+LFxuICAgIG9wdGlvbnM/OiBTZW5kQ29tbWFuZE9wdGlvbnMsXG4gICk6IFByb21pc2U8UmVkaXNSZXBseT47XG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgW2tVbnN0YWJsZVJlYWRSZXBseV0ocmV0dXJuc1VpbnQ4QXJyYXlzPzogYm9vbGVhbik6IFByb21pc2U8UmVkaXNSZXBseT47XG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgW2tVbnN0YWJsZVBpcGVsaW5lXShcbiAgICBjb21tYW5kczogQXJyYXk8Q29tbWFuZD4sXG4gICk6IFByb21pc2U8QXJyYXk8UmVkaXNSZXBseSB8IEVycm9yUmVwbHlFcnJvcj4+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlZGlzQ29ubmVjdGlvbk9wdGlvbnMge1xuICB0bHM/OiBib29sZWFuO1xuICBkYj86IG51bWJlcjtcbiAgcGFzc3dvcmQ/OiBzdHJpbmc7XG4gIHVzZXJuYW1lPzogc3RyaW5nO1xuICBuYW1lPzogc3RyaW5nO1xuICAvKipcbiAgICogQGRlZmF1bHQgMTBcbiAgICovXG4gIG1heFJldHJ5Q291bnQ/OiBudW1iZXI7XG4gIGJhY2tvZmY/OiBCYWNrb2ZmO1xuICAvKipcbiAgICogV2hlbiB0aGlzIG9wdGlvbiBpcyBzZXQsIGEgYFBJTkdgIGNvbW1hbmQgaXMgc2VudCBldmVyeSBzcGVjaWZpZWQgbnVtYmVyIG9mIHNlY29uZHMuXG4gICAqL1xuICBoZWFsdGhDaGVja0ludGVydmFsPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgW2tVbnN0YWJsZUNyZWF0ZVByb3RvY29sXT86IChjb25uOiBEZW5vLkNvbm4pID0+IFByb3RvY29sO1xufVxuXG5leHBvcnQgY29uc3Qga0VtcHR5UmVkaXNBcmdzOiBBcnJheTxSZWRpc1ZhbHVlPiA9IFtdO1xuXG5pbnRlcmZhY2UgUGVuZGluZ0NvbW1hbmQge1xuICBuYW1lOiBzdHJpbmc7XG4gIGFyZ3M6IFJlZGlzVmFsdWVbXTtcbiAgcHJvbWlzZTogRGVmZXJyZWQ8UmVkaXNSZXBseT47XG4gIHJldHVyblVpbnQ4QXJyYXlzPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFJlZGlzQ29ubmVjdGlvbiBpbXBsZW1lbnRzIENvbm5lY3Rpb24ge1xuICBuYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtYXhSZXRyeUNvdW50ID0gMTA7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBob3N0bmFtZTogc3RyaW5nO1xuICBwcml2YXRlIHJlYWRvbmx5IHBvcnQ6IG51bWJlciB8IHN0cmluZztcbiAgcHJpdmF0ZSBfaXNDbG9zZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfaXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBiYWNrb2ZmOiBCYWNrb2ZmO1xuXG4gIHByaXZhdGUgY29tbWFuZFF1ZXVlOiBQZW5kaW5nQ29tbWFuZFtdID0gW107XG4gICNjb25uITogRGVuby5Db25uO1xuICAjcHJvdG9jb2whOiBQcm90b2NvbDtcblxuICBnZXQgaXNDbG9zZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQ2xvc2VkO1xuICB9XG5cbiAgZ2V0IGlzQ29ubmVjdGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc0Nvbm5lY3RlZDtcbiAgfVxuXG4gIGdldCBpc1JldHJpYWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5tYXhSZXRyeUNvdW50ID4gMDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGhvc3RuYW1lOiBzdHJpbmcsXG4gICAgcG9ydDogbnVtYmVyIHwgc3RyaW5nLFxuICAgIHByaXZhdGUgb3B0aW9uczogUmVkaXNDb25uZWN0aW9uT3B0aW9ucyxcbiAgKSB7XG4gICAgdGhpcy5ob3N0bmFtZSA9IGhvc3RuYW1lO1xuICAgIHRoaXMucG9ydCA9IHBvcnQ7XG4gICAgaWYgKG9wdGlvbnMubmFtZSkge1xuICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5tYXhSZXRyeUNvdW50ICE9IG51bGwpIHtcbiAgICAgIHRoaXMubWF4UmV0cnlDb3VudCA9IG9wdGlvbnMubWF4UmV0cnlDb3VudDtcbiAgICB9XG4gICAgdGhpcy5iYWNrb2ZmID0gb3B0aW9ucy5iYWNrb2ZmID8/IGV4cG9uZW50aWFsQmFja29mZigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhdXRoZW50aWNhdGUoXG4gICAgdXNlcm5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgcGFzc3dvcmQgJiYgdXNlcm5hbWVcbiAgICAgICAgPyBhd2FpdCB0aGlzLnNlbmRDb21tYW5kKFwiQVVUSFwiLCBbdXNlcm5hbWUsIHBhc3N3b3JkXSlcbiAgICAgICAgOiBhd2FpdCB0aGlzLnNlbmRDb21tYW5kKFwiQVVUSFwiLCBbcGFzc3dvcmRdKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3JSZXBseUVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBBdXRoZW50aWNhdGlvbkVycm9yKFwiQXV0aGVudGljYXRpb24gZmFpbGVkXCIsIHtcbiAgICAgICAgICBjYXVzZTogZXJyb3IsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzZWxlY3REYihcbiAgICBkYjogbnVtYmVyIHwgdW5kZWZpbmVkID0gdGhpcy5vcHRpb25zLmRiLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIWRiKSB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZGF0YWJhc2UgaW5kZXggaXMgdW5kZWZpbmVkLlwiKTtcbiAgICBhd2FpdCB0aGlzLnNlbmRDb21tYW5kKFwiU0VMRUNUXCIsIFtkYl0pO1xuICB9XG5cbiAgc2VuZENvbW1hbmQoXG4gICAgY29tbWFuZDogc3RyaW5nLFxuICAgIGFyZ3M/OiBBcnJheTxSZWRpc1ZhbHVlPixcbiAgICBvcHRpb25zPzogU2VuZENvbW1hbmRPcHRpb25zLFxuICApOiBQcm9taXNlPFJlZGlzUmVwbHk+IHtcbiAgICBjb25zdCBwcm9taXNlID0gZGVmZXJyZWQ8UmVkaXNSZXBseT4oKTtcbiAgICB0aGlzLmNvbW1hbmRRdWV1ZS5wdXNoKHtcbiAgICAgIG5hbWU6IGNvbW1hbmQsXG4gICAgICBhcmdzOiBhcmdzID8/IGtFbXB0eVJlZGlzQXJncyxcbiAgICAgIHByb21pc2UsXG4gICAgICByZXR1cm5VaW50OEFycmF5czogb3B0aW9ucz8ucmV0dXJuVWludDhBcnJheXMsXG4gICAgfSk7XG4gICAgaWYgKHRoaXMuY29tbWFuZFF1ZXVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdGhpcy5wcm9jZXNzQ29tbWFuZFF1ZXVlKCk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgW2tVbnN0YWJsZVJlYWRSZXBseV0ocmV0dXJuc1VpbnQ4QXJyYXlzPzogYm9vbGVhbik6IFByb21pc2U8UmVkaXNSZXBseT4ge1xuICAgIHJldHVybiB0aGlzLiNwcm90b2NvbC5yZWFkUmVwbHkocmV0dXJuc1VpbnQ4QXJyYXlzKTtcbiAgfVxuXG4gIFtrVW5zdGFibGVQaXBlbGluZV0oY29tbWFuZHM6IEFycmF5PENvbW1hbmQ+KSB7XG4gICAgcmV0dXJuIHRoaXMuI3Byb3RvY29sLnBpcGVsaW5lKGNvbW1hbmRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25uZWN0IHRvIFJlZGlzIHNlcnZlclxuICAgKi9cbiAgYXN5bmMgY29ubmVjdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLiNjb25uZWN0KDApO1xuICB9XG5cbiAgYXN5bmMgI2Nvbm5lY3QocmV0cnlDb3VudDogbnVtYmVyKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRpYWxPcHRzOiBEZW5vLkNvbm5lY3RPcHRpb25zID0ge1xuICAgICAgICBob3N0bmFtZTogdGhpcy5ob3N0bmFtZSxcbiAgICAgICAgcG9ydDogcGFyc2VQb3J0TGlrZSh0aGlzLnBvcnQpLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGNvbm46IERlbm8uQ29ubiA9IHRoaXMub3B0aW9ucz8udGxzXG4gICAgICAgID8gYXdhaXQgRGVuby5jb25uZWN0VGxzKGRpYWxPcHRzKVxuICAgICAgICA6IGF3YWl0IERlbm8uY29ubmVjdChkaWFsT3B0cyk7XG5cbiAgICAgIHRoaXMuI2Nvbm4gPSBjb25uO1xuICAgICAgdGhpcy4jcHJvdG9jb2wgPSB0aGlzLm9wdGlvbnM/LltrVW5zdGFibGVDcmVhdGVQcm90b2NvbF0/Lihjb25uKSA/P1xuICAgICAgICBuZXcgRGVub1N0cmVhbXNQcm90b2NvbChjb25uKTtcbiAgICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG4gICAgICB0aGlzLl9pc0Nvbm5lY3RlZCA9IHRydWU7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFzc3dvcmQgIT0gbnVsbCkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuYXV0aGVudGljYXRlKHRoaXMub3B0aW9ucy51c2VybmFtZSwgdGhpcy5vcHRpb25zLnBhc3N3b3JkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRiKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zZWxlY3REYih0aGlzLm9wdGlvbnMuZGIpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuXG4gICAgICB0aGlzLiNlbmFibGVIZWFsdGhDaGVja0lmTmVlZGVkKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEF1dGhlbnRpY2F0aW9uRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgKGVycm9yLmNhdXNlID8/IGVycm9yKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYmFja29mZiA9IHRoaXMuYmFja29mZihyZXRyeUNvdW50KTtcbiAgICAgIHJldHJ5Q291bnQrKztcbiAgICAgIGlmIChyZXRyeUNvdW50ID49IHRoaXMubWF4UmV0cnlDb3VudCkge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICAgIGF3YWl0IGRlbGF5KGJhY2tvZmYpO1xuICAgICAgYXdhaXQgdGhpcy4jY29ubmVjdChyZXRyeUNvdW50KTtcbiAgICB9XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IHRydWU7XG4gICAgdGhpcy5faXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgdGhpcy4jY29ubiEuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5CYWRSZXNvdXJjZSkpIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJlY29ubmVjdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5zZW5kQ29tbWFuZChcIlBJTkdcIik7XG4gICAgICB0aGlzLl9pc0Nvbm5lY3RlZCA9IHRydWU7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7IC8vIFRPRE86IE1heWJlIHdlIHNob3VsZCBsb2cgdGhpcyBlcnJvci5cbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIGF3YWl0IHRoaXMuY29ubmVjdCgpO1xuICAgICAgYXdhaXQgdGhpcy5zZW5kQ29tbWFuZChcIlBJTkdcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzQ29tbWFuZFF1ZXVlKCkge1xuICAgIGNvbnN0IFtjb21tYW5kXSA9IHRoaXMuY29tbWFuZFF1ZXVlO1xuICAgIGlmICghY29tbWFuZCkgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcGx5ID0gYXdhaXQgdGhpcy4jcHJvdG9jb2wuc2VuZENvbW1hbmQoXG4gICAgICAgIGNvbW1hbmQubmFtZSxcbiAgICAgICAgY29tbWFuZC5hcmdzLFxuICAgICAgICBjb21tYW5kLnJldHVyblVpbnQ4QXJyYXlzLFxuICAgICAgKTtcbiAgICAgIGNvbW1hbmQucHJvbWlzZS5yZXNvbHZlKHJlcGx5KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKFxuICAgICAgICAhaXNSZXRyaWFibGVFcnJvcihlcnJvcikgfHxcbiAgICAgICAgdGhpcy5pc01hbnVhbGx5Q2xvc2VkQnlVc2VyKClcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gY29tbWFuZC5wcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5tYXhSZXRyeUNvdW50OyBpKyspIHtcbiAgICAgICAgLy8gVHJ5IHRvIHJlY29ubmVjdCB0byB0aGUgc2VydmVyIGFuZCByZXRyeSB0aGUgY29tbWFuZFxuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5jb25uZWN0KCk7XG5cbiAgICAgICAgICBjb25zdCByZXBseSA9IGF3YWl0IHRoaXMuI3Byb3RvY29sLnNlbmRDb21tYW5kKFxuICAgICAgICAgICAgY29tbWFuZC5uYW1lLFxuICAgICAgICAgICAgY29tbWFuZC5hcmdzLFxuICAgICAgICAgICAgY29tbWFuZC5yZXR1cm5VaW50OEFycmF5cyxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGNvbW1hbmQucHJvbWlzZS5yZXNvbHZlKHJlcGx5KTtcbiAgICAgICAgfSBjYXRjaCB7IC8vIFRPRE86IHVzZSBgQWdncmVnYXRlRXJyb3JgP1xuICAgICAgICAgIGNvbnN0IGJhY2tvZmYgPSB0aGlzLmJhY2tvZmYoaSk7XG4gICAgICAgICAgYXdhaXQgZGVsYXkoYmFja29mZik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29tbWFuZC5wcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuY29tbWFuZFF1ZXVlLnNoaWZ0KCk7XG4gICAgICB0aGlzLnByb2Nlc3NDb21tYW5kUXVldWUoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlzTWFudWFsbHlDbG9zZWRCeVVzZXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQ2xvc2VkICYmICF0aGlzLl9pc0Nvbm5lY3RlZDtcbiAgfVxuXG4gICNlbmFibGVIZWFsdGhDaGVja0lmTmVlZGVkKCkge1xuICAgIGNvbnN0IHsgaGVhbHRoQ2hlY2tJbnRlcnZhbCB9ID0gdGhpcy5vcHRpb25zO1xuICAgIGlmIChoZWFsdGhDaGVja0ludGVydmFsID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwaW5nID0gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNNYW51YWxseUNsb3NlZEJ5VXNlcigpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5zZW5kQ29tbWFuZChcIlBJTkdcIik7XG4gICAgICAgIHRoaXMuX2lzQ29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBUT0RPOiBub3RpZnkgdGhlIHVzZXIgb2YgYW4gZXJyb3JcbiAgICAgICAgdGhpcy5faXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHNldFRpbWVvdXQocGluZywgaGVhbHRoQ2hlY2tJbnRlcnZhbCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHNldFRpbWVvdXQocGluZywgaGVhbHRoQ2hlY2tJbnRlcnZhbCk7XG4gIH1cbn1cblxuY2xhc3MgQXV0aGVudGljYXRpb25FcnJvciBleHRlbmRzIEVycm9yIHt9XG5cbmZ1bmN0aW9uIHBhcnNlUG9ydExpa2UocG9ydDogc3RyaW5nIHwgbnVtYmVyIHwgdW5kZWZpbmVkKTogbnVtYmVyIHtcbiAgbGV0IHBhcnNlZFBvcnQ6IG51bWJlcjtcbiAgaWYgKHR5cGVvZiBwb3J0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgcGFyc2VkUG9ydCA9IHBhcnNlSW50KHBvcnQpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBwb3J0ID09PSBcIm51bWJlclwiKSB7XG4gICAgcGFyc2VkUG9ydCA9IHBvcnQ7XG4gIH0gZWxzZSB7XG4gICAgcGFyc2VkUG9ydCA9IDYzNzk7XG4gIH1cbiAgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcihwYXJzZWRQb3J0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlBvcnQgaXMgaW52YWxpZFwiKTtcbiAgfVxuICByZXR1cm4gcGFyc2VkUG9ydDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLFlBQVksbUJBQW1CLFFBQVEsaUNBQWlDO0FBSWpGLFNBQVMsa0JBQWtCLFFBQVEsZUFBZTtBQUNsRCxTQUFTLGVBQWUsRUFBRSxnQkFBZ0IsUUFBUSxjQUFjO0FBQ2hFLFNBQ0UsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixrQkFBa0IsUUFDYix3QkFBd0I7QUFD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