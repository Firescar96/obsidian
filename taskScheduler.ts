import {JobOptions} from './databaseInterface';
import {execSync} from 'child_process';
import job1 from './jobs/fatInsulter.ts';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class TaskScheduler {
  constructor() {
    this.jobs = {};
  }

  async start() {
    while(true) {
      await job1();
      await sleep(5000);
    }
  }

  add(job) {
    this.jobs[job.name] = job
  }

  remove(jobId) {
    delete this.jobs[jobId]
  }
}



export default new TaskScheduler();