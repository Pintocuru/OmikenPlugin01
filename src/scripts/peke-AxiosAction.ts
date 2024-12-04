// src/scripts/AxiosAction.js

// axiosを使ってGETする
export const get = async (url: any, config = {}) => {
  const axios = require("axios");
  try {
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    console.error("Error in GET request:", error);
    throw error;
  }
}

// axiosを使ってPOSTする
export const post = async (url: any, data: any, config = {}) => {
  const axios = require("axios");
  try {
    const response = await axios.post(url, data, config);
    return response.data;
  } catch (error) {
    console.error("Error in POST request:", error);
    throw error;
  }
}

// 遅延function
export const delayTime = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, Math.max(ms * 1000, 0)));
};