import pino from "pino";
import { createStream } from "rotating-file-stream";
import { join } from "path";

const streams = [];

if (process.env.NODE_ENV === "production") {
    const errorStream = createStream("error.log", {
        path: join(process.cwd(), "logs"),
        interval: "1d",
        maxFiles: 30,
    });

    const combinedStream = createStream("combined.log", {
        path: join(process.cwd(), "logs"),
        interval: "1d",
        maxFiles: 15,
    });

    streams.push(
        { level: "error", stream: errorStream },
        { level: "info", stream: combinedStream }
    );
} else {
    streams.push({
        level: "debug",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        stream: pino.transport({
            target: "pino-pretty",
            options: { colorize: true },
        }),
    });
}

export const logger = pino(
    { level: process.env.NODE_ENV === "production" ? "info" : "debug" },
    pino.multistream(streams)
);
