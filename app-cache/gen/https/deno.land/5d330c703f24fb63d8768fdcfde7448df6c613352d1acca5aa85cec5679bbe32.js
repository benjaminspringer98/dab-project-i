import { BufReader } from "../../vendor/https/deno.land/std/io/buf_reader.ts";
import { BufWriter } from "../../vendor/https/deno.land/std/io/buf_writer.ts";
import { readReply } from "./reply.ts";
import { sendCommand, sendCommands } from "./command.ts";
export class Protocol {
    #reader;
    #writer;
    constructor(conn){
        this.#reader = new BufReader(conn);
        this.#writer = new BufWriter(conn);
    }
    sendCommand(command, args, returnsUint8Arrays) {
        return sendCommand(this.#writer, this.#reader, command, args, returnsUint8Arrays);
    }
    readReply(returnsUint8Arrays) {
        return readReply(this.#reader, returnsUint8Arrays);
    }
    pipeline(commands) {
        return sendCommands(this.#writer, this.#reader, commands);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMzIuMC9wcm90b2NvbC9kZW5vX3N0cmVhbXMvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJ1ZlJlYWRlciB9IGZyb20gXCIuLi8uLi92ZW5kb3IvaHR0cHMvZGVuby5sYW5kL3N0ZC9pby9idWZfcmVhZGVyLnRzXCI7XG5pbXBvcnQgeyBCdWZXcml0ZXIgfSBmcm9tIFwiLi4vLi4vdmVuZG9yL2h0dHBzL2Rlbm8ubGFuZC9zdGQvaW8vYnVmX3dyaXRlci50c1wiO1xuaW1wb3J0IHsgcmVhZFJlcGx5IH0gZnJvbSBcIi4vcmVwbHkudHNcIjtcbmltcG9ydCB7IHNlbmRDb21tYW5kLCBzZW5kQ29tbWFuZHMgfSBmcm9tIFwiLi9jb21tYW5kLnRzXCI7XG5cbmltcG9ydCB0eXBlIHsgQ29tbWFuZCwgUHJvdG9jb2wgYXMgQmFzZVByb3RvY29sIH0gZnJvbSBcIi4uL3NoYXJlZC9wcm90b2NvbC50c1wiO1xuaW1wb3J0IHsgUmVkaXNSZXBseSwgUmVkaXNWYWx1ZSB9IGZyb20gXCIuLi9zaGFyZWQvdHlwZXMudHNcIjtcbmltcG9ydCB7IEVycm9yUmVwbHlFcnJvciB9IGZyb20gXCIuLi8uLi9lcnJvcnMudHNcIjtcblxuZXhwb3J0IGNsYXNzIFByb3RvY29sIGltcGxlbWVudHMgQmFzZVByb3RvY29sIHtcbiAgI3JlYWRlcjogQnVmUmVhZGVyO1xuICAjd3JpdGVyOiBCdWZXcml0ZXI7XG5cbiAgY29uc3RydWN0b3IoY29ubjogRGVuby5Db25uKSB7XG4gICAgdGhpcy4jcmVhZGVyID0gbmV3IEJ1ZlJlYWRlcihjb25uKTtcbiAgICB0aGlzLiN3cml0ZXIgPSBuZXcgQnVmV3JpdGVyKGNvbm4pO1xuICB9XG5cbiAgc2VuZENvbW1hbmQoXG4gICAgY29tbWFuZDogc3RyaW5nLFxuICAgIGFyZ3M6IFJlZGlzVmFsdWVbXSxcbiAgICByZXR1cm5zVWludDhBcnJheXM/OiBib29sZWFuIHwgdW5kZWZpbmVkLFxuICApOiBQcm9taXNlPFJlZGlzUmVwbHk+IHtcbiAgICByZXR1cm4gc2VuZENvbW1hbmQoXG4gICAgICB0aGlzLiN3cml0ZXIsXG4gICAgICB0aGlzLiNyZWFkZXIsXG4gICAgICBjb21tYW5kLFxuICAgICAgYXJncyxcbiAgICAgIHJldHVybnNVaW50OEFycmF5cyxcbiAgICApO1xuICB9XG5cbiAgcmVhZFJlcGx5KHJldHVybnNVaW50OEFycmF5cz86IGJvb2xlYW4pOiBQcm9taXNlPFJlZGlzUmVwbHk+IHtcbiAgICByZXR1cm4gcmVhZFJlcGx5KHRoaXMuI3JlYWRlciwgcmV0dXJuc1VpbnQ4QXJyYXlzKTtcbiAgfVxuXG4gIHBpcGVsaW5lKGNvbW1hbmRzOiBDb21tYW5kW10pOiBQcm9taXNlPEFycmF5PFJlZGlzUmVwbHkgfCBFcnJvclJlcGx5RXJyb3I+PiB7XG4gICAgcmV0dXJuIHNlbmRDb21tYW5kcyh0aGlzLiN3cml0ZXIsIHRoaXMuI3JlYWRlciwgY29tbWFuZHMpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxTQUFTLFFBQVEsb0RBQW9EO0FBQzlFLFNBQVMsU0FBUyxRQUFRLG9EQUFvRDtBQUM5RSxTQUFTLFNBQVMsUUFBUSxhQUFhO0FBQ3ZDLFNBQVMsV0FBVyxFQUFFLFlBQVksUUFBUSxlQUFlO0FBTXpELE9BQU8sTUFBTTtJQUNYLENBQUMsTUFBTSxDQUFZO0lBQ25CLENBQUMsTUFBTSxDQUFZO0lBRW5CLFlBQVksSUFBZSxDQUFFO1FBQzNCLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxJQUFJLFVBQVU7UUFDN0IsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksVUFBVTtJQUMvQjtJQUVBLFlBQ0UsT0FBZSxFQUNmLElBQWtCLEVBQ2xCLGtCQUF3QyxFQUNuQjtRQUNyQixPQUFPLFlBQ0wsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUNaLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFDWixTQUNBLE1BQ0E7SUFFSjtJQUVBLFVBQVUsa0JBQTRCLEVBQXVCO1FBQzNELE9BQU8sVUFBVSxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUU7SUFDakM7SUFFQSxTQUFTLFFBQW1CLEVBQWdEO1FBQzFFLE9BQU8sYUFBYSxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFO0lBQ2xEO0FBQ0YsQ0FBQyJ9