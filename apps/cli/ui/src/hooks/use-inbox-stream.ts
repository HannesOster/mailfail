import { useEffect, useState } from "react";

export function useInboxStream(inboxId: string) {
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const es = new EventSource(`/api/inboxes/${inboxId}/stream`);
    es.onmessage = () => setTrigger((prev) => prev + 1);
    es.onerror = () => es.close();
    return () => es.close();
  }, [inboxId]);

  return trigger;
}
