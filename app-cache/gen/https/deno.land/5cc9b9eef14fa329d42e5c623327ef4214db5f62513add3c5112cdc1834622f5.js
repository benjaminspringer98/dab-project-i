export class DefaultExecutor {
    connection;
    constructor(connection){
        this.connection = connection;
    }
    exec(command, ...args) {
        return this.connection.sendCommand(command, args);
    }
    sendCommand(command, args, options) {
        return this.connection.sendCommand(command, args, options);
    }
    close() {
        this.connection.close();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcmVkaXNAdjAuMzIuMC9leGVjdXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvbm5lY3Rpb24sIFNlbmRDb21tYW5kT3B0aW9ucyB9IGZyb20gXCIuL2Nvbm5lY3Rpb24udHNcIjtcbmltcG9ydCB0eXBlIHsgUmVkaXNSZXBseSwgUmVkaXNWYWx1ZSB9IGZyb20gXCIuL3Byb3RvY29sL3NoYXJlZC90eXBlcy50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbW1hbmRFeGVjdXRvciB7XG4gIHJlYWRvbmx5IGNvbm5lY3Rpb246IENvbm5lY3Rpb247XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZFxuICAgKi9cbiAgZXhlYyhcbiAgICBjb21tYW5kOiBzdHJpbmcsXG4gICAgLi4uYXJnczogUmVkaXNWYWx1ZVtdXG4gICk6IFByb21pc2U8UmVkaXNSZXBseT47XG5cbiAgc2VuZENvbW1hbmQoXG4gICAgY29tbWFuZDogc3RyaW5nLFxuICAgIGFyZ3M/OiBSZWRpc1ZhbHVlW10sXG4gICAgb3B0aW9ucz86IFNlbmRDb21tYW5kT3B0aW9ucyxcbiAgKTogUHJvbWlzZTxSZWRpc1JlcGx5PjtcblxuICAvKipcbiAgICogQ2xvc2VzIGEgcmVkaXMgY29ubmVjdGlvbi5cbiAgICovXG4gIGNsb3NlKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBEZWZhdWx0RXhlY3V0b3IgaW1wbGVtZW50cyBDb21tYW5kRXhlY3V0b3Ige1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7fVxuXG4gIGV4ZWMoXG4gICAgY29tbWFuZDogc3RyaW5nLFxuICAgIC4uLmFyZ3M6IFJlZGlzVmFsdWVbXVxuICApOiBQcm9taXNlPFJlZGlzUmVwbHk+IHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnNlbmRDb21tYW5kKGNvbW1hbmQsIGFyZ3MpO1xuICB9XG5cbiAgc2VuZENvbW1hbmQoXG4gICAgY29tbWFuZDogc3RyaW5nLFxuICAgIGFyZ3M/OiBSZWRpc1ZhbHVlW10sXG4gICAgb3B0aW9ucz86IFNlbmRDb21tYW5kT3B0aW9ucyxcbiAgKSB7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5zZW5kQ29tbWFuZChjb21tYW5kLCBhcmdzLCBvcHRpb25zKTtcbiAgfVxuXG4gIGNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29ubmVjdGlvbi5jbG9zZSgpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBeUJBLE9BQU8sTUFBTTtJQUNVO0lBQXJCLFlBQXFCLFdBQXdCOzBCQUF4QjtJQUF5QjtJQUU5QyxLQUNFLE9BQWUsRUFDZixHQUFHLElBQWtCLEVBQ0E7UUFDckIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxTQUFTO0lBQzlDO0lBRUEsWUFDRSxPQUFlLEVBQ2YsSUFBbUIsRUFDbkIsT0FBNEIsRUFDNUI7UUFDQSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLFNBQVMsTUFBTTtJQUNwRDtJQUVBLFFBQWM7UUFDWixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUs7SUFDdkI7QUFDRixDQUFDIn0=