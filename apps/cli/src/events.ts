import { EventEmitter } from "events";
import type { SseEvent } from "@mailfail/shared";

class EventBus extends EventEmitter {
  emitSseEvent(event: SseEvent) {
    this.emit("sse", event);
  }

  onSseEvent(handler: (event: SseEvent) => void) {
    this.on("sse", handler);
    return () => {
      this.off("sse", handler);
    };
  }
}

export const bus = new EventBus();
