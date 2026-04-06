import { useEffect, useState } from "react";

export function useEmailStream() {
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = () => setTrigger((prev) => prev + 1);
    es.onerror = () => es.close();
    return () => es.close();
  }, []);

  return trigger;
}
