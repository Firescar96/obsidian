import fs from 'fs'

interface JobOptions {
  name: string,
  path: string,
}

interface BasicDatabase {
  filePath: string,
  data: {
      jobs: {[key: string]: JobOptions},
      userState: {[key: number]: {[flag: string]: string}}
  }
}

class BasicDatabase implements BasicDatabase {
  constructor(filePath:string) {
        this.filePath = filePath;

        // touch database file in case it doesn't exist yet
        fs.closeSync(fs.openSync(filePath, 'a'));

        const rawData = fs.readFileSync(this.filePath).toString();

        if(rawData) {
            this.data = JSON.parse(rawData) 
        } else {
            this.data = {jobs: {}, userState: {}}
            this.save();
        }
  }

  hasJob(name:string) {
      return !!this.data.jobs[name];
  }

  addJob(job: JobOptions) {
      this.data.jobs[job.name] = job;
      this.save();
  }

  removeJob(jobName: string) {
      delete this.data.jobs[jobName];
      this.save();
  }

  save() {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data))
  }
}
const database = new BasicDatabase('database.json');

export default database;
export {JobOptions};