import { Injectable } from "@nestjs/common";

export interface QueueItem<T = unknown> {
  id: number;
  type: string;
  payload: T;
}

@Injectable()
export class QueueService {
  private counter = 0;
  private readonly items: QueueItem[] = [];

  enqueue<T>(type: string, payload: T): QueueItem<T> {
    const item: QueueItem<T> = { id: ++this.counter, type, payload };
    this.items.push(item);
    return item;
  }

  dequeue<T>(): QueueItem<T> | undefined {
    return this.items.shift() as QueueItem<T> | undefined;
  }
}
