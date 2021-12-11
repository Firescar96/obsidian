import axios from "axios";
import fs from 'fs';

const token = fs.readFileSync('openai_key.secret').toString()

class GPT3Interface {
  constructor() {
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async axiosProxy(args) {

    console.log(args)
    return await axios({
      ...args, 
      headers: this.headers, 
      url: '/completions',
      baseURL: 'https://api.openai.com/v1/engines/curie'})
  }
}

export default new GPT3Interface()