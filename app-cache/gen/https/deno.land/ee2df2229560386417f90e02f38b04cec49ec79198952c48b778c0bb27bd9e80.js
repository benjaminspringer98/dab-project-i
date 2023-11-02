import { isRetriableError } from "./errors.ts";
import { decoder } from "./internal/encoding.ts";
import { kUnstableReadReply } from "./internal/symbols.ts";
class RedisSubscriptionImpl {
    executor;
    get isConnected() {
        return this.executor.connection.isConnected;
    }
    get isClosed() {
        return this.executor.connection.isClosed;
    }
    channels;
    patterns;
    constructor(executor){
        this.executor = executor;
        this.channels = Object.create(null);
        this.patterns = Object.create(null);
    }
    async psubscribe(...patterns) {
        await this.executor.exec("PSUBSCRIBE", ...patterns);
        for (const pat of patterns){
            this.patterns[pat] = true;
        }
    }
    async punsubscribe(...patterns) {
        await this.executor.exec("PUNSUBSCRIBE", ...patterns);
        for (const pat of patterns){
            delete this.patterns[pat];
        }
    }
    async subscribe(...channels) {
        await this.executor.exec("SUBSCRIBE", ...channels);
        for (const chan of channels){
            this.channels[chan] = true;
        }
    }
    async unsubscribe(...channels) {
        await this.executor.exec("UNSUBSCRIBE", ...channels);
        for (const chan of channels){
            delete this.channels[chan];
        }
    }
    receive() {
        return this.#receive(false);
    }
    receiveBuffers() {
        return this.#receive(true);
    }
    async *#receive(binaryMode) {
        let forceReconnect = false;
        const connection = this.executor.connection;
        while(this.isConnected){
            try {
                let rep;
                try {
                    rep = await connection[kUnstableReadReply](binaryMode);
                } catch (err) {
                    if (this.isClosed) {
                        break;
                    }
                    throw err; // Connection may have been unintentionally closed.
                }
                const event = rep[0] instanceof Uint8Array ? decoder.decode(rep[0]) : rep[0];
                if (event === "message" && rep.length === 3) {
                    const channel = rep[1] instanceof Uint8Array ? decoder.decode(rep[1]) : rep[1];
                    const message = rep[2];
                    yield {
                        channel,
                        message
                    };
                } else if (event === "pmessage" && rep.length === 4) {
                    const pattern = rep[1] instanceof Uint8Array ? decoder.decode(rep[1]) : rep[1];
                    const channel = rep[2] instanceof Uint8Array ? decoder.decode(rep[2]) : rep[2];
                    const message = rep[3];
                    yield {
                        pattern,
                        channel,
                        message
                    };
                }
            } catch (error) {
                if (isRetriableError(error)) {
                    forceReconnect = true;
                } else throw error;
            } finally{
                if (!this.isClosed && !this.isConnected || forceReconnect) {
                    forceReconnect = false;
                    await connection.reconnect();
                    if (Object.keys(this.channels).length > 0) {
                        await this.subscribe(...Object.keys(this.channels));
                    }
                    if (Object.keys(this.patterns).length > 0) {
                        await this.psubscribe(...Object.keys(this.patterns));
                    }
                }
            }
        }
    }
    close() {
        this.executor.connection.close();
    }
}
export async function subscribe(executor, ...channels) {
    const sub = new RedisSubscriptionImpl(executor);
    await sub.subscribe(...channels);
    return sub;
}
export async function psubscribe(executor, ...patterns) {
    const sub = new RedisSubscriptionImpl(executor);
    await sub.psubscribe(...patterns);
    return sub;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMzIuMC9wdWJzdWIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBDb21tYW5kRXhlY3V0b3IgfSBmcm9tIFwiLi9leGVjdXRvci50c1wiO1xuaW1wb3J0IHsgaXNSZXRyaWFibGVFcnJvciB9IGZyb20gXCIuL2Vycm9ycy50c1wiO1xuaW1wb3J0IHR5cGUgeyBCaW5hcnkgfSBmcm9tIFwiLi9wcm90b2NvbC9zaGFyZWQvdHlwZXMudHNcIjtcbmltcG9ydCB7IGRlY29kZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9lbmNvZGluZy50c1wiO1xuaW1wb3J0IHsga1Vuc3RhYmxlUmVhZFJlcGx5IH0gZnJvbSBcIi4vaW50ZXJuYWwvc3ltYm9scy50c1wiO1xuXG50eXBlIERlZmF1bHRNZXNzYWdlVHlwZSA9IHN0cmluZztcbnR5cGUgVmFsaWRNZXNzYWdlVHlwZSA9IHN0cmluZyB8IHN0cmluZ1tdO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlZGlzU3Vic2NyaXB0aW9uPFxuICBUTWVzc2FnZSBleHRlbmRzIFZhbGlkTWVzc2FnZVR5cGUgPSBEZWZhdWx0TWVzc2FnZVR5cGUsXG4+IHtcbiAgcmVhZG9ubHkgaXNDbG9zZWQ6IGJvb2xlYW47XG4gIHJlY2VpdmUoKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFJlZGlzUHViU3ViTWVzc2FnZTxUTWVzc2FnZT4+O1xuICByZWNlaXZlQnVmZmVycygpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8UmVkaXNQdWJTdWJNZXNzYWdlPEJpbmFyeT4+O1xuICBwc3Vic2NyaWJlKC4uLnBhdHRlcm5zOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD47XG4gIHN1YnNjcmliZSguLi5jaGFubmVsczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+O1xuICBwdW5zdWJzY3JpYmUoLi4ucGF0dGVybnM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPjtcbiAgdW5zdWJzY3JpYmUoLi4uY2hhbm5lbHM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPjtcbiAgY2xvc2UoKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWRpc1B1YlN1Yk1lc3NhZ2U8VE1lc3NhZ2UgPSBEZWZhdWx0TWVzc2FnZVR5cGU+IHtcbiAgcGF0dGVybj86IHN0cmluZztcbiAgY2hhbm5lbDogc3RyaW5nO1xuICBtZXNzYWdlOiBUTWVzc2FnZTtcbn1cblxuY2xhc3MgUmVkaXNTdWJzY3JpcHRpb25JbXBsPFxuICBUTWVzc2FnZSBleHRlbmRzIFZhbGlkTWVzc2FnZVR5cGUgPSBEZWZhdWx0TWVzc2FnZVR5cGUsXG4+IGltcGxlbWVudHMgUmVkaXNTdWJzY3JpcHRpb248VE1lc3NhZ2U+IHtcbiAgZ2V0IGlzQ29ubmVjdGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmV4ZWN1dG9yLmNvbm5lY3Rpb24uaXNDb25uZWN0ZWQ7XG4gIH1cblxuICBnZXQgaXNDbG9zZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZXhlY3V0b3IuY29ubmVjdGlvbi5pc0Nsb3NlZDtcbiAgfVxuXG4gIHByaXZhdGUgY2hhbm5lbHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBwcml2YXRlIHBhdHRlcm5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4ZWN1dG9yOiBDb21tYW5kRXhlY3V0b3IpIHt9XG5cbiAgYXN5bmMgcHN1YnNjcmliZSguLi5wYXR0ZXJuczogc3RyaW5nW10pIHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dG9yLmV4ZWMoXCJQU1VCU0NSSUJFXCIsIC4uLnBhdHRlcm5zKTtcbiAgICBmb3IgKGNvbnN0IHBhdCBvZiBwYXR0ZXJucykge1xuICAgICAgdGhpcy5wYXR0ZXJuc1twYXRdID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBwdW5zdWJzY3JpYmUoLi4ucGF0dGVybnM6IHN0cmluZ1tdKSB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRvci5leGVjKFwiUFVOU1VCU0NSSUJFXCIsIC4uLnBhdHRlcm5zKTtcbiAgICBmb3IgKGNvbnN0IHBhdCBvZiBwYXR0ZXJucykge1xuICAgICAgZGVsZXRlIHRoaXMucGF0dGVybnNbcGF0XTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzdWJzY3JpYmUoLi4uY2hhbm5lbHM6IHN0cmluZ1tdKSB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRvci5leGVjKFwiU1VCU0NSSUJFXCIsIC4uLmNoYW5uZWxzKTtcbiAgICBmb3IgKGNvbnN0IGNoYW4gb2YgY2hhbm5lbHMpIHtcbiAgICAgIHRoaXMuY2hhbm5lbHNbY2hhbl0gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHVuc3Vic2NyaWJlKC4uLmNoYW5uZWxzOiBzdHJpbmdbXSkge1xuICAgIGF3YWl0IHRoaXMuZXhlY3V0b3IuZXhlYyhcIlVOU1VCU0NSSUJFXCIsIC4uLmNoYW5uZWxzKTtcbiAgICBmb3IgKGNvbnN0IGNoYW4gb2YgY2hhbm5lbHMpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLmNoYW5uZWxzW2NoYW5dO1xuICAgIH1cbiAgfVxuXG4gIHJlY2VpdmUoKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFJlZGlzUHViU3ViTWVzc2FnZTxUTWVzc2FnZT4+IHtcbiAgICByZXR1cm4gdGhpcy4jcmVjZWl2ZShmYWxzZSk7XG4gIH1cblxuICByZWNlaXZlQnVmZmVycygpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8UmVkaXNQdWJTdWJNZXNzYWdlPEJpbmFyeT4+IHtcbiAgICByZXR1cm4gdGhpcy4jcmVjZWl2ZSh0cnVlKTtcbiAgfVxuXG4gIGFzeW5jICojcmVjZWl2ZTxcbiAgICBUID0gVE1lc3NhZ2UsXG4gID4oXG4gICAgYmluYXJ5TW9kZTogYm9vbGVhbixcbiAgKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFxuICAgIFJlZGlzUHViU3ViTWVzc2FnZTxUPlxuICA+IHtcbiAgICBsZXQgZm9yY2VSZWNvbm5lY3QgPSBmYWxzZTtcbiAgICBjb25zdCBjb25uZWN0aW9uID0gdGhpcy5leGVjdXRvci5jb25uZWN0aW9uO1xuICAgIHdoaWxlICh0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVwOiBbc3RyaW5nIHwgQmluYXJ5LCBzdHJpbmcgfCBCaW5hcnksIFRdIHwgW1xuICAgICAgICAgIHN0cmluZyB8IEJpbmFyeSxcbiAgICAgICAgICBzdHJpbmcgfCBCaW5hcnksXG4gICAgICAgICAgc3RyaW5nIHwgQmluYXJ5LFxuICAgICAgICAgIFQsXG4gICAgICAgIF07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVwID0gYXdhaXQgY29ubmVjdGlvbltrVW5zdGFibGVSZWFkUmVwbHldKGJpbmFyeU1vZGUpIGFzIHR5cGVvZiByZXA7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGlmICh0aGlzLmlzQ2xvc2VkKSB7XG4gICAgICAgICAgICAvLyBDb25uZWN0aW9uIGFscmVhZHkgY2xvc2VkIGJ5IHRoZSB1c2VyLlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRocm93IGVycjsgLy8gQ29ubmVjdGlvbiBtYXkgaGF2ZSBiZWVuIHVuaW50ZW50aW9uYWxseSBjbG9zZWQuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBldmVudCA9IHJlcFswXSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXlcbiAgICAgICAgICA/IGRlY29kZXIuZGVjb2RlKHJlcFswXSlcbiAgICAgICAgICA6IHJlcFswXTtcblxuICAgICAgICBpZiAoZXZlbnQgPT09IFwibWVzc2FnZVwiICYmIHJlcC5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICBjb25zdCBjaGFubmVsID0gcmVwWzFdIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgICAgICAgICAgPyBkZWNvZGVyLmRlY29kZShyZXBbMV0pXG4gICAgICAgICAgICA6IHJlcFsxXTtcbiAgICAgICAgICBjb25zdCBtZXNzYWdlID0gcmVwWzJdO1xuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIGNoYW5uZWwsXG4gICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQgPT09IFwicG1lc3NhZ2VcIiAmJiByZXAubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgY29uc3QgcGF0dGVybiA9IHJlcFsxXSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXlcbiAgICAgICAgICAgID8gZGVjb2Rlci5kZWNvZGUocmVwWzFdKVxuICAgICAgICAgICAgOiByZXBbMV07XG4gICAgICAgICAgY29uc3QgY2hhbm5lbCA9IHJlcFsyXSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXlcbiAgICAgICAgICAgID8gZGVjb2Rlci5kZWNvZGUocmVwWzJdKVxuICAgICAgICAgICAgOiByZXBbMl07XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9IHJlcFszXTtcbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICBwYXR0ZXJuLFxuICAgICAgICAgICAgY2hhbm5lbCxcbiAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgaWYgKGlzUmV0cmlhYmxlRXJyb3IoZXJyb3IpKSB7XG4gICAgICAgICAgZm9yY2VSZWNvbm5lY3QgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgdGhyb3cgZXJyb3I7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBpZiAoKCF0aGlzLmlzQ2xvc2VkICYmICF0aGlzLmlzQ29ubmVjdGVkKSB8fCBmb3JjZVJlY29ubmVjdCkge1xuICAgICAgICAgIGZvcmNlUmVjb25uZWN0ID0gZmFsc2U7XG4gICAgICAgICAgYXdhaXQgY29ubmVjdGlvbi5yZWNvbm5lY3QoKTtcblxuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLmNoYW5uZWxzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN1YnNjcmliZSguLi5PYmplY3Qua2V5cyh0aGlzLmNoYW5uZWxzKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLnBhdHRlcm5zKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBzdWJzY3JpYmUoLi4uT2JqZWN0LmtleXModGhpcy5wYXR0ZXJucykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNsb3NlKCkge1xuICAgIHRoaXMuZXhlY3V0b3IuY29ubmVjdGlvbi5jbG9zZSgpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdWJzY3JpYmU8XG4gIFRNZXNzYWdlIGV4dGVuZHMgVmFsaWRNZXNzYWdlVHlwZSA9IERlZmF1bHRNZXNzYWdlVHlwZSxcbj4oXG4gIGV4ZWN1dG9yOiBDb21tYW5kRXhlY3V0b3IsXG4gIC4uLmNoYW5uZWxzOiBzdHJpbmdbXVxuKTogUHJvbWlzZTxSZWRpc1N1YnNjcmlwdGlvbjxUTWVzc2FnZT4+IHtcbiAgY29uc3Qgc3ViID0gbmV3IFJlZGlzU3Vic2NyaXB0aW9uSW1wbDxUTWVzc2FnZT4oZXhlY3V0b3IpO1xuICBhd2FpdCBzdWIuc3Vic2NyaWJlKC4uLmNoYW5uZWxzKTtcbiAgcmV0dXJuIHN1Yjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBzdWJzY3JpYmU8XG4gIFRNZXNzYWdlIGV4dGVuZHMgVmFsaWRNZXNzYWdlVHlwZSA9IERlZmF1bHRNZXNzYWdlVHlwZSxcbj4oXG4gIGV4ZWN1dG9yOiBDb21tYW5kRXhlY3V0b3IsXG4gIC4uLnBhdHRlcm5zOiBzdHJpbmdbXVxuKTogUHJvbWlzZTxSZWRpc1N1YnNjcmlwdGlvbjxUTWVzc2FnZT4+IHtcbiAgY29uc3Qgc3ViID0gbmV3IFJlZGlzU3Vic2NyaXB0aW9uSW1wbDxUTWVzc2FnZT4oZXhlY3V0b3IpO1xuICBhd2FpdCBzdWIucHN1YnNjcmliZSguLi5w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