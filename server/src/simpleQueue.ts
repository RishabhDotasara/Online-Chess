import { Job } from "./types";

class SimpleQueue {
  queue: Job[];
  queueName: string;
  isProcessing: boolean;
  processingFunction: (job:Job)=>Promise<void>

  constructor(queueName: string, processingFunction:(job:Job)=>Promise<void>) {
    this.queue = [];
    this.queueName = queueName;
    this.isProcessing = false;
    this.processingFunction = processingFunction;
  }

  async add(job:{[key:string]:string}) {
    this.queue.push(
        {
            jobId:this.queue.length,
            job:job
        }
    );
    if (!this.isProcessing) {
      this.#process();
    }
  }

  async remove(jobId: number) {
    return (this.queue = this.queue.filter((job: Job) => job.jobId != jobId));
  }

  async pop() {
    const job: Job = this.queue[0];
    await this.remove(this.queue[0].jobId);
    return job;
  }

  async #process() {
    this.isProcessing = true;

    while(this.queue.length >= 2)
    {
        const job:Job = await this.pop();
        await this.processingFunction(job)
    }

    this.isProcessing = false;
  }

  async isExist(playerId:string)
  {
    return this.queue.find((job:any)=>job.playerId==playerId);
  }

}

export {SimpleQueue};
