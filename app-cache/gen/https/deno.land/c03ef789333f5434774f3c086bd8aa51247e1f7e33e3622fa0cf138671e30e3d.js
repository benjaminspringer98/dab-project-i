import { kEmptyRedisArgs } from "./connection.ts";
import { okReply } from "./protocol/shared/types.ts";
import { create } from "./redis.ts";
import { kUnstablePipeline } from "./internal/symbols.ts";
import { deferred } from "./vendor/https/deno.land/std/async/deferred.ts";
export function createRedisPipeline(connection, tx = false) {
    const executor = new PipelineExecutor(connection, tx);
    function flush() {
        return executor.flush();
    }
    const client = create(executor);
    return Object.assign(client, {
        flush
    });
}
export class PipelineExecutor {
    connection;
    tx;
    commands;
    queue;
    constructor(connection, tx){
        this.connection = connection;
        this.tx = tx;
        this.commands = [];
        this.queue = [];
    }
    exec(command, ...args) {
        return this.sendCommand(command, args);
    }
    sendCommand(command, args, options) {
        this.commands.push({
            command,
            args: args ?? kEmptyRedisArgs,
            returnUint8Arrays: options?.returnUint8Arrays
        });
        return Promise.resolve(okReply);
    }
    close() {
        return this.connection.close();
    }
    flush() {
        if (this.tx) {
            this.commands.unshift({
                command: "MULTI",
                args: []
            });
            this.commands.push({
                command: "EXEC",
                args: []
            });
        }
        const d = deferred();
        this.queue.push({
            commands: [
                ...this.commands
            ],
            d
        });
        if (this.queue.length === 1) {
            this.dequeue();
        }
        this.commands = [];
        return d;
    }
    dequeue() {
        const [e] = this.queue;
        if (!e) return;
        this.connection[kUnstablePipeline](e.commands).then(e.d.resolve).catch(e.d.reject).finally(()=>{
            this.queue.shift();
            this.dequeue();
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMzIuMC9waXBlbGluZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvbm5lY3Rpb24sIFNlbmRDb21tYW5kT3B0aW9ucyB9IGZyb20gXCIuL2Nvbm5lY3Rpb24udHNcIjtcbmltcG9ydCB7IGtFbXB0eVJlZGlzQXJncyB9IGZyb20gXCIuL2Nvbm5lY3Rpb24udHNcIjtcbmltcG9ydCB7IENvbW1hbmRFeGVjdXRvciB9IGZyb20gXCIuL2V4ZWN1dG9yLnRzXCI7XG5pbXBvcnQge1xuICBva1JlcGx5LFxuICBSYXdPckVycm9yLFxuICBSZWRpc1JlcGx5LFxuICBSZWRpc1ZhbHVlLFxufSBmcm9tIFwiLi9wcm90b2NvbC9zaGFyZWQvdHlwZXMudHNcIjtcbmltcG9ydCB7IGNyZWF0ZSwgUmVkaXMgfSBmcm9tIFwiLi9yZWRpcy50c1wiO1xuaW1wb3J0IHsga1Vuc3RhYmxlUGlwZWxpbmUgfSBmcm9tIFwiLi9pbnRlcm5hbC9zeW1ib2xzLnRzXCI7XG5pbXBvcnQge1xuICBEZWZlcnJlZCxcbiAgZGVmZXJyZWQsXG59IGZyb20gXCIuL3ZlbmRvci9odHRwcy9kZW5vLmxhbmQvc3RkL2FzeW5jL2RlZmVycmVkLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVkaXNQaXBlbGluZSBleHRlbmRzIFJlZGlzIHtcbiAgZmx1c2goKTogUHJvbWlzZTxSYXdPckVycm9yW10+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmVkaXNQaXBlbGluZShcbiAgY29ubmVjdGlvbjogQ29ubmVjdGlvbixcbiAgdHggPSBmYWxzZSxcbik6IFJlZGlzUGlwZWxpbmUge1xuICBjb25zdCBleGVjdXRvciA9IG5ldyBQaXBlbGluZUV4ZWN1dG9yKGNvbm5lY3Rpb24sIHR4KTtcbiAgZnVuY3Rpb24gZmx1c2goKTogUHJvbWlzZTxSYXdPckVycm9yW10+IHtcbiAgICByZXR1cm4gZXhlY3V0b3IuZmx1c2goKTtcbiAgfVxuICBjb25zdCBjbGllbnQgPSBjcmVhdGUoZXhlY3V0b3IpO1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihjbGllbnQsIHsgZmx1c2ggfSk7XG59XG5cbmV4cG9ydCBjbGFzcyBQaXBlbGluZUV4ZWN1dG9yIGltcGxlbWVudHMgQ29tbWFuZEV4ZWN1dG9yIHtcbiAgcHJpdmF0ZSBjb21tYW5kczoge1xuICAgIGNvbW1hbmQ6IHN0cmluZztcbiAgICBhcmdzOiBSZWRpc1ZhbHVlW107XG4gICAgcmV0dXJuVWludDhBcnJheXM/OiBib29sZWFuO1xuICB9W10gPSBbXTtcbiAgcHJpdmF0ZSBxdWV1ZToge1xuICAgIGNvbW1hbmRzOiB7XG4gICAgICBjb21tYW5kOiBzdHJpbmc7XG4gICAgICBhcmdzOiBSZWRpc1ZhbHVlW107XG4gICAgICByZXR1cm5VaW50OEFycmF5cz86IGJvb2xlYW47XG4gICAgfVtdO1xuICAgIGQ6IERlZmVycmVkPHVua25vd25bXT47XG4gIH1bXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHJlYWRvbmx5IGNvbm5lY3Rpb246IENvbm5lY3Rpb24sXG4gICAgcHJpdmF0ZSB0eDogYm9vbGVhbixcbiAgKSB7XG4gIH1cblxuICBleGVjKFxuICAgIGNvbW1hbmQ6IHN0cmluZyxcbiAgICAuLi5hcmdzOiBSZWRpc1ZhbHVlW11cbiAgKTogUHJvbWlzZTxSZWRpc1JlcGx5PiB7XG4gICAgcmV0dXJuIHRoaXMuc2VuZENvbW1hbmQoY29tbWFuZCwgYXJncyk7XG4gIH1cblxuICBzZW5kQ29tbWFuZChcbiAgICBjb21tYW5kOiBzdHJpbmcsXG4gICAgYXJncz86IFJlZGlzVmFsdWVbXSxcbiAgICBvcHRpb25zPzogU2VuZENvbW1hbmRPcHRpb25zLFxuICApOiBQcm9taXNlPFJlZGlzUmVwbHk+IHtcbiAgICB0aGlzLmNvbW1hbmRzLnB1c2goe1xuICAgICAgY29tbWFuZCxcbiAgICAgIGFyZ3M6IGFyZ3MgPz8ga0VtcHR5UmVkaXNBcmdzLFxuICAgICAgcmV0dXJuVWludDhBcnJheXM6IG9wdGlvbnM/LnJldHVyblVpbnQ4QXJyYXlzLFxuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUob2tSZXBseSk7XG4gIH1cblxuICBjbG9zZSgpOiB2b2lkIHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLmNsb3NlKCk7XG4gIH1cblxuICBmbHVzaCgpOiBQcm9taXNlPFJhd09yRXJyb3JbXT4ge1xuICAgIGlmICh0aGlzLnR4KSB7XG4gICAgICB0aGlzLmNvbW1hbmRzLnVuc2hpZnQoeyBjb21tYW5kOiBcIk1VTFRJXCIsIGFyZ3M6IFtdIH0pO1xuICAgICAgdGhpcy5jb21tYW5kcy5wdXNoKHsgY29tbWFuZDogXCJFWEVDXCIsIGFyZ3M6IFtdIH0pO1xuICAgIH1cbiAgICBjb25zdCBkID0gZGVmZXJyZWQ8UmF3T3JFcnJvcltdPigpO1xuICAgIHRoaXMucXVldWUucHVzaCh7IGNvbW1hbmRzOiBbLi4udGhpcy5jb21tYW5kc10sIGQgfSk7XG4gICAgaWYgKHRoaXMucXVldWUubGVuZ3RoID09PSAxKSB7XG4gICAgICB0aGlzLmRlcXVldWUoKTtcbiAgICB9XG4gICAgdGhpcy5jb21tYW5kcyA9IFtdO1xuICAgIHJldHVybiBkO1xuICB9XG5cbiAgcHJpdmF0ZSBkZXF1ZXVlKCk6IHZvaWQge1xuICAgIGNvbnN0IFtlXSA9IHRoaXMucXVldWU7XG4gICAgaWYgKCFlKSByZXR1cm47XG4gICAgdGhpcy5jb25uZWN0aW9uW2tVbnN0YWJsZVBpcGVsaW5lXShlLmNvbW1hbmRzKVxuICAgICAgLnRoZW4oZS5kLnJlc29sdmUpXG4gICAgICAuY2F0Y2goZS5kLnJlamVjdClcbiAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgdGhpcy5xdWV1ZS5zaGlmdCgpO1xuICAgICAgICB0aGlzLmRlcXVldWUoKTtcbiAgICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxlQUFlLFFBQVEsa0JBQWtCO0FBRWxELFNBQ0UsT0FBTyxRQUlGLDZCQUE2QjtBQUNwQyxTQUFTLE1BQU0sUUFBZSxhQUFhO0FBQzNDLFNBQVMsaUJBQWlCLFFBQVEsd0JBQXdCO0FBQzFELFNBRUUsUUFBUSxRQUNILGlEQUFpRDtBQU14RCxPQUFPLFNBQVMsb0JBQ2QsVUFBc0IsRUFDdEIsS0FBSyxLQUFLLEVBQ0s7SUFDZixNQUFNLFdBQVcsSUFBSSxpQkFBaUIsWUFBWTtJQUNsRCxTQUFTLFFBQStCO1FBQ3RDLE9BQU8sU0FBUyxLQUFLO0lBQ3ZCO0lBQ0EsTUFBTSxTQUFTLE9BQU87SUFDdEIsT0FBTyxPQUFPLE1BQU0sQ0FBQyxRQUFRO1FBQUU7SUFBTTtBQUN2QyxDQUFDO0FBRUQsT0FBTyxNQUFNO0lBZ0JBO0lBQ0Q7SUFoQkYsU0FJQztJQUNELE1BT0M7SUFFVCxZQUNXLFlBQ0QsR0FDUjswQkFGUztrQkFDRDthQWhCRixXQUlGLEVBQUU7YUFDQSxRQU9GLEVBQUU7SUFNUjtJQUVBLEtBQ0UsT0FBZSxFQUNmLEdBQUcsSUFBa0IsRUFDQTtRQUNyQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUztJQUNuQztJQUVBLFlBQ0UsT0FBZSxFQUNmLElBQW1CLEVBQ25CLE9BQTRCLEVBQ1A7UUFDckIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDakI7WUFDQSxNQUFNLFFBQVE7WUFDZCxtQkFBbUIsU0FBUztRQUM5QjtRQUNBLE9BQU8sUUFBUSxPQUFPLENBQUM7SUFDekI7SUFFQSxRQUFjO1FBQ1osT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUs7SUFDOUI7SUFFQSxRQUErQjtRQUM3QixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDWCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztnQkFBRSxTQUFTO2dCQUFTLE1BQU0sRUFBRTtZQUFDO1lBQ25ELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUFFLFNBQVM7Z0JBQVEsTUFBTSxFQUFFO1lBQUM7UUFDakQsQ0FBQztRQUNELE1BQU0sSUFBSTtRQUNWLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQUUsVUFBVTttQkFBSSxJQUFJLENBQUMsUUFBUTthQUFDO1lBQUU7UUFBRTtRQUNsRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLEdBQUc7WUFDM0IsSUFBSSxDQUFDLE9BQU87UUFDZCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFO1FBQ2xCLE9BQU87SUFDVDtJQUVRLFVBQWdCO1FBQ3RCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUs7UUFDdEIsSUFBSSxDQUFDLEdBQUc7UUFDUixJQUFJLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsUUFBUSxFQUMxQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUNoQixLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUNoQixPQUFPLENBQUMsSUFBTTtZQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSztZQUNoQixJQUFJLENBQUMsT0FBTztRQUNkO0lBQ0o7QUFDRixDQUFDIn0=